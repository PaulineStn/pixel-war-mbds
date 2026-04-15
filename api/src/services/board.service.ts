import { Types } from "mongoose";
import { BoardModel, IBoard } from "../models/board.model";
import { UserModel } from "../models/user.model";

interface CreateBoardInput {
  title?: string;
  width: number;
  height: number;
  author: string;
  allowOverwrite: boolean;
  cooldown: number;
  endDate: Date;
}

export const getAllBoards = async () => {
  const boards = await BoardModel.find()
    .populate("author", "username email")
    .sort({ createdAt: -1 });

  // Auto-update status if board has expired
  const now = new Date();
  await Promise.all(
    boards
      .filter((b) => b.status === "active" && b.endDate < now)
      .map((b) => BoardModel.updateOne({ _id: b._id }, { status: "finished" }))
  );

  // Return updated boards
  return BoardModel.find()
    .populate("author", "username email")
    .sort({ createdAt: -1 });
};

export const getBoardById = async (id: string) => {
  const board = await BoardModel.findById(id).populate("author", "username email");

  // Auto-update status if board has expired
  if (board && board.status === "active" && board.endDate < new Date()) {
    await BoardModel.updateOne({ _id: id }, { status: "finished" });
    return BoardModel.findById(id).populate("author", "username email");
  }

  return board;
};

export const createBoard = async (input: CreateBoardInput): Promise<IBoard> => {
  const board = new BoardModel({
    ...input,
    author: new Types.ObjectId(input.author),
    status: "active",
  });
  return board.save();
};

export const updateBoard = async (
  id: string,
  updates: Partial<CreateBoardInput & { status: string }>
) => {
  return BoardModel.findByIdAndUpdate(id, updates, { new: true }).populate(
    "author",
    "username email"
  );
};

export const deleteBoard = async (id: string) => {
  return BoardModel.findByIdAndDelete(id);
};

export const getBoardStats = async () => {
  const [totalUsers, totalBoards, activeBoards, finishedBoards] =
    await Promise.all([
      UserModel.countDocuments(),
      BoardModel.countDocuments(),
      BoardModel.countDocuments({ status: "active" }),
      BoardModel.countDocuments({ status: "finished" }),
    ]);
  return { totalUsers, totalBoards, activeBoards, finishedBoards };
};
