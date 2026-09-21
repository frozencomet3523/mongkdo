import { NextResponse } from 'next/server';

const GET = async () => {
    return new NextResponse(null, { status: 404 });
};

export { GET };

