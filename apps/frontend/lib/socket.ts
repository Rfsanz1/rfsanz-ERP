import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (typeof window === 'undefined') {
    throw new Error('Socket client can only be created in the browser');
  }

  const token = window.localStorage.getItem('erp_token');

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      auth: {
        token,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 800,
    });
  }

  return socket;
};
