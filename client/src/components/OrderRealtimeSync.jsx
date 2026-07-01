import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SERVER_URL } from '../services/api.js';

export const OrderRealtimeSync = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return undefined;

    const socket = io(SERVER_URL || undefined, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      socket.emit('join:user', userId);
      if (isAdmin) socket.emit('join:admin', user.role);
    });

    const refreshOrders = () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });

      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      }
    };

    socket.on('order:created', refreshOrders);
    socket.on('order:updated', refreshOrders);

    return () => {
      socket.off('order:created', refreshOrders);
      socket.off('order:updated', refreshOrders);
      socket.disconnect();
    };
  }, [isAdmin, queryClient, user]);

  return null;
};
