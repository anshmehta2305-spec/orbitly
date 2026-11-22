'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import {
  CreditCard,
  Check,
  AlertTriangle,
  Clock,
  ExternalLink,
  Download,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Share2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_SPECS, PlanTier, SupportedCurrency } from '@orbitly/shared';

export default function BillingSettingsPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');
  const [isAnnual, setIsAnnual] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Too expensive for my current needs');
  const [cancelFeedback, setCancelFeedback] = useState('');

  // Workspace subscription state (mock or live)
  const currentPlanTier = PlanTier.PRO;
  const [subStatus, setSubStatus] = useState<'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED'>('ACTIVE');
  const trialDaysRemaining = 4;
  const isPastDue = false;

  const currentSpecs = PLAN_SPECS[currentPlanTier];

  const usageMeters = [
    { label: 'Connected Channels', current: 4, limit: currentSpecs.limits.channels, percent: 40, icon: Share2 },
    { label: 'Monthly Posts Published', current: 78, limit: currentSpecs.limits.postsPerMonth, percent: 26, icon: FileText },
    { label: 'Workspace Seats', current: 2, limit: currentSpecs.limits.seats, percent: 66, icon: Users },
    { label: 'AI Studio Credits', current: 185, limit: currentSpecs.limits.aiCredits, percent: 92, icon: Sparkles },
  ];

  const invoices = [
    { id: 'inv_102', date: 'Nov 01, 2026', amount: '$19.00', status: 'Paid', pdfUrl: '#' },
    { id: 'inv_101', date: 'Oct 01, 2026', amount: '$19.00', status: 'Paid', pdfUrl: '#' },
  ];

  const handlePortalRedirect = () => {
    toast.success('Redirecting to Stripe Customer Portal...');
    window.location.href = 'http://localhost:3000/en/settings/billing?portal=opened';
  };

  const handleUpgradeCheckout = (tier: PlanTier) => {
    toast.success(`Starting checkout for ${tier} plan...`);
    setShowUpgradeModal(false);
    window.location.href = `http://localhost:3000/en/settings/billing?checkout=success&plan=${tier}`;
  };

  const handleConfirmCancel = () => {
    toast.success('Subscription scheduled to cancel at end of billing period. Your data remains safe.');
    setShowCancelModal(false);
  };

  return (
    <AppShell activeNav="billing">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
                <CreditCard className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your subscription tier, billing currency, usage quotas, and payment methods.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency selector */}
            <div className="flex items-center p-1 bg-secondary rounded-2xl border border-border text-xs font-semibold">
              {(['USD', 'EUR', 'GBP', 'INR'] as SupportedCurrency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCurrency(c)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedCurrency === c ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
            >
              Change Plan
            </button>
          </div>
        </div>

        {/* Trial / Past Due Warning Banners */}
        {subStatus === 'TRIALING' && (
          <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>14-day Pro Trial Active:</strong> You have {trialDaysRemaining} days remaining. Add a payment method to maintain uninterrupted service.
              </span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shrink-0"
            >
              Add Card
            </button>
          </div>
        )}

        {isPastDue && (
          <div className="p-4 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-3 text-xs text-destructive">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Payment Past Due:</strong> 7-day grace period active. Update your payment method to prevent automatic downgrade to Free.
              </span>
            </div>
            <button
              onClick={handlePortalRedirect}
              className="px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground font-semibold shrink-0"
            >
              Update Payment Method
            </button>
          </div>
        )}

        {/* Current Plan Overview Card */}
        <div className="p-6 rounded-3xl bg-card border border-border space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Current Plan
              </div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold">{currentSpecs.name} Plan</h2>
                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-secondary text-foreground">
                  {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : '₹'}
                  {currentSpecs.prices[selectedCurrency].annual}/mo
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success uppercase">
                  {subStatus}
                </span>
                <span className="text-xs text-muted-foreground">Billed Annually</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{currentSpecs.tagline}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePortalRedirect}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border hover:bg-secondary text-xs font-semibold"
              >
                <span>Manage Payment Method & Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Usage Meters */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Workspace Usage & Quotas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {usageMeters.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold font-mono text-foreground">{m.current}</span>
                      <span className="text-xs text-muted-foreground font-mono">/ {m.limit}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${m.percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Billing History & Invoices</h3>
            <span className="text-xs text-muted-foreground">Automated receipts generated by Stripe / Razorpay</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Billing Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">PDF Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-mono font-medium">{inv.id}</td>
                    <td className="p-3 text-muted-foreground">{inv.date}</td>
                    <td className="p-3 font-mono font-bold text-foreground">{inv.amount}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toast.success('Downloading invoice PDF receipt...')}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border/60">
            <span>Looking to pause or cancel your subscription?</span>
            <button onClick={() => setShowCancelModal(true)} className="text-destructive hover:underline font-semibold">
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Upgrade / Change Plan Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
            <div className="relative w-full max-w-4xl bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-lg">Change Workspace Plan</h3>
                  <p className="text-xs text-muted-foreground">Upgrade or downgrade your plan tier. Proration calculated automatically.</p>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  Close
                </button>
              </div>

              {/* Annual / Monthly Toggle */}
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className={!isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}>Monthly</span>
                <button
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="w-12 h-6 rounded-full bg-secondary p-1 flex items-center border border-border transition-colors"
                >
                  <div className={`w-4 h-4 rounded-full bg-primary transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
                </button>
                <span className={isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                  Annually <strong className="text-primary">(Save 20%)</strong>
                </span>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {([PlanTier.FREE, PlanTier.PRO, PlanTier.TEAM, PlanTier.AGENCY] as PlanTier[]).map((tier) => {
                  const spec = PLAN_SPECS[tier];
                  const price = isAnnual ? spec.prices[selectedCurrency].annual : spec.prices[selectedCurrency].monthly;
                  const isCurrent = tier === currentPlanTier;

                  return (
                    <div
                      key={tier}
                      className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between ${
                        isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-background'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">{spec.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl font-bold font-mono">
                            {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : '₹'}
                            {price}
                          </span>
                          <span className="text-[11px] text-muted-foreground"> /mo</span>
                        </div>

                        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                          <li>• {spec.limits.channels} channels</li>
                          <li>• {spec.limits.postsPerMonth.toLocaleString()} posts/mo</li>
                          <li>• {spec.limits.seats} seats</li>
                          <li>• {spec.limits.aiCredits} AI credits</li>
                          {spec.limits.whiteLabel && <li>• White-label enabled</li>}
                        </ul>
                      </div>

                      <button
                        disabled={isCurrent}
                        onClick={() => handleUpgradeCheckout(tier)}
                        className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {isCurrent ? 'Current Plan' : tier === PlanTier.FREE ? 'Downgrade' : 'Upgrade'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Cancel Subscription</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your plan will remain active until the end of your current billing period. <strong>Your data, posts, and channels will NOT be deleted</strong>; your account will transition safely to the Free tier.
              </p>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                >
                  <option>Too expensive for my current needs</option>
                  <option>Missing specific platform integration</option>
                  <option>Finished seasonal campaign</option>
                  <option>Switching to another tool</option>
                  <option>Other reason</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Feedback (Optional)
                </label>
                <textarea
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs resize-none"
                  placeholder="Help us improve Orbitly..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
