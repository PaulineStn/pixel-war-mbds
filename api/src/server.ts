import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "node:http";
import userRouter from "./routes/auth.routes";
import boardRouter from "./routes/board.routes";
import pixelRouter from "./routes/pixel.routes";
import { initSocket } from "./socket";
import { UserModel } from "./models/user.model";
import { hashPassword } from "./services/auth.service";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_HOST = process.env.MONGODB_HOST ?? "127.0.0.1";
const MONGODB_PORT = Number(process.env.MONGODB_PORT ?? 27017);
const MONGODB_DB = process.env.MONGODB_DB ?? "pixel-war";
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const envAllowedOrigins = CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

const getMongoUri = () => {
  if (MONGODB_URI) {
    console.log("Using MONGODB_URI from env");
    return MONGODB_URI;
  }

  if (MONGODB_USER && MONGODB_PASSWORD) {
    const username = encodeURIComponent(MONGODB_USER);
    const password = encodeURIComponent(MONGODB_PASSWORD);
    const uri = `mongodb://${username}:${password}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DB}?authSource=admin`;
    console.log("Using constructed URI:", uri);
    return uri;
  }

  console.log("Using default URI without auth");
  return `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DB}`;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin non autorisée par CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", userRouter);
app.use("/boards", boardRouter);
app.use("/boards/:id/pixels", pixelRouter);

app.get("/", (_req, res) => {
  res.send("API Pixel War running");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Créer le serveur HTTP et y attacher Socket.io
const httpServer = createServer(app);
initSocket(httpServer, allowedOrigins);

// Connexion MongoDB + lancement serveur
mongoose
  .connect(getMongoUri())
  .then(async () => {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Connexion MongoDB établie mais base de données indisponible.");
    }
    console.log("MongoDB connected");

    // Seed admin user
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@admin.com";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const adminUsername = process.env.ADMIN_USERNAME ?? "admin";

    const existing = await UserModel.findOne({ email: adminEmail });
    if (!existing) {
      const hashed = await hashPassword(adminPassword);
      await UserModel.create({ username: adminUsername, email: adminEmail, password: hashed, isAdmin: true });
      console.log(`Admin créé: ${adminEmail}`);
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection/auth error:", error);
  });
