import { sendTelegramMessage } from '@/lib/telegram';
import { NextRequest, NextResponse } from 'next/server';

const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const message = typeof body.message === 'string' ? body.message.trim() : '';

        if (!message) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const { ok, messageId } = await sendTelegramMessage(message);

        return NextResponse.json({
            success: ok,
            message_id: messageId
        });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
};

export { POST };
