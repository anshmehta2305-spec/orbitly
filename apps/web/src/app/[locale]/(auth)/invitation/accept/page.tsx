'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const token = searchParams.get('token') || '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Missing invitation token');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name || undefined,
          password: password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to accept invitation');

      toast.success('Welcome! You have joined the workspace.');
      router.push(`/${locale}/calendar`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <OrbitlyLogo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Join Your Workspace</h1>
          <p className="text-sm text-muted-foreground">
            You have been invited to collaborate on Orbitly. Set up your access below.
          </p>
        </div>

        {error ? (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        ) : (
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Name
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Devon Miles"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Joining...' : 'Accept Invitation & Enter'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
