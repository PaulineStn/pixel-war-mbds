import { Router, Request, Response } from "express";
import {
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware";
import {
  getAllBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  getBoardStats,
} from "../services/board.service";

const router = Router();

// GET /boards/stats — statistiques publiques pour la homepage
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getBoardStats();
    res.json(stats);
  } catch {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des statistiques." });
  }
});

// GET /boards — liste tous les boards (public)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const boards = await getAllBoards();
    res.json(boards);
  } catch {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des boards." });
  }
});

// GET /boards/:id — détail d'un board (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const board = await getBoardById(String(req.params.id));
    if (!board) {
      res.status(404).json({ message: "PixelBoard introuvable." });
      return;
    }
    res.json(board);
  } catch {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du board." });
  }
});

// POST /boards — créer un board (admin uniquement)
router.post(
  "/",
  ...requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, width, height, allowOverwrite, cooldown, endDate } =
        req.body as {
          title?: string;
          width?: number;
          height?: number;
          allowOverwrite?: boolean;
          cooldown?: number;
          endDate?: string;
        };

      if (!width || !height || !endDate) {
        res
          .status(400)
          .json({ message: "width, height et endDate sont requis." });
        return;
      }

      const board = await createBoard({
        title,
        width: Number(width),
        height: Number(height),
        author: req.authUser!.id,
        allowOverwrite: allowOverwrite ?? true,
        cooldown: cooldown ?? 60,
        endDate: new Date(endDate),
      });

      res.status(201).json(board);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du board.";
      res.status(400).json({ message });
    }
  }
);

// PUT /boards/:id — modifier un board (admin uniquement)
router.put(
  "/:id",
  ...requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const board = await updateBoard(String(req.params.id), req.body as Parameters<typeof updateBoard>[1]);
      if (!board) {
        res.status(404).json({ message: "PixelBoard introuvable." });
        return;
      }
      res.json(board);
    } catch {
      res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour du board." });
    }
  }
);

// DELETE /boards/:id — supprimer un board (admin uniquement)
router.delete(
  "/:id",
  ...requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const board = await deleteBoard(String(req.params.id));
      if (!board) {
        res.status(404).json({ message: "PixelBoard introuvable." });
        return;
      }
      res.status(204).send();
    } catch {
      res
        .status(500)
        .json({ message: "Erreur lors de la suppression du board." });
    }
  }
);

export default router;
