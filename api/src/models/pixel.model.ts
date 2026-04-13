import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPixel extends Document {
  board: Types.ObjectId;
  x: number;
  y: number;
  color: string;
  placedBy?: Types.ObjectId;
  placedAt: Date;
  updateCount: number;
}

const pixelSchema = new Schema<IPixel>({
  board: { type: Schema.Types.ObjectId, ref: "Board", required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  color: { type: String, required: true, match: /^#[0-9A-Fa-f]{6}$/ },
  placedBy: { type: Schema.Types.ObjectId, ref: "User" },
  placedAt: { type: Date, default: Date.now },
  updateCount: { type: Number, default: 1 },
});

pixelSchema.index({ board: 1, x: 1, y: 1 });

export const PixelModel = mongoose.model<IPixel>("Pixel", pixelSchema);
