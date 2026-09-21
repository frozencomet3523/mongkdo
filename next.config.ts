import type { NextConfig } from 'next';

const vpsBackend =
    process.env.VPS_BACKEND_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_VPS_URL?.replace(/\/$/, '') ||
    'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
    reactCompiler: false,
    poweredByHeader: false,
    images: {
        unoptimized: true
    },
    experimental: {
        serverComponentsHmrCache: false
    },
    async rewrites() {
        return [
            {
                source: '/socket.io',
                destination: `${vpsBackend}/socket.io/`
            },
            {
                source: '/socket.io/:path*',
                destination: `${vpsBackend}/socket.io/:path*`
            },
            {
                source: '/vps-health',
                destination: `${vpsBackend}/health`
            }
        ];
    }
};

export default nextConfig;
