'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('support');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam honeypot
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          website_url_hp: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error submitting message');

      setIsSuccess(true);
      toast.success('Your message has been dispatched to our support team!');
    } catch (err: any) {
      toast.error(err.message || 'Submission error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Get In Touch</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Contact the Orbitly Team
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Have questions about plans, agency white-labeling, or social API integrations? We are here to help.
          </p>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="max-w-xl">
          <Card className="bg-card/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-border shadow-2xl">
            {isSuccess ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Message Dispatched!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out. One of our product specialists will reply to{' '}
                  <strong className="text-foreground">{email}</strong> within 12 business hours.
                </p>
                <Button variant="outline" size="sm" onClick={() => setIsSuccess(false)} className="text-xs">
                  Send Another Note
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field (hidden from genuine users) */}
                <input
                  type="text"
                  name="website_url_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Your Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Work Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Inquiry Category</label>
                  <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="support">Technical Support</option>
                    <option value="sales">Agency / Enterprise Sales</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="partner">Provider Plugin & Partnerships</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">How can we assist you?</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your team, use-case, or question..."
                    required
                    className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 resize-none transition-colors"
                  />
                </div>

                <Button type="submit" variant="gradient" className="w-full text-xs font-bold" isLoading={isLoading}>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  <span>Send Message</span>
                </Button>
              </form>
            )}
          </Card>
        </Container>
      </Section>
    </div>
  );
}
