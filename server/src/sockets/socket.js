import { Server } from 'socket.io';
import { env } from '../config/env.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('join:user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('join:admin', (role) => {
      if (role === 'admin') socket.join('admin');
    });
  });

  return io;
};

export const emitOrderEvent = (event, payload) => {
  if (!io) return;

  io.to('admin').emit(event, payload);
  if (payload?.user) {
    io.to(`user:${payload.user}`).emit(event, payload);
  }
};
