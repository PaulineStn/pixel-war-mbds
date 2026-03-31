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
  email: string
}
