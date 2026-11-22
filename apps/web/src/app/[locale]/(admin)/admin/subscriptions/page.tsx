'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  DollarSign,
  Calendar,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  Building2,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SubscriptionRow {
  id: string;
  workspaceName: string;
  plan: string;
  provider: 'STRIPE' | 'RAZORPAY';
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  amount: string;
  interval: 'MONTHLY' | 'ANNUAL';
  customerEmail: string;
  periodEnd: string;
  lastInvoice: {
    id: string;
    amount: string;
    status: 'PAID' | 'FAILED' | 'REFUNDED';
    hostedUrl?: string;
  };
}

export default function AdminSubscriptionsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([
    {
      id: 'sub_str_101',
      workspaceName: 'Sarah Creatives',
      plan: 'PRO',
      provider: 'STRIPE',
      status: 'ACTIVE',
      amount: '$19/mo',
      interval: 'ANNUAL',
      customerEmail: 'sarah@example.com',
      periodEnd: '2027-08-14',
      lastInvoice: {
        id: 'in_101a',
        amount: '$228.00',
        status: 'PAID',
        hostedUrl: 'https://pay.stripe.com/invoice/inv_101',
      },
    },
    {
      id: 'sub_rzp_202',
      workspaceName: 'Acme Growth Labs',
      plan: 'TEAM',
      provider: 'RAZORPAY',
      status: 'ACTIVE',
      amount: '₹4,399/mo',
      interval: 'ANNUAL',
      customerEmail: 'alex@growthagency.io',
      periodEnd: '2027-09-02',
      lastInvoice: {
        id: 'inv_rzp_202',
        amount: '₹52,788.00',
        status: 'PAID',
        hostedUrl: 'https://razorpay.com/invoices/inv_202',
      },
    },
    {
      id: 'sub_str_303',
      workspaceName: 'Urban Visuals',
      plan: 'PRO',
      provider: 'STRIPE',
      status: 'PAST_DUE',
      amount: '$24/mo',
      interval: 'MONTHLY',
      customerEmail: 'billing@urbanvisuals.co',
      periodEnd: '2026-11-25',
      lastInvoice: {
        id: 'in_303b',
        amount: '$24.00',
        status: 'FAILED',
        hostedUrl: 'https://pay.stripe.com/invoice/inv_303',
      },
    },
  ]);

  const handleRetryInvoice = (invoiceId: string) => {
    toast.success(`Triggered manual payment retry for ${invoiceId}`);
  };

  const handleManualRefund = (invoiceId: string) => {
    toast.success(`Processed full refund for invoice ${invoiceId}`);
  };

  const filteredSubs = subscriptions.filter((s) => {
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    if (providerFilter !== 'ALL' && s.provider !== providerFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Subscriptions & Billing</h1>
          <p className="text-xs text-muted-foreground">
            Audit recurring customer subscriptions, dunning state, Stripe / Razorpay webhooks, and invoice payouts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {filteredSubs.length} Subscriptions
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl text-xs font-semibold">
          <span className="text-muted-foreground px-2">Status:</span>
          {(['ALL', 'ACTIVE', 'PAST_DUE', 'TRIALING', 'CANCELED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl text-xs font-semibold">
          <span className="text-muted-foreground px-2">Provider:</span>
          {(['ALL', 'STRIPE', 'RAZORPAY'] as const).map((pv) => (
            <button
              key={pv}
              onClick={() => setProviderFilter(pv)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                providerFilter === pv
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {pv}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="border border-border rounded-2xl bg-card/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/40 font-bold text-foreground">
              <th className="p-4">Customer / Workspace</th>
              <th className="p-4">Plan & Amount</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Status</th>
              <th className="p-4">Next Renewal</th>
              <th className="p-4">Latest Invoice</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubs.map((sub) => (
              <tr key={sub.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4">
                  <div>
                    <p className="font-bold text-foreground">{sub.workspaceName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{sub.customerEmail}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-bold text-foreground">{sub.plan}</span>
                  <p className="text-[11px] text-muted-foreground">{sub.amount} ({sub.interval.toLowerCase()})</p>
                </td>
                <td className="p-4">
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] ${
                      sub.provider === 'STRIPE'
                        ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10'
                        : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                    }`}
                  >
                    {sub.provider}
                  </Badge>
                </td>
                <td className="p-4">
                  <Badge
                    variant="outline"
                    className={`font-black text-[10px] ${
                      sub.status === 'ACTIVE'
                        ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                        : sub.status === 'PAST_DUE'
                        ? 'text-rose-500 border-rose-500/20 bg-rose-500/10'
                        : 'text-amber-500 border-amber-500/20 bg-amber-500/10'
                    }`}
                  >
                    {sub.status}
                  </Badge>
                </td>
                <td className="p-4 font-mono text-muted-foreground">{sub.periodEnd}</td>
                <td className="p-4">
                  <div className="space-y-0.5">
                    <span className="font-mono text-foreground font-semibold">
                      {sub.lastInvoice.amount}
                    </span>
                    <Badge
                      variant="outline"
                      className={`ml-2 text-[9px] font-mono ${
                        sub.lastInvoice.status === 'PAID'
                          ? 'text-emerald-400 border-emerald-500/20'
                          : 'text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {sub.lastInvoice.status}
                    </Badge>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {sub.lastInvoice.status === 'FAILED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryInvoice(sub.lastInvoice.id)}
                        className="text-[11px] font-bold h-7 gap-1 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry Payment
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManualRefund(sub.lastInvoice.id)}
                        className="text-[11px] font-bold h-7 hover:border-amber-500 hover:text-amber-500"
                      >
                        Refund
                      </Button>
                    )}
                    {sub.lastInvoice.hostedUrl && (
                      <a
                        href={sub.lastInvoice.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
