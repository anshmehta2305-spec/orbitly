'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Layers,
  Radio,
  Flag,
  FileText,
  Megaphone,
  TrendingUp,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [impersonatingUser, setImpersonatingUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [adminUser] = useState({
    id: 'usr_superadmin_01',
    name: 'Platform Operations',
    email: 'ops@orbitly.app',
    platformRole: 'SUPERADMIN' as 'SUPERADMIN' | 'SUPPORT',
  });

  useEffect(() => {
    // Check if impersonation cookie/token exists
    const impersonated = localStorage.getItem('orbitly_impersonated_user');
    if (impersonated) {
      try {
        setImpersonatingUser(JSON.parse(impersonated));
      } catch {
        // Ignored
      }
    }
  }, []);

  const handleStopImpersonation = () => {
    localStorage.removeItem('orbitly_impersonated_user');
    setImpersonatingUser(null);
    toast.success('Ended impersonation session. Returned to admin.');
  };

  const navLinks = [
    { href: `/${locale}/admin`, label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: `/${locale}/admin/users`, label: 'Users', icon: Users },
    { href: `/${locale}/admin/workspaces`, label: 'Workspaces', icon: Building2 },
    { href: `/${locale}/admin/subscriptions`, label: 'Billing & Invoices', icon: CreditCard },
    { href: `/${locale}/admin/queues`, label: 'Queue Inspector', icon: Layers },
    { href: `/${locale}/admin/providers`, label: 'Provider Health', icon: Radio },
    { href: `/${locale}/admin/flags`, label: 'Feature Flags', icon: Flag },
    { href: `/${locale}/admin/funnel`, label: 'Activation Funnel', icon: TrendingUp },
    { href: `/${locale}/admin/audit`, label: 'Audit Logs', icon: FileText },
    { href: `/${locale}/admin/announcements`, label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Impersonation Banner */}
      {impersonatingUser && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-xs font-bold sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              IMPERSONATION ACTIVE: You are viewing the app as <strong>{impersonatingUser.name}</strong> ({impersonatingUser.email}).
              All actions are recorded in the audit log.
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

      <div className="flex-1 flex">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-0 bottom-0 left-0 w-64 border-r border-border bg-card/80 backdrop-blur-xl flex flex-col justify-between shrink-0 z-50 transition-transform duration-200 lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <div className="flex items-center gap-2">
                <OrbitlyLogo size={28} />
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border-rose-500/20">
                  ADMIN
                </Badge>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-3 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
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

          {/* Admin User Info + Exit Admin */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 font-bold flex items-center justify-center text-xs">
                PO
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{adminUser.name}</p>
                <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-rose-500/30 text-rose-400">
                  {adminUser.platformRole}
                </Badge>
              </div>
            </div>

            <Link href={`/${locale}/dashboard`}>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-start gap-2">
                <ExternalLink className="w-3.5 h-3.5" /> Return to App
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar for Mobile & Theme */}
          <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <span>Platform Admin</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-semibold">
                  {navLinks.find((l) => (l.exact ? pathname === l.href : pathname?.startsWith(l.href)))?.label || 'Console'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
