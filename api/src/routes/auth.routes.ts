import { Router, Request, Response, NextFunction } from "express";
import {
  createUser,
  getAllUsers,
  getUserByEmail,
  getUserByEmailWithPassword,
  getUserById,
  verifyPassword,
} from "../services/auth.service";
import { createToken, verifyToken } from "../services/jwt.service";

const router = Router();
const MIN_PASSWORD_LENGTH = 6;

type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
};

type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
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

const parseBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

const toAuthenticatedUser = (user: { _id: unknown; username: string; email: string }): AuthenticatedUser => ({
  id: String(user._id),
  username: user.username,
  email: user.email,
});

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = parseBearerToken(req.header("authorization"));
    if (!token) {
      res.status(401).json({ message: "Token Bearer manquant." });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ message: "Token invalide ou expiré." });
      return;
    }

    const user = await getUserById(payload.sub);
    if (!user) {
      res.status(401).json({ message: "Utilisateur non trouvé pour ce token." });
      return;
    }

    req.authUser = toAuthenticatedUser(user);
    next();
  } catch {
    res.status(500).json({ message: "Erreur lors de la vérification du token." });
  }
};

// GET /auth/me
router.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: "Non authentifié." });
    return;
  }

  res.status(200).json(req.authUser);
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = parseCredentials(req);

    if (!email || !password) {
      res.status(400).json({ message: "email et password sont requis." });
      return;
    }

    const user = await getUserByEmailWithPassword(email);
    if (!user || !user.password) {
      res.status(401).json({ message: "Identifiants invalides." });
      return;
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      res.status(401).json({ message: "Identifiants invalides." });
      return;
    }

    const authUser = toAuthenticatedUser(user);
    const token = createToken({
      sub: authUser.id,
      username: authUser.username,
      email: authUser.email,
    });

    res.status(200).json({
      token,
      user: authUser,
    });
  } catch {
    res.status(500).json({ message: "Erreur lors de l'authentification." });
  }
});

// POST /auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  // JWT is stateless: client removes the token locally.
  res.status(200).json({ message: "Déconnexion réussie." });
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
    const authUser = toAuthenticatedUser(newUser);
    const token = createToken({
      sub: authUser.id,
      username: authUser.username,
      email: authUser.email,
    });

    res.status(201).json({
      token,
      user: authUser,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors de la création de l'utilisateur.";

    if (message.toLowerCase().includes("requires authentication")) {
      res.status(500).json({
        message:
          "Erreur de configuration MongoDB: authentification requise. Vérifie MONGODB_URI ou MONGODB_USER/MONGODB_PASSWORD.",
      });
      return;
    }

    const statusCode = message.includes("existe déjà") ? 409 : 400;
    res.status(statusCode).json({ message });
  }
});

// GET /auth/users
router.get("/users", requireAuth, async (_req: Request, res: Response) => {
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
router.get("/users/by-email", requireAuth, async (req: Request, res: Response) => {
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
router.get("/users/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";

    if (!id) {
      res.status(400).json({ message: "Identifiant utilisateur invalide." });
      return;
    }

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
