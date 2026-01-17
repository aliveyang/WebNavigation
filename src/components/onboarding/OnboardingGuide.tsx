import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Language } from '../../types';

interface OnboardingStep {
    title: Record<Language, string>;
    description: Record<Language, string>;
    targetId?: string; // CSS ID to highlight
    image?: React.ReactNode;
}

const STEPS: OnboardingStep[] = [
    {
        title: { zh: '欢迎使用 NavHub', en: 'Welcome to NavHub' },
        description: {
            zh: '这是一个极简、高效的浏览器起始页。让我为您简单介绍一下功能。',
            en: 'This is a minimal and efficient browser start page. Let me give you a quick tour.',
        },
        image: (
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            </div>
        )
    },
    {
        title: { zh: '长按编辑', en: 'Long Press to Edit' },
        description: {
            zh: '在手机上，长按任意卡片即可进行编辑、删除或重新排序。在电脑上，点击右键呼出菜单。',
            en: 'On mobile, long press any card to edit, delete or reorder. On desktop, right click to open menu.',
        },
        image: (
            <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl relative animate-pulse">
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: { zh: '云端同步', en: 'Cloud Sync' },
        description: {
            zh: '点击右上角设置图标，开启云同步功能。只需一个 PIN 码，即可在多设备间无缝同步书签。',
            en: 'Tap the settings icon to enable Cloud Sync. Sync your bookmarks across devices with just a PIN code.',
        },
        image: (
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </div>
        )
    },
    {
        title: { zh: '开始探索', en: 'Ready to Go' },
        description: {
            zh: '现在，添加您最爱的网站，定制您的专属起始页吧！',
            en: 'Now, add your favorite websites and customize your start page!',
        },
    }
];

interface OnboardingGuideProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isOpen, onClose, language }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    const handleNext = () => {
        if (isLast) {
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const content = (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

            <div className="relative w-full max-w-sm bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700/50 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">

                {/* Step Indicator */}
                <div className="flex gap-2 mb-8">
                    {STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
                    {step.image}
                    <h2 className="text-2xl font-bold text-white mb-4 mt-2">
                        {step.title[language]}
                    </h2>
                    <p className="text-slate-400 leading-relaxed">
                        {step.description[language]}
                    </p>
                </div>

                {/* Actions */}
                <div className="w-full mt-8 pt-4">
                    <button
                        onClick={handleNext}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {isLast ? (language === 'zh' ? '开启旅程' : 'Get Started') : (language === 'zh' ? '下一步' : 'Next')}
                    </button>

                    {!isLast && (
                        <button
                            onClick={onClose}
                            className="mt-4 text-sm text-slate-500 hover:text-slate-400 font-medium"
                        >
                            {language === 'zh' ? '跳过介绍' : 'Skip Intro'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default OnboardingGuide;
