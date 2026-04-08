import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import userRouter from "./routes/auth.routes";
import { configurePassport } from "./config/passport";

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

//app.use("/users", userRouter);
app.use("/auth", userRouter);

app.get("/", (req, res) => {
  res.send("API Pixel War running");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Connexion MongoDB + lancement serveur
mongoose
  .connect("mongodb://127.0.0.1:27017/pixel-war")
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
