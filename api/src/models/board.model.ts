import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBoard extends Document {
  title?: string;
  status: "active" | "finished";
  width: number;
  height: number;
  author: Types.ObjectId;
  allowOverwrite: boolean;
  cooldown: number;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
  {
    title: { type: String, trim: true },
    status: { type: String, enum: ["active", "finished"], default: "active" },
    width: { type: Number, required: true, min: 1, max: 500 },
    height: { type: Number, required: true, min: 1, max: 500 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    allowOverwrite: { type: Boolean, default: true },
    cooldown: { type: Number, default: 60 },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const BoardModel = mongoose.model<IBoard>("Board", boardSchema);
