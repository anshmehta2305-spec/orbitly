'use client';

import React, { useState } from 'react';
import {
  Layers,
  RotateCcw,
  Trash2,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Server,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QueueHealth {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  throughputPerMin: number;
}

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<QueueHealth[]>([
    {
      name: 'publishing',
      waiting: 12,
      active: 4,
      completed: 18450,
      failed: 14,
      delayed: 42,
      paused: false,
      throughputPerMin: 18,
    },
    {
      name: 'analytics',
      waiting: 4,
      active: 2,
      completed: 3200,
      failed: 1,
      delayed: 0,
      paused: false,
      throughputPerMin: 8,
    },
    {
      name: 'automations',
      waiting: 2,
      active: 0,
      completed: 1240,
      failed: 0,
      delayed: 18,
      paused: false,
      throughputPerMin: 4,
    },
    {
      name: 'payment-events',
      waiting: 0,
      active: 0,
      completed: 890,
      failed: 0,
      delayed: 0,
      paused: false,
      throughputPerMin: 2,
    },
  ]);

  const handleRetryFailed = (queueName: string) => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.name === queueName) {
          const retriedCount = q.failed;
          toast.success(`Queued ${retriedCount} failed jobs in "${queueName}" for retry.`);
          return { ...q, failed: 0, waiting: q.waiting + retriedCount };
        }
        return q;
      })
    );
  };

  const handleDrainCompleted = (queueName: string) => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.name === queueName) {
          toast.success(`Cleaned ${q.completed.toLocaleString()} completed job records from Redis.`);
          return { ...q, completed: 0 };
        }
        return q;
      })
    );
  };

  const handleTogglePause = (queueName: string) => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.name === queueName) {
          const nextPaused = !q.paused;
          toast.info(`Queue "${queueName}" is now ${nextPaused ? 'PAUSED' : 'RESUMED'}.`);
          return { ...q, paused: nextPaused };
        }
        return q;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">BullMQ Queue Inspector</h1>
          <p className="text-xs text-muted-foreground">
            Monitor real-time Redis job states, retry publishing failures, pause queues, and clean memory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1.5 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Redis 7 Connected
          </Badge>
        </div>
      </div>

      {/* Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {queues.map((queue) => (
          <div
            key={queue.name}
            className={`p-6 rounded-2xl border bg-card/60 space-y-5 shadow-sm transition-all ${
              queue.paused ? 'border-amber-500/40' : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-mono">{queue.name}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    ~{queue.throughputPerMin} jobs/min throughput
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`font-mono text-[10px] ${
                  queue.paused
                    ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                    : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                }`}
              >
                {queue.paused ? 'PAUSED' : 'ACTIVE'}
              </Badge>
            </div>

            {/* Counts Matrix */}
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground block">Waiting</span>
                <span className="text-sm font-black font-mono text-foreground">{queue.waiting}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground block">Active</span>
                <span className="text-sm font-black font-mono text-sky-400">{queue.active}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground block">Delayed</span>
                <span className="text-sm font-black font-mono text-purple-400">{queue.delayed}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground block">Completed</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  {queue.completed.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground block">Failed</span>
                <span
                  className={`text-sm font-black font-mono ${
                    queue.failed > 0 ? 'text-rose-500' : 'text-muted-foreground'
                  }`}
                >
                  {queue.failed}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePause(queue.name)}
                  className="text-xs font-semibold h-8 gap-1.5"
                >
                  {queue.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  {queue.paused ? 'Resume' : 'Pause'}
                </Button>
                {queue.failed > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetryFailed(queue.name)}
                    className="text-xs font-semibold h-8 gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry ({queue.failed})
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDrainCompleted(queue.name)}
                className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1"
              >
                <Trash2 className="w-3 h-3" /> Drain Completed
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
