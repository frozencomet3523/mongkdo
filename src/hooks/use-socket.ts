'use client';

import { SocketContext } from '@/contexts/socket-context-value';
import { useCallback, useContext, useEffect } from 'react';

export const useSocket = () => useContext(SocketContext);

export const useSocketEmit = () => {
    const { socket, isConnected } = useSocket();

    const emit = useCallback(
        (event: string, data?: unknown) => {
            socket?.emit(event, data);
        },
        [socket]
    );

    return { emit, isConnected, socket };
};

export const useSocketEvent = <T,>(event: string, handler: (data: T) => void) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on(event, handler);
        return () => {
            socket.off(event, handler);
        };
    }, [socket, event, handler]);
};
