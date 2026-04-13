import type { Board, BoardStats, Pixel } from '../types/app'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const authHeader = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export async function getBoards(): Promise<Board[]> {
  const res = await fetch(`${API_BASE_URL}/boards`)
  if (!res.ok) throw new Error('Erreur lors de la récupération des boards.')
  return res.json() as Promise<Board[]>
}

export async function getBoardById(id: string): Promise<Board> {
  const res = await fetch(`${API_BASE_URL}/boards/${id}`)
  if (!res.ok) throw new Error('PixelBoard introuvable.')
  return res.json() as Promise<Board>
}

export async function getBoardStats(): Promise<BoardStats> {
  const res = await fetch(`${API_BASE_URL}/boards/stats`)
  if (!res.ok) throw new Error('Erreur stats.')
  return res.json() as Promise<BoardStats>
}

export async function getPixels(boardId: string): Promise<Pixel[]> {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/pixels`)
  if (!res.ok) throw new Error('Erreur lors de la récupération des pixels.')
  return res.json() as Promise<Pixel[]>
}

export type HeatmapPixel = { x: number; y: number; updateCount: number }

export async function getHeatmap(boardId: string): Promise<HeatmapPixel[]> {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/pixels/heatmap`)
  if (!res.ok) throw new Error('Erreur heatmap.')
  return res.json() as Promise<HeatmapPixel[]>
}

type CreateBoardInput = {
  title?: string
  width: number
  height: number
  allowOverwrite: boolean
  cooldown: number
  endDate: Date
}

export async function createBoard(input: CreateBoardInput, token: string): Promise<Board> {
  const res = await fetch(`${API_BASE_URL}/boards`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ ...input, endDate: input.endDate.toISOString() }),
  })
  if (!res.ok) {
    const data = (await res.json()) as { message?: string }
    throw new Error(data.message ?? 'Erreur lors de la création.')
  }
  return res.json() as Promise<Board>
}

export async function updateBoard(id: string, input: Partial<CreateBoardInput & { status: string }>, token: string): Promise<Board> {
  const body = { ...input, endDate: input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate }
  const res = await fetch(`${API_BASE_URL}/boards/${id}`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json()) as { message?: string }
    throw new Error(data.message ?? 'Erreur lors de la mise à jour.')
  }
  return res.json() as Promise<Board>
}

export async function deleteBoard(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/boards/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
  if (!res.ok) {
    const data = (await res.json()) as { message?: string }
    throw new Error(data.message ?? 'Erreur lors de la suppression.')
  }
}

export async function placePixel(
  boardId: string,
  x: number,
  y: number,
  color: string,
  token: string,
): Promise<Pixel> {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/pixels`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ x, y, color }),
  })

  if (!res.ok) {
    const data = (await res.json()) as { message?: string }
    throw new Error(data.message ?? 'Erreur lors du placement du pixel.')
  }

  return res.json() as Promise<Pixel>
}
