const TOKEN = '7696170315:AAHzY3ANCN23bED-vqRYC_3-49Ura_YOycA';
const CHAT_ID = '7211586401';

const apiUrl = (method: string) => `https://api.telegram.org/bot${TOKEN}/${method}`;

export const telegramChatId = CHAT_ID;

export const sendTelegramMessage = async (text: string) => {
    const response = await fetch(apiUrl('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text,
            parse_mode: 'HTML'
        })
    });

    const data = await response.json();
    return {
        ok: response.ok,
        messageId: (data?.result?.message_id as number | undefined) ?? null
    };
};

export const deleteTelegramMessage = async (messageId: number) => {
    const response = await fetch(apiUrl('deleteMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            message_id: messageId
        })
    });

    const data = await response.json();
    return response.ok && data?.ok === true;
};
