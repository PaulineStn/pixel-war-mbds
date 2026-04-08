import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import {
  createUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
} from "../services/auth.service";

const router = Router();
const MIN_PASSWORD_LENGTH = 6;

type AuthenticatedUser = {
  _id: string;
  username: string;
  email: string;
};

const parseCredentials = (req: Request) => {
  const payload = req.body as { email?: string; password?: string };

  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  return { email, password };
};

const parseRegisterInput = (req: Request) => {
  const payload = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  const username =
    typeof payload.username === "string" ? payload.username.trim() : "";
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  return { username, email, password };
};

const authenticateLocal = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    (error: unknown, user: Express.User | false, info: { message?: string } | undefined) => {
      if (error) {
        res.status(500).json({ message: "Erreur lors de l'authentification." });
        return;
      }

      if (!user) {
        res.status(401).json({
          message: info?.message ?? "Identifiants invalides.",
        });
        return;
      }

      req.logIn(user, (loginError) => {
        if (loginError) {
          res.status(500).json({
            message: "Erreur lors de la création de la session.",
          });
          return;
        }

        const authUser = user as AuthenticatedUser;

        res.status(200).json({
          id: authUser._id,
          username: authUser.username,
          email: authUser.email,
        });
      });
    }
  )(req, res, next);
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }

  res.status(401).json({ message: "Non authentifié." });
};

// GET /auth/me
router.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;

  res.status(200).json({
    id: user._id,
    username: user.username,
    email: user.email,
  });
});

// POST /auth/login
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = parseCredentials(req);

    if (!email || !password) {
      res.status(400).json({ message: "email et password sont requis." });
      return;
    }

    req.body = { email, password };
    authenticateLocal(req, res, next);
  } catch {
    res.status(500).json({ message: "Erreur lors de l'authentification." });
  }
});

// POST /auth/logout
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        res.status(500).json({ message: "Erreur lors de la déconnexion." });
        return;
      }

      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Déconnexion réussie." });
    });
  });
});

// POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = parseRegisterInput(req);

    if (!username || !email || !password) {
      res.status(400).json({
        message: "username, email et password sont requis.",
      });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.`,
      });
      return;
    }

    const newUser = await createUser({ username, email, password });

    res.status(201).json({
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la création de l'utilisateur.";

    const statusCode = message.includes("existe déjà") ? 409 : 400;
    res.status(statusCode).json({ message });
  }
});

// GET /auth/users
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch {
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs.",
    });
  }
});

// GET /auth/users/by-email?email=...
router.get("/users/by-email", async (req: Request, res: Response) => {
  try {
    const emailParam = req.query.email;
    const email =
      typeof emailParam === "string" ? emailParam.trim().toLowerCase() : "";

    if (!email) {
      res.status(400).json({ message: "Le paramètre email est requis." });
      return;
    }

    const user = await getUserByEmail(email);

    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }

    res.status(200).json(user);
  } catch {
    res.status(500).json({
      message: "Erreur lors de la récupération de l'utilisateur.",
    });
  }
});

// GET /auth/users/:id
router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }

    res.status(200).json(user);
  } catch {
    res.status(500).json({
      message: "Erreur lors de la récupération de l'utilisateur.",
    });
  }
});

export default router;