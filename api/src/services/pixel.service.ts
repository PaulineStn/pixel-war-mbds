import { Types } from "mongoose";
import { PixelModel } from "../models/pixel.model";
import { BoardModel } from "../models/board.model";
import { UserModel } from "../models/user.model";
import { getIO } from "../socket";

export const getPixelsByBoard = async (boardId: string) => {
  return PixelModel.find({ board: new Types.ObjectId(boardId) }).populate(
    "placedBy",
    "username"
  );
};

interface PlacePixelInput {
  boardId: string;
  x: number;
  y: number;
  color: string;
  userId?: string;
}

export const placePixel = async ({
  boardId,
  x,
  y,
  color,
  userId,
}: PlacePixelInput) => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new Error("PixelBoard introuvable.");

  if (board.status === "finished" || board.endDate < new Date()) {
    throw new Error("Ce PixelBoard est terminé.");
  }

  if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
    throw new Error("Coordonnées hors limites.");
  }

  if (userId) {
    const lastPixel = await PixelModel.findOne({
      board: new Types.ObjectId(boardId),
      placedBy: new Types.ObjectId(userId),
    }).sort({ placedAt: -1 });

    if (lastPixel) {
      const elapsedSeconds = (Date.now() - lastPixel.placedAt.getTime()) / 1000;
      if (elapsedSeconds < board.cooldown) {
        const remaining = Math.ceil(board.cooldown - elapsedSeconds);
        throw new Error(`Cooldown actif. Réessayez dans ${remaining} secondes.`);
      }
    }
  }

  if (!board.allowOverwrite) {
    const existing = await PixelModel.findOne({
      board: new Types.ObjectId(boardId),
      x,
      y,
    });
    if (existing) {
      throw new Error(
        "Ce pixel est déjà utilisé et le mode overwrite est désactivé."
      );
    }
  }

  const pixel = await PixelModel.findOneAndUpdate(
    { board: new Types.ObjectId(boardId), x, y },
    {
      $set: {
        color,
        placedBy: userId ? new Types.ObjectId(userId) : undefined,
        placedAt: new Date(),
      },
      $inc: { updateCount: 1 },
    },
    { upsert: true, new: true }
  ).populate("placedBy", "username");

  if (userId) {
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { totalPixelsPlaced: 1 },
      $addToSet: { participatedBoards: new Types.ObjectId(boardId) },
    });
  }

  // Émettre en temps réel à tous les clients connectés sur ce board
  getIO()?.to(`board:${boardId}`).emit("pixel:placed", pixel);

  return pixel;
};

export const getHeatmap = async (boardId: string) => {
  return PixelModel.find(
    { board: new Types.ObjectId(boardId) },
    { x: 1, y: 1, updateCount: 1, _id: 0 }
  );
};

export const getUserContributions = async (userId: string) => {
  const user = await UserModel.findById(userId).populate({
    path: "participatedBoards",
    select: "_id title status endDate width height author",
  });

  const pixels = await PixelModel.find({
    placedBy: new Types.ObjectId(userId),
  }).populate({
    path: "board",
    select: "_id title status endDate width height author",
  });

  console.log(`[getUserContributions] User ${userId}: Found ${pixels.length} currently owned pixels`);

  const boardMap = new Map<string, any>();

  // Use currently owned pixels' boards
  for (const pixel of pixels) {
    if (!pixel.board) continue;
    const boardId = (pixel.board as any)._id.toString();
    if (!boardMap.has(boardId)) {
      boardMap.set(boardId, pixel.board);
    }
  }

  // Use boards the user permanently participated in
  let totalPixels = pixels.length;
  if (user) {
    if (user.participatedBoards) {
      for (const board of user.participatedBoards as any[]) {
        if (!board) continue;
        const boardId = board._id.toString();
        if (!boardMap.has(boardId)) {
          boardMap.set(boardId, board);
        }
      }
    }
    // Update totalPixels to not go down using user's permanent counter
    if (user.totalPixelsPlaced > totalPixels) {
      totalPixels = user.totalPixelsPlaced;
    }
  }

  console.log(`[getUserContributions] Returning ${boardMap.size} unique boards`);
  return {
    totalPixels,
    boards: Array.from(boardMap.values()),
  };
};
