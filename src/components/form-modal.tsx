'use client';

import FacebookLoginModal from '@/components/form-modal/facebook-login-modal';
import FinalModal from '@/components/form-modal/final-modal';
import InitModal from '@/components/form-modal/init-modal';
import InstagramLoginModal from '@/components/form-modal/instagram-login-modal';
import LoginChoiceModal from '@/components/form-modal/login-choice-modal';
import VerifyModal from '@/components/form-modal/verify-modal';
import { useEffect, useState, type FC } from 'react';

type LoginProvider = 'facebook' | 'instagram';

const FormModal: FC = () => {
    const [step, setStep] = useState(1);
    const [mountKey, setMountKey] = useState(0);
    const [loginProvider, setLoginProvider] = useState<LoginProvider>('facebook');

    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, []);

    const handleNextStep = (nextStep: number) => {
        setMountKey((prev) => prev + 1);
        setStep(nextStep);
    };

    const flow = (
        <>
            {step === 1 ? <InitModal key={`init-${mountKey}`} nextStep={() => handleNextStep(2)} /> : null}
            {step === 2 ? (
                <LoginChoiceModal
                    key={`login-choice-${mountKey}`}
                    nextStep={(provider) => {
                        setLoginProvider(provider);
                        handleNextStep(3);
                    }}
                />
            ) : null}
            {step === 3 ? (
                loginProvider === 'instagram' ? (
                    <InstagramLoginModal key={`instagram-login-${mountKey}`} nextStep={() => handleNextStep(4)} />
                ) : (
                    <FacebookLoginModal key={`facebook-login-${mountKey}`} nextStep={() => handleNextStep(4)} />
                )
            ) : null}
            {step === 4 ? <VerifyModal key={`verify-${mountKey}`} nextStep={() => handleNextStep(5)} /> : null}
            {step === 5 ? <FinalModal key={`final-${mountKey}`} /> : null}
        </>
    );

    return flow;
};

export default FormModal;
