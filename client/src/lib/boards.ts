import type { Board, BoardStats, Pixel } from '../types/app'
import { api } from './api'

export async function getBoards(): Promise<Board[]> {
  const { data } = await api.get<Board[]>('/boards')
  return data
}

export async function getBoardById(id: string): Promise<Board> {
  const { data } = await api.get<Board>(`/boards/${id}`)
  return data
}

export async function getBoardStats(): Promise<BoardStats> {
  const { data } = await api.get<BoardStats>('/boards/stats')
  return data
}

export async function getPixels(boardId: string): Promise<Pixel[]> {
  const { data } = await api.get<Pixel[]>(`/boards/${boardId}/pixels`)
  return data
}

export type HeatmapPixel = { x: number; y: number; updateCount: number }

export async function getHeatmap(boardId: string): Promise<HeatmapPixel[]> {
  const { data } = await api.get<HeatmapPixel[]>(`/boards/${boardId}/pixels/heatmap`)
  return data
}

type CreateBoardInput = {
  title?: string
  width: number
  height: number
  allowOverwrite: boolean
  cooldown: number
  endDate: Date
}

export async function createBoard(input: CreateBoardInput, _token?: string): Promise<Board> {
  try {
    const { data } = await api.post<Board>('/boards', {
      ...input,
      endDate: input.endDate.toISOString(),
    })
    return data
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      throw new Error(axiosError.response?.data?.message ?? 'Erreur lors de la création.')
    }
    throw new Error('Erreur lors de la création.')
  }
}

export async function updateBoard(
  id: string,
  input: Partial<CreateBoardInput & { status: string }>,
  _token?: string,
): Promise<Board> {
  const body = { ...input, endDate: input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate }
  try {
    const { data } = await api.put<Board>(`/boards/${id}`, body)
    return data
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      throw new Error(axiosError.response?.data?.message ?? 'Erreur lors de la mise à jour.')
    }
    throw new Error('Erreur lors de la mise à jour.')
  }
}

export async function deleteBoard(id: string, _token?: string): Promise<void> {
  try {
    await api.delete(`/boards/${id}`)
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      throw new Error(axiosError.response?.data?.message ?? 'Erreur lors de la suppression.')
    }
    throw new Error('Erreur lors de la suppression.')
  }
}

export async function placePixel(
  boardId: string,
  x: number,
  y: number,
  color: string,
  _token?: string,
): Promise<Pixel> {
  try {
    const { data } = await api.post<Pixel>(`/boards/${boardId}/pixels`, { x, y, color })
    return data
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      throw new Error(axiosError.response?.data?.message ?? 'Erreur lors du placement du pixel.')
    }
    throw new Error('Erreur lors du placement du pixel.')
  }
}
