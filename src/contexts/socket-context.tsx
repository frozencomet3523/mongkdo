'use client';

import { SocketContext } from '@/contexts/socket-context-value';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

interface SocketProviderProps {
    children: ReactNode;
    url?: string;
}

const VPS_URL = process.env.NEXT_PUBLIC_VPS_URL?.replace(/\/$/, '') || '';

const SocketProvider = ({ children, url }: SocketProviderProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const pageIsHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        // Luôn ưu tiên same-origin để Next rewrite /socket.io → VPS (local + Vercel).
        const origin =
            url ||
            (typeof window !== 'undefined'
                ? window.location.origin
                : VPS_URL || '');
        if (!origin) {
            return;
        }

        const client = io(origin, {
            path: '/socket.io',
            transports: pageIsHttps ? ['polling'] : ['polling', 'websocket'],
            upgrade: !pageIsHttps,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        const frame = requestAnimationFrame(() => {
            setSocket(client);
        });

        client.on('connect', () => setIsConnected(true));
        client.on('disconnect', () => setIsConnected(false));
        client.on('connect_error', (err) => {
            setIsConnected(false);
            console.warn('socket connect_error:', err.message, 'origin=', origin);
        });

        return () => {
            cancelAnimationFrame(frame);
            client.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [url]);

    const value = useMemo(
        () => ({
            socket,
            isConnected
        }),
        [socket, isConnected]
    );

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketProvider;
