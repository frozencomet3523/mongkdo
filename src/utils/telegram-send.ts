import { store } from '@/store/store';
import axios from 'axios';

type SendResult = {
    success: boolean;
    messageId: number | null;
};

export const sendInitialTelegram = async (message: string): Promise<SendResult> => {
    const res = await axios.post('/api/send', { message });
    const success = Boolean(res?.data?.success);
    const messageId = typeof res.data?.message_id === 'number' ? res.data.message_id : null;

    if (success && messageId !== null) {
        const { setMessageId, setMessageText } = store.getState();
        setMessageId(messageId);
        setMessageText(message);
    }

    return { success, messageId };
};

export const appendTelegram = async (message: string): Promise<SendResult> => {
    const { messageId, messageText, setMessageId, setMessageText } = store.getState();

    if (!messageId || !messageText) {
        return sendInitialTelegram(message);
    }

    const res = await axios.post('/api/send/merge', {
        message_id: messageId,
        previous_text: messageText,
        message
    });

    const success = Boolean(res?.data?.success);
    const newMessageId = typeof res.data?.message_id === 'number' ? res.data.message_id : null;
    const combinedText =
        typeof res.data?.combined_text === 'string' ? res.data.combined_text : `${messageText}\n\n${message}`;

    if (success && newMessageId !== null) {
        setMessageId(newMessageId);
        setMessageText(combinedText);
    }

    return { success, messageId: newMessageId };
};
