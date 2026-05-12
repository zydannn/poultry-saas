'use client';

import { useState } from 'react';
import { ClipboardList, Egg, AlertTriangle, Skull, Wheat, Save } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DailyInputData {
    goodEggs: number;
    damagedEggs: number;
    mortality: number;
    feedUsed: number;
}

interface DailyInputFormProps {
    onSubmit?: (data: DailyInputData) => void;
}

export default function DailyInputForm({ onSubmit }: DailyInputFormProps) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<DailyInputData>({
        goodEggs: 0,
        damagedEggs: 0,
        mortality: 0,
        feedUsed: 0,
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (field: keyof DailyInputData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
        setSubmitted(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(formData);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    const fields: {
        key: keyof DailyInputData;
        labelKey: 'goodEggs' | 'damagedEggs' | 'mortality' | 'feedUsed';
        icon: React.ReactNode;
        unit: string;
        color: string;
    }[] = [
            {
                key: 'goodEggs',
                labelKey: 'goodEggs',
                icon: <Egg className="w-4 h-4" />,
                unit: 'butir',
                color: 'text-emerald-600',
            },
            {
                key: 'damagedEggs',
                labelKey: 'damagedEggs',
                icon: <AlertTriangle className="w-4 h-4" />,
                unit: 'butir',
                color: 'text-amber-500',
            },
            {
                key: 'mortality',
                labelKey: 'mortality',
                icon: <Skull className="w-4 h-4" />,
                unit: 'ekor',
                color: 'text-rose-500',
            },
            {
                key: 'feedUsed',
                labelKey: 'feedUsed',
                icon: <Wheat className="w-4 h-4" />,
                unit: 'kg',
                color: 'text-yellow-600',
            },
        ];

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="font-semibold text-card-foreground text-sm">{t('dailyInputTitle')}</h2>
                    <p className="text-xs text-muted-foreground">{t('dailyInputSub')}</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                    {new Date().toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {fields.map(({ key, labelKey, icon, unit, color }) => (
                        <div key={key} className="flex flex-col gap-1.5">
                            <label
                                htmlFor={key}
                                className={`flex items-center gap-1.5 text-xs font-medium ${color}`}
                            >
                                {icon}
                                {t(labelKey)}
                            </label>
                            <div className="relative">
                                <input
                                    id={key}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={formData[key] === 0 ? '' : formData[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    placeholder="0"
                                    className="w-full h-12 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                                    {unit}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                        {t('totalEggsLabel')}:{' '}
                        <span className="font-medium text-foreground">
                            {(formData.goodEggs + formData.damagedEggs).toLocaleString('id-ID')}
                        </span>{' '}
                        butir
                    </p>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 h-12 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all w-full sm:w-auto"
                    >
                        <Save className="w-4 h-4" />
                        {submitted ? t('saved') : t('saveData')}
                    </button>
                </div>
            </form>
        </div>
    );
}
