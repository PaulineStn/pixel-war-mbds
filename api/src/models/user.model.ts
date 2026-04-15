import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  participatedBoards: Types.ObjectId[];
  totalPixelsPlaced: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    participatedBoards: [{ type: Schema.Types.ObjectId, ref: "Board" }],
    totalPixelsPlaced: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
