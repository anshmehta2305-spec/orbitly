'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const email = searchParams.get('email') || 'your email';

  return (
    <Card className="w-full bg-card/95 backdrop-blur-xl shadow-2xl border border-border text-center">
      <CardHeader className="pb-4">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center mb-2">
          <MailCheck className="w-7 h-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Verify Your Email</CardTitle>
        <CardDescription>
          We sent a verification link to <strong className="text-foreground">{email}</strong>.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Click the link in the message to activate all features of your Orbitly workspace.
        </p>
      </CardContent>

      <CardFooter className="flex-col gap-2 border-t border-border pt-4">
        <Link href={`/${locale}/dashboard`} className="w-full">
          <Button variant="gradient" className="w-full">
            Proceed to Dashboard
          </Button>
        </Link>
        <Link href={`/${locale}/login`} className="text-xs text-muted-foreground hover:underline">
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
