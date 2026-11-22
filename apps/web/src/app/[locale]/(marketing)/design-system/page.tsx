'use client';

import React, { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Dialog } from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { Sparkles, Check, Info, Shield, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const colors = [
    { name: 'Primary (Electric Violet)', var: 'bg-primary', hex: '#6366F1' },
    { name: 'Secondary (Surface Plate)', var: 'bg-secondary', hex: 'Slate 800/100' },
    { name: 'Accent (Cosmic Cyan)', var: 'bg-cyan-500', hex: '#06B6D4' },
    { name: 'Success (Emerald)', var: 'bg-emerald-500', hex: '#10B981' },
    { name: 'Warning (Amber)', var: 'bg-amber-500', hex: '#F59E0B' },
    { name: 'Destructive (Coral Flare)', var: 'bg-rose-500', hex: '#F43F5E' },
  ];

  return (
    <Section className="py-12 sm:py-20">
      <Container className="space-y-16">
        <header className="space-y-3 border-b border-border pb-8">
          <div className="flex items-center gap-3">
            <OrbitlyLogo size={36} />
            <Badge variant="pulse">Design System Documentation (Dev View)</Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Orbitly Design System</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Standardized UI components, motion presets, WCAG AA color tokens, and typographic scale powering the Orbitly platform.
          </p>
        </header>

        {/* 1. Color Palette Tokens */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">1. Color Palette Tokens (WCAG AA Compliant)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {colors.map((c) => (
              <div key={c.name} className="p-3 rounded-2xl border border-border bg-card/60 space-y-2">
                <div className={`h-16 w-full rounded-xl ${c.var} shadow-inner`} />
                <p className="text-xs font-bold truncate">{c.name.split('(')[0]}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{c.hex}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Typography Scale */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">2. Typography Scale</h2>
          <div className="p-6 rounded-3xl border border-border bg-card/50 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground">Heading 1 — 72px / Bold</span>
              <p className="text-4xl sm:text-6xl font-extrabold tracking-tight">Plan once. Publish everywhere.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground">Heading 2 — 36px / Extrabold</span>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">Multi-Platform Publishing Engine</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground">Body Regular — 14px / Line-height 1.6</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your social channels once with AES-256-GCM encrypted OAuth and schedule content with automated
                time-zone translation and delayed queue retry policies.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Button Component Variants */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">3. Button Variants & Sizes</h2>
          <div className="p-6 rounded-3xl border border-border bg-card/50 flex flex-wrap items-center gap-3">
            <Button variant="default">Default Primary</Button>
            <Button variant="gradient">Gradient Action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="gradient" isLoading={true}>
              Loading State
            </Button>
          </div>
        </div>

        {/* 4. Badges */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">4. Status & Label Badges</h2>
          <div className="p-6 rounded-3xl border border-border bg-card/50 flex flex-wrap items-center gap-3">
            <Badge variant="default">Default Primary</Badge>
            <Badge variant="pulse">Pulse Cyan</Badge>
            <Badge variant="success">Active (Success)</Badge>
            <Badge variant="warning">Pending Review</Badge>
            <Badge variant="destructive">Publication Failed</Badge>
            <Badge variant="secondary">Draft Pill</Badge>
            <Badge variant="outline">Border Outline</Badge>
          </div>
        </div>

        {/* 5. Inputs & Form Elements */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">5. Inputs, Selects & Tooltips</h2>
          <div className="p-6 rounded-3xl border border-border bg-card/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Standard Input</label>
              <Input placeholder="Enter username or email" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Validation Error State</label>
              <Input placeholder="Invalid field" error="Please enter a valid format" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Native Accessible Select</label>
              <Select>
                <option value="1">Daily Scheduling View</option>
                <option value="2">Weekly Calendar Grid</option>
                <option value="3">Monthly Overview</option>
              </Select>
            </div>
          </div>
        </div>

        {/* 6. Tabs, Accordion & Modals */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">6. Interactive Overlays & Containers</h2>
          <div className="p-6 rounded-3xl border border-border bg-card/50 space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="gradient" onClick={() => setDialogOpen(true)}>
                Trigger Modal Dialog
              </Button>
              <Tooltip content="Tooltip showing extra contextual advice">
                <Button variant="outline" size="sm">
                  Hover for Tooltip
                </Button>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Interactive toast notification triggered!')}
              >
                Trigger Toast
              </Button>
            </div>

            <Accordion className="space-y-2 max-w-xl">
              <AccordionItem title="Can components be composed seamlessly?" defaultOpen={true}>
                Yes, all primitives are fully accessible, support dark and light theme tokens, and accept custom Tailwind classes.
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Modal Dialog Demo */}
        <Dialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Component Dialog Primitive"
          description="Accessible, focus-trapped dialog component with keyboard escape support."
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This dialog locks scroll on open, listens to escape key events, and animates with subtle scale and fade transitions.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" onClick={() => setDialogOpen(false)}>
                Confirm Action
              </Button>
            </div>
          </div>
        </Dialog>
      </Container>
    </Section>
  );
}
