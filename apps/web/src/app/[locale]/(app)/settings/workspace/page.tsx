'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, Check, Globe, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkspaceSettingsPage() {
  const t = useTranslations('Settings');
  const workspaceId = 'ws_demo_1';

  const [approvalRequired, setApprovalRequired] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandColor, setBrandColor] = useState('#4F46E5');
  const [customDomain, setCustomDomain] = useState('');
  const [whiteLabelAllowed, setWhiteLabelAllowed] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:4000/workspace/settings', {
          headers: { 'x-workspace-id': workspaceId },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setApprovalRequired(data.settings.approvalRequired ?? false);
            setAutoPublish(data.settings.autoPublishAfterApproval ?? true);
            setBrandName(data.settings.brandName || '');
            setBrandLogo(data.settings.brandLogo || '');
            setBrandColor(data.settings.brandColor || '#4F46E5');
            setCustomDomain(data.settings.customDomain || '');
          }
          if (data.capabilities) {
            setWhiteLabelAllowed(data.capabilities.whiteLabelAllowed ?? true);
          }
        }
      } catch {
        // Fallback default
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/workspace/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          approvalRequired,
          autoPublishAfterApproval: autoPublish,
          brandName: brandName || null,
          brandLogo: brandLogo || null,
          brandColor: brandColor || null,
          customDomain: customDomain || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update settings');
      toast.success('Workspace settings updated successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="border-b border-border pb-5">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Approval Settings */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
            <div className="flex items-center gap-2 font-semibold text-base">
              <Shield className="w-5 h-5 text-primary" />
              {t('approvalsSection')}
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <div className="font-medium">{t('approvalRequired')}</div>
                  <div className="text-xs text-muted-foreground">{t('approvalRequiredDesc')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                  className="rounded text-primary w-4 h-4 mt-1"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <div className="font-medium">{t('autoPublish')}</div>
                  <div className="text-xs text-muted-foreground">{t('autoPublishDesc')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="rounded text-primary w-4 h-4 mt-1"
                />
              </div>
            </div>
          </div>

          {/* White-Label Branding Section */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-base">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {t('brandingSection')}
              </div>
              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/20">
                {t('agencyOnly')}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('brandName')}
                </label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Apex Marketing Agency"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('brandColor')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('brandLogo')}
                </label>
                <Input
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  placeholder="https://yourdomain.com/logo.png"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('customDomain')}
                </label>
                <Input
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="social.yourdomain.com"
                />
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Globe className="w-3.5 h-3.5" />
                  Point a CNAME DNS record from your subdomain to <code>cname.orbitly.io</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : t('save')}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
