import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt.service";
import { getUserById } from "../services/auth.service";

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
};

export type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
};

const parseBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
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
      res.status(401).json({ message: "Utilisateur non trouvé." });
      return;
    }

    req.authUser = {
      id: String(user._id),
      username: user.username,
      email: user.email,
      isAdmin: (user as unknown as { isAdmin?: boolean }).isAdmin ?? false,
    };
    next();
  } catch {
    res.status(500).json({ message: "Erreur lors de la vérification du token." });
  }
};

const checkAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.authUser?.isAdmin) {
    res.status(403).json({ message: "Accès réservé aux administrateurs." });
    return;
  }
  next();
};

export const requireAdmin = [requireAuth, checkAdmin];
