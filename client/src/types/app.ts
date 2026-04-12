export type WarStatus = 'active' | 'finished'

export type PixelWar = {
  id: number
  codeName: string
  subtitle: string
  pixels: string
  players: number
  status: WarStatus
  label?: string
}

export type Theme = 'dark' | 'light'

export type AuthSession = {
  id: string
  username: string
  email: string
  token: string
  isAdmin: boolean
}

export type Board = {
  _id: string
  title?: string
  status: 'active' | 'finished'
  width: number
  height: number
  author: { _id: string; username: string; email: string }
  allowOverwrite: boolean
  cooldown: number
  endDate: string
  createdAt: string
}

export type Pixel = {
  _id: string
  board: string
  x: number
  y: number
  color: string
  placedBy?: { _id: string; username: string }
  placedAt: string
}

export type BoardStats = {
  totalUsers: number
  totalBoards: number
  activeBoards: number
  finishedBoards: number
}
