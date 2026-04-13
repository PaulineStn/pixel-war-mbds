import { Router, Request, Response } from "express";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware";
import { getPixelsByBoard, placePixel, getHeatmap } from "../services/pixel.service";

// mergeParams permet d'accéder à :id du router parent (/boards/:id/pixels)
const router = Router({ mergeParams: true });

// GET /boards/:id/pixels — état du board (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const pixels = await getPixelsByBoard(String(req.params.id));
    res.json(pixels);
  } catch {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des pixels." });
  }
});

// GET /boards/:id/pixels/heatmap — heatmap des pixels (public)
router.get("/heatmap", async (req: Request, res: Response) => {
  try {
    const data = await getHeatmap(String(req.params.id));
    res.json(data);
  } catch {
    res.status(500).json({ message: "Erreur lors de la récupération de la heatmap." });
  }
});

// POST /boards/:id/pixels — placer un pixel (auth requis)
router.post(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { x, y, color } = req.body as {
        x?: number;
        y?: number;
        color?: string;
      };

      if (x === undefined || y === undefined || !color) {
        res.status(400).json({ message: "x, y et color sont requis." });
        return;
      }

      const pixel = await placePixel({
        boardId: String(req.params.id),
        x: Number(x),
        y: Number(y),
        color,
        userId: req.authUser!.id,
      });

      res.status(201).json(pixel);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors du placement du pixel.";
      const isBadRequest =
        message.includes("Cooldown") ||
        message.includes("terminé") ||
        message.includes("désactivé") ||
        message.includes("limites") ||
        message.includes("introuvable");
      res.status(isBadRequest ? 400 : 500).json({ message });
    }
  }
);

export default router;
