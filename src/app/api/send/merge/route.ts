import { deleteTelegramMessage, sendTelegramMessage } from '@/lib/telegram';
import { NextRequest, NextResponse } from 'next/server';

const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const previousText = typeof body.previous_text === 'string' ? body.previous_text.trim() : '';
        const messageId = typeof body.message_id === 'number' ? body.message_id : Number(body.message_id);

        if (!message) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        if (messageId && !Number.isNaN(messageId)) {
            await deleteTelegramMessage(messageId);
        }

        const combinedText = previousText ? `${previousText}\n\n${message}` : message;
        const { ok, messageId: newMessageId } = await sendTelegramMessage(combinedText);

        return NextResponse.json({
            success: ok,
            message_id: newMessageId,
            combined_text: combinedText
        });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
};

export { POST };
