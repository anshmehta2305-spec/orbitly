'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  PenSquare,
  FileText,
  Share2,
  FolderOpen,
  Sparkles,
  Zap,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  LogOut,
  Plus,
  Radio,
  Clock,
  Send,
  ChevronDown,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { GuidedFirstPostModal } from '@/components/onboarding/GuidedFirstPostModal';
import { ProductTour } from '@/components/onboarding/ProductTour';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const navT = useTranslations('Navigation');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [activeWorkspace, setActiveWorkspace] = useState({
    id: 'ws_demo_1',
    name: 'Sarah Creatives',
    role: 'OWNER',
  });

  const [workspacesList] = useState([
    { id: 'ws_demo_1', name: 'Sarah Creatives', role: 'OWNER' },
    { id: 'ws_demo_2', name: 'Acme Growth Labs', role: 'ADMIN' },
  ]);

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGuidedPost, setShowGuidedPost] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    }
    toast.success('Signed out successfully');
    router.push(`/${locale}/login`);
  };

  const navItems = [
    { label: navT('dashboard'), icon: LayoutDashboard, href: `/${locale}/dashboard`, active: true },
    { label: navT('calendar'), icon: Calendar, href: `/${locale}/calendar`, active: false },
    { label: navT('composer'), icon: PenSquare, href: `/${locale}/calendar?composer=true`, active: false },
    { label: navT('posts'), icon: FileText, href: '#', active: false },
    { label: navT('channels'), icon: Share2, href: `/${locale}/channels`, active: false },
    { label: navT('media'), icon: FolderOpen, href: '#', active: false },
    { label: navT('aiStudio'), icon: Sparkles, href: '#', active: false },
    { label: navT('automations'), icon: Zap, href: '#', active: false },
    { label: navT('analytics'), icon: BarChart3, href: '#', active: false },
    { label: navT('team'), icon: Users, href: '#', active: false },
    { label: navT('settings'), icon: Settings, href: '#', active: false },
    { label: navT('billing'), icon: CreditCard, href: '#', active: false },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <OrbitlyLogo size={32} />
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.href !== '#' && !item.active) {
                      router.push(item.href);
                    } else if (!item.active) {
                      toast.info(`${item.label} module ready in upcoming step!`);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-border">
          <div className="p-3 bg-secondary/40 rounded-xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                S
              </div>
              <div className="truncate">
                <p className="text-xs font-bold truncate">Sarah Orbit</p>
                <p className="text-[10px] text-muted-foreground truncate">demo@orbitly.app</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between gap-4">
          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-xs font-semibold border border-border transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{activeWorkspace.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold">
                {activeWorkspace.role}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                  Switch Workspace
                </div>
                {workspacesList.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setShowWorkspaceMenu(false);
                      toast.success(`Switched to ${ws.name}`);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      activeWorkspace.id === ws.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    <span>{ws.name}</span>
                    <span className="text-[10px] text-muted-foreground">{ws.role}</span>
                  </button>
                ))}
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    router.push(`/${locale}/onboarding`);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />
            <Button
              variant="gradient"
              size="sm"
              onClick={() => toast.info('Composer modal launches in Step 5!')}
              className="font-semibold text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createPost')}</span>
            </Button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Greeting Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {t('welcome')}, Sarah! 🪐
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Workspace: <span className="font-semibold text-foreground">{activeWorkspace.name}</span> • All times displayed in UTC.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Team invitations dialog ready!')}
                className="text-xs gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                {t('inviteTeam')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${locale}/channels`)}
                className="text-xs gap-1.5"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                {t('connectChannel')}
              </Button>
            </div>
          </div>

          {/* Activation & Onboarding Checklist */}
          <OnboardingChecklist onOpenGuidedPost={() => setShowGuidedPost(true)} />

          {/* Empty-state channels announcement banner */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.04] p-6 text-center rounded-2xl">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">{t('emptyChannelsTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('emptyChannelsDesc')}</p>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => router.push(`/${locale}/channels`)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t('connectChannel')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t('scheduledPosts')}</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold">1</div>
              <p className="text-[11px] text-muted-foreground">Next post at 16:30 UTC</p>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t('publishedPosts')}</span>
                <Send className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold">24</div>
              <p className="text-[11px] text-emerald-500 font-medium">↑ +18% from last month</p>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t('audienceReach')}</span>
                <BarChart3 className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold">48.2k</div>
              <p className="text-[11px] text-cyan-500 font-medium">Cross-platform impressions</p>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Queue Engine Health</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-500">100%</div>
              <p className="text-[11px] text-muted-foreground">BullMQ delay queues operational</p>
            </Card>
          </div>

          {/* Quick Launchpad */}
          <div>
            <h3 className="text-sm font-bold tracking-tight mb-3">{t('quickActions')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => toast.info('Opening social composer...')}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <PenSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Draft Multi-Platform Post</h4>
                <p className="text-[11px] text-muted-foreground">
                  Compose once with custom per-network tailoring and live previews.
                </p>
              </div>

              <div
                onClick={() => toast.info('Opening calendar grid...')}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Interactive Publishing Grid</h4>
                <p className="text-[11px] text-muted-foreground">
                  View scheduled time slots, drag-and-drop to reschedule effortlessly.
                </p>
              </div>

              <div
                onClick={() => toast.info('Launching AI content generator...')}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">AI Tone & Content Studio</h4>
                <p className="text-[11px] text-muted-foreground">
                  Repurpose blog links into viral threads, hashtags and captions.
                </p>
              </div>
            </div>
          </div>

          {/* Guided First-Post Modal & Product Tour */}
          <GuidedFirstPostModal
            isOpen={showGuidedPost}
            onClose={() => setShowGuidedPost(false)}
          />
          <ProductTour />
        </main>
      </div>
    </div>
  );
}
