'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
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
  CheckCircle2,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
  Building2,
  Menu,
  X,
  Plus,
  Code,
  Shield,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppShellProps {
  children: React.ReactNode;
  activeNav: string; // 'dashboard' | 'channels' | etc.
}

export function AppShell({ children, activeNav }: AppShellProps) {
  const navT = useTranslations('Navigation');
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [mobileOpen, setMobileOpen] = useState(false);
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
    { id: 'dashboard', label: navT('dashboard'), icon: LayoutDashboard, href: `/${locale}/dashboard` },
    { id: 'calendar', label: navT('calendar'), icon: Calendar, href: `/${locale}/calendar` },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle2, href: `/${locale}/approvals` },
    { id: 'composer', label: navT('composer'), icon: PenSquare, href: `/${locale}/calendar?composer=true` },
    { id: 'posts', label: navT('posts'), icon: FileText, href: '#' },
    { id: 'channels', label: navT('channels'), icon: Share2, href: `/${locale}/channels` },
    { id: 'media', label: navT('media'), icon: FolderOpen, href: '#' },
    { id: 'aiStudio', label: navT('aiStudio'), icon: Sparkles, href: `/${locale}/ai` },
    { id: 'automations', label: navT('automations'), icon: Zap, href: `/${locale}/automations` },
    { id: 'analytics', label: navT('analytics'), icon: BarChart3, href: `/${locale}/analytics` },
    { id: 'team', label: navT('team'), icon: Users, href: `/${locale}/team` },
    { id: 'settings', label: navT('settings'), icon: Settings, href: `/${locale}/settings/workspace` },
    { id: 'billing', label: navT('billing'), icon: CreditCard, href: `/${locale}/settings/billing` },
    { id: 'developers', label: 'Developers', icon: Code, href: `/${locale}/settings/developers` },
    { id: 'security', label: 'Security & SSO', icon: ShieldCheck, href: `/${locale}/settings/security` },
    { id: 'admin', label: 'Admin Console', icon: Shield, href: `/${locale}/admin` },
  ];

  const [impersonatingUser, setImpersonatingUser] = useState<{ id: string; email: string; name: string } | null>(null);

  React.useEffect(() => {
    const imp = localStorage.getItem('orbitly_impersonated_user');
    if (imp) {
      try {
        setImpersonatingUser(JSON.parse(imp));
      } catch {
        // Ignored
      }
    }
  }, []);

  const handleStopImpersonation = () => {
    localStorage.removeItem('orbitly_impersonated_user');
    setImpersonatingUser(null);
    toast.success('Ended impersonation session.');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Impersonation Banner */}
      {impersonatingUser && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-xs font-bold sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              IMPERSONATION ACTIVE: You are viewing the app as <strong>{impersonatingUser.name}</strong> ({impersonatingUser.email}).
            </span>
          </div>
          <button
            onClick={handleStopImpersonation}
            className="bg-amber-950 text-amber-100 hover:bg-black px-3 py-1 rounded-md text-xs font-black transition-colors"
          >
            Stop Impersonating
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 border-r border-border bg-card/70 backdrop-blur-xl flex flex-col justify-between shrink-0 z-50 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <OrbitlyLogo size={30} />
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              const isPlaceholder = item.href === '#';

              if (isPlaceholder) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      toast.info(`${item.label} module ready in upcoming step!`);
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-border">
          <div className="p-3 bg-secondary/40 rounded-xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
                S
              </div>
              <div className="truncate">
                <p className="text-xs font-bold truncate">Sarah Orbit</p>
                <p className="text-[10px] text-muted-foreground truncate">demo@orbitly.app</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive p-1.5 transition-colors rounded-lg hover:bg-destructive/10"
              title={navT('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border bg-card/80 text-foreground"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Workspace Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-xs font-semibold border border-border transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[130px] sm:max-w-none truncate">{activeWorkspace.name}</span>
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
                      toast.info('Workspace creation dialog available in settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-primary font-medium hover:bg-primary/10 flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create new workspace</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  </div>
  );
}