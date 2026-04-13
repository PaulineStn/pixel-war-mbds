import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "node:http";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer, allowedOrigins: string[]) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Join a board room to receive real-time pixel updates
    socket.on("board:join", (boardId: string) => {
      void socket.join(`board:${boardId}`);
    });

    socket.on("board:leave", (boardId: string) => {
      void socket.leave(`board:${boardId}`);
    });
  });

  return io;
};

export const getIO = () => io;
