import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Pixel } from '../types/app'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type UseSocketOptions = {
  boardId: string
  onPixelPlaced: (pixel: Pixel) => void
}

export function useSocket({ boardId, onPixelPlaced }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const onPixelPlacedRef = useRef(onPixelPlaced)

  // Keep callback ref up to date without reconnecting
  useEffect(() => {
    onPixelPlacedRef.current = onPixelPlaced
  }, [onPixelPlaced])

  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('board:join', boardId)
    })

    socket.on('pixel:placed', (pixel: Pixel) => {
      onPixelPlacedRef.current(pixel)
    })

    return () => {
      socket.emit('board:leave', boardId)
      socket.disconnect()
    }
  }, [boardId])
}
