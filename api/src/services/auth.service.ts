import { UserModel, IUser } from "../models/user.model";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);
const SCRYPT_KEY_LEN = 64;

export const getAllUsers = async (): Promise<IUser[]> => {
  return UserModel.find().select("-password");
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  return UserModel.findById(id).select("-password");
};

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  return UserModel.findOne({ email: normalizeEmail(email) }).select("-password");
};

export const getUserByEmailWithPassword = async (email: string): Promise<IUser | null> => {
  return UserModel.findOne({ email: normalizeEmail(email) }).select("+password");
};

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeUsername = (username: string) => username.trim();

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, SCRYPT_KEY_LEN)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [salt, hashHex] = passwordHash.split(":");
  if (!salt || !hashHex) {
    return false;
  }

  const hashBuffer = Buffer.from(hashHex, "hex");
  const candidate = (await scrypt(password, salt, hashBuffer.length)) as Buffer;
  return hashBuffer.length === candidate.length && timingSafeEqual(hashBuffer, candidate);
};

export const createUser = async ({
  username,
  email,
  password,
}: CreateUserInput): Promise<IUser> => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);

  const existingUser = await UserModel.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("Un utilisateur avec cet email existe déjà.");
  }

  const passwordHash = await hashPassword(password);

  const user = new UserModel({
    username: normalizedUsername,
    email: normalizedEmail,
    password: passwordHash,
  });

  return user.save();
};
