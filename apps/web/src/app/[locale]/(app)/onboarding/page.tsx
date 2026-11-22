'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Briefcase, Globe, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('Sarah Miller');
  const [workspaceName, setWorkspaceName] = useState('Sarah Creatives');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState(locale);

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (step === 2 && !workspaceName.trim()) {
      toast.error('Please enter your workspace name');
      return;
    }
    if (step < 3) {
      setStep((prev) => (prev + 1) as any);
    } else {
      toast.success('Workspace initialized successfully!');
      router.push(`/${locale}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-background to-background">
      <div className="mb-6 flex items-center justify-center">
        <OrbitlyLogo size={42} />
      </div>

      <div className="w-full max-w-xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[
            { id: 1, label: t('step1'), icon: User },
            { id: 2, label: t('step2'), icon: Briefcase },
            { id: 3, label: t('step3'), icon: Globe },
          ].map((item) => {
            const Icon = item.icon;
            const isDone = step > item.id;
            const isCurrent = step === item.id;

            return (
              <div key={item.id} className="flex flex-col items-center gap-1.5 flex-1 text-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md shadow-primary/20'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Card */}
        <Card className="bg-card/95 backdrop-blur-xl shadow-2xl border border-border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === 1 && 'Personalize Your Profile'}
              {step === 2 && 'Set Up Your Workspace'}
              {step === 3 && 'Localization & Publishing Time'}
            </CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground">What should we call you?</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This will be shown on team discussions, post approval requests, and invitations.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground">Workspace Name</label>
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Agency or Personal Brand"
                  autoFocus
                />
                <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs text-muted-foreground">
                  Generated Workspace URL:{' '}
                  <span className="font-mono text-primary font-semibold">
                    app.orbitly.com/{workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-workspace'}
                  </span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Timezone for Scheduling</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-sm font-medium"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST / EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                    <option value="Europe/London">Europe/London (GMT / BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET / CEST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    All post schedules will display in this timezone, while stored safely in UTC.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Preferred Platform Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-sm font-medium"
                  >
                    <option value="en">English (US)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="pt">Português (BR)</option>
                    <option value="ar">العربية (Arabic - RTL)</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border pt-4">
            {step > 1 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => (s - 1) as any)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                {t('back')}
              </Button>
            ) : (
              <div />
            )}

            <Button variant="gradient" size="sm" onClick={handleNext}>
              {step === 3 ? t('finish') : t('next')}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
