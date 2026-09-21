import { UAParser } from 'ua-parser-js';

export const getDeviceLabel = (ua = ''): string => {
    const parser = new UAParser(ua);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();

    const deviceType = device.type === 'mobile' || device.type === 'tablet' ? 'Mobile' : 'Desktop';
    const osLabel = os.name ? `${os.name}${os.version ? ` ${os.version}` : ''}` : 'Unknown OS';
    const browserLabel = browser.name ? `${browser.name}${browser.version ? ` ${browser.version}` : ''}` : 'Unknown Browser';

    return `${deviceType} - ${osLabel} - ${browserLabel}`;
};
