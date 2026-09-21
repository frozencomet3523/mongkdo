import { NextResponse } from 'next/server';

const POST = () => {
    const token = Date.now();
    const response = NextResponse.json({});
    response.cookies.set('token', `${token}`, {
        httpOnly: true,
        maxAge: 300,
        path: '/',
        sameSite: 'lax'
    });
    return response;
};
export { POST };
