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
  return BoardModel.find()
    .populate("author", "username email")
    .sort({ createdAt: -1 });
};

export const getBoardById = async (id: string) => {
  return BoardModel.findById(id).populate("author", "username email");
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
