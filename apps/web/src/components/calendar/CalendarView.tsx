'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Copy,
  Send,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Layers,
  Star,
  Check,
  RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CalendarPostItem {
  id: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
  scheduledAt: string; // ISO string
  timezone: string;
  channel: {
    id: string;
    provider: string;
    accountName: string;
    color: string;
  };
  mediaUrls?: string[];
  tags?: string[];
}

interface CalendarViewProps {
  initialPosts: CalendarPostItem[];
  workspaceId: string;
  onOpenComposer: (post?: CalendarPostItem, datePrefill?: string) => void;
  onOpenCsvImport: () => void;
}

export function CalendarView({
  initialPosts,
  workspaceId,
  onOpenComposer,
  onOpenCsvImport,
}: CalendarViewProps) {
  const t = useTranslations('Calendar');

  // State
  const [posts, setPosts] = useState<CalendarPostItem[]>(initialPosts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [showBestTimes, setShowBestTimes] = useState(false);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);

  // Timezone override
  const [activeTimezone, setActiveTimezone] = useState('UTC');

  // Sample Recurring Queue Slots for faint placeholder display
  const recurringSlots = [
    { weekday: 1, time: '09:00' }, // Monday 9am
    { weekday: 3, time: '14:30' }, // Wednesday 2:30pm
    { weekday: 5, time: '11:00' }, // Friday 11am
  ];

  // Best times recommendation windows (heuristics)
  const bestTimesByWeekday: Record<number, string[]> = {
    1: ['10:00 AM', '02:00 PM'],
    2: ['09:30 AM', '01:00 PM'],
    3: ['11:00 AM', '03:30 PM'],
    4: ['09:00 AM', '02:00 PM'],
    5: ['10:30 AM', '01:30 PM'],
  };

  // Realtime SSE listener
  useEffect(() => {
    try {
      const eventSource = new EventSource(`http://localhost:4000/posts/events/stream?workspaceId=${workspaceId}`);
      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === 'POST_STATUS_CHANGED' || event.type === 'POST_UPDATED') {
            setPosts((prev) =>
              prev.map((p) => (p.id === event.postId ? { ...p, status: event.status } : p))
            );
          } else if (event.type === 'POST_DELETED') {
            setPosts((prev) => prev.filter((p) => p.id !== event.postId));
          }
        } catch {
          // Ignored
        }
      };

      return () => eventSource.close();
    } catch {
      // Offline fallback
    }
  }, [workspaceId]);

  // Keyboard navigation: Left/Right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        handlePrevPeriod();
      } else if (e.key === 'ArrowRight') {
        handleNextPeriod();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentDate]);

  // Month navigation helpers
  const handlePrevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesChannel = selectedChannelFilter === 'ALL' || p.channel.provider === selectedChannelFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;
    const matchesSearch =
      !searchQuery ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.channel.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesStatus && matchesSearch;
  });

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, post: CalendarPostItem) => {
    if (post.status === 'PUBLISHED') {
      e.preventDefault();
      toast.error('Published posts cannot be rescheduled.');
      return;
    }
    setDraggingPostId(post.id);
    e.dataTransfer.setData('text/plain', post.id);
  };

  const handleDropOnDay = async (targetDateStr: string) => {
    if (!draggingPostId) return;

    const postToMove = posts.find((p) => p.id === draggingPostId);
    if (!postToMove) return;

    const originalScheduled = postToMove.scheduledAt;
    const timePortion = originalScheduled ? originalScheduled.slice(11, 19) : '10:00:00';
    const newScheduledAt = `${targetDateStr}T${timePortion}.000Z`;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === draggingPostId ? { ...p, scheduledAt: newScheduledAt } : p))
    );
    toast.success(t('rescheduleSuccess'));

    try {
      await fetch(`http://localhost:4000/posts/${draggingPostId}?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: newScheduledAt }),
      });
    } catch {
      // Rollback on failure
      setPosts((prev) =>
        prev.map((p) => (p.id === draggingPostId ? { ...p, scheduledAt: originalScheduled } : p))
      );
      toast.error('Failed to reschedule post. Rolled back.');
    } finally {
      setDraggingPostId(null);
    }
  };

  // Post Actions
  const handlePublishNow = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'PUBLISHING' } : p))
    );
    toast.info('Publishing post now...');

    try {
      await fetch(`http://localhost:4000/posts/${postId}/publish-now?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      toast.success('Post dispatched for publishing!');
    } catch {
      toast.error('Publish now failed');
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success('Post cancelled and removed');

    try {
      await fetch(`http://localhost:4000/posts/${postId}?workspaceId=${workspaceId}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignored
    }
  };

  const handleDuplicatePost = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const duplicate: CalendarPostItem = {
      ...post,
      id: `post_copy_${Date.now()}`,
      title: `${post.title || 'Post'} (Copy)`,
      status: 'DRAFT',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    setPosts([duplicate, ...posts]);
    toast.success('Post duplicated as draft');
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    setPosts((prev) => prev.filter((p) => !selectedPostIds.includes(p.id)));
    toast.success(`Deleted ${selectedPostIds.length} posts`);
    setSelectedPostIds([]);
  };

  const handleBulkReschedule = () => {
    // Shift selected by +24 hours
    setPosts((prev) =>
      prev.map((p) => {
        if (selectedPostIds.includes(p.id) && p.status !== 'PUBLISHED') {
          const shifted = new Date(new Date(p.scheduledAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
          return { ...p, scheduledAt: shifted };
        }
        return p;
      })
    );
    toast.success(`Rescheduled ${selectedPostIds.length} posts by +24 hours`);
    setSelectedPostIds([]);
  };

  // Build Month Calendar Matrix (6 weeks, 42 cells)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthMatrix = [];
  let dayCounter = 1;
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      if (week === 0 && day < firstDayOfMonth) {
        // Previous month padding
        const prevMonthLastDate = new Date(year, month, 0).getDate();
        const dateNum = prevMonthLastDate - (firstDayOfMonth - day - 1);
        const dateObj = new Date(year, month - 1, dateNum);
        weekDays.push({ date: dateObj, isCurrentMonth: false });
      } else if (dayCounter <= daysInMonth) {
        const dateObj = new Date(year, month, dayCounter);
        weekDays.push({ date: dateObj, isCurrentMonth: true });
        dayCounter++;
      } else {
        // Next month padding
        const nextDateNum = dayCounter - daysInMonth;
        const dateObj = new Date(year, month + 1, nextDateNum);
        weekDays.push({ date: dateObj, isCurrentMonth: false });
        dayCounter++;
      }
    }
    monthMatrix.push(weekDays);
    if (dayCounter > daysInMonth && week >= 4) break;
  }

  const monthTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('title')}</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {filteredPosts.length} posts
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenCsvImport} className="text-xs flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{t('importCsv')}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onOpenComposer()}
            className="text-xs flex items-center gap-1.5 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newPost')}</span>
          </Button>
        </div>
      </div>

      {/* Navigation, View Toggles & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/70 p-3 rounded-2xl border border-border backdrop-blur-md">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="h-9 px-3 text-xs font-bold">
            {t('today')}
          </Button>
          <div className="flex items-center rounded-xl border border-border bg-background/50">
            <button
              onClick={handlePrevPeriod}
              className="p-2 hover:bg-secondary rounded-l-xl text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-foreground min-w-[130px] text-center">{monthTitle}</span>
            <button
              onClick={handleNextPeriod}
              className="p-2 hover:bg-secondary rounded-r-xl text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Toggles */}
          <div className="flex items-center p-1 rounded-xl bg-secondary/60 border border-border text-xs">
            {(['month', 'week', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Best Times Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Best times toggle */}
          <button
            onClick={() => setShowBestTimes(!showBestTimes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
              showBestTimes
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                : 'border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showBestTimes ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{t('bestTimes')}</span>
          </button>

          {/* Channel Filter */}
          <select
            value={selectedChannelFilter}
            onChange={(e) => setSelectedChannelFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl border border-border bg-background/50 text-xs font-medium focus:outline-none"
          >
            <option value="ALL">{t('filterChannels')}</option>
            <option value="BLUESKY">Bluesky</option>
            <option value="MASTODON">Mastodon</option>
            <option value="TELEGRAM">Telegram</option>
            <option value="DISCORD">Discord</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl border border-border bg-background/50 text-xs font-medium focus:outline-none"
          >
            <option value="ALL">{t('filterStatus')}</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHING">Publishing</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Timezone Selector */}
          <select
            value={activeTimezone}
            onChange={(e) => setActiveTimezone(e.target.value)}
            className="h-9 px-2 rounded-xl border border-border bg-background/50 text-xs font-mono"
            title="Timezone Display"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">EST</option>
            <option value="Europe/London">GMT</option>
            <option value="Asia/Kolkata">IST (+05:30)</option>
          </select>
        </div>
      </div>

      {/* MONTH VIEW CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="border border-border rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md shadow-sm">
          {/* Day of week header */}
          <div className="grid grid-cols-7 border-b border-border bg-secondary/30 text-center text-xs font-bold text-muted-foreground py-2.5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {monthMatrix.flatMap((week, weekIdx) =>
              week.map((dayItem, dayIdx) => {
                const y = dayItem.date.getFullYear();
                const m = String(dayItem.date.getMonth() + 1).padStart(2, '0');
                const d = String(dayItem.date.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                const dayNumber = dayItem.date.getDate();
                const isToday = new Date().toDateString() === dayItem.date.toDateString();
                const dayOfWeek = dayItem.date.getDay();

                // Posts matching this day
                const dayPosts = filteredPosts.filter((p) => {
                  if (!p.scheduledAt) return false;
                  const pDate = new Date(p.scheduledAt);
                  const py = pDate.getFullYear();
                  const pm = String(pDate.getMonth() + 1).padStart(2, '0');
                  const pd = String(pDate.getDate()).padStart(2, '0');
                  const pDateStr = `${py}-${pm}-${pd}`;
                  return p.scheduledAt.startsWith(dateStr) || pDateStr === dateStr;
                });

                // Recurring slot on this day
                const hasSlot = recurringSlots.some((s) => s.weekday === dayOfWeek);
                const bestTimesToday = bestTimesByWeekday[dayOfWeek] || [];

                return (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnDay(dateStr)}
                    className={`min-h-[120px] sm:min-h-[140px] p-2 flex flex-col justify-between transition-colors group ${
                      !dayItem.isCurrentMonth
                        ? 'bg-secondary/10 text-muted-foreground/40'
                        : 'bg-card/40 hover:bg-secondary/20'
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-primary text-primary-foreground font-extrabold shadow-sm'
                              : 'text-foreground/80'
                          }`}
                        >
                          {dayNumber}
                        </span>

                        {/* Plus button to create post on this date */}
                        <button
                          onClick={() => onOpenComposer(undefined, dateStr)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                          title="Schedule post on this day"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Best Times Overlay Pill */}
                      {showBestTimes && bestTimesToday.length > 0 && dayItem.isCurrentMonth && (
                        <div className="mb-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                          <span>{bestTimesToday[0]}</span>
                        </div>
                      )}

                      {/* Posts on this Day */}
                      <div className="space-y-1.5">
                        {dayPosts.map((post) => {
                          const isSelected = selectedPostIds.includes(post.id);
                          const isPublished = post.status === 'PUBLISHED';
                          const isPublishing = post.status === 'PUBLISHING';
                          const isFailed = post.status === 'FAILED';

                          return (
                            <div
                              key={post.id}
                              draggable={!isPublished}
                              onDragStart={(e) => handleDragStart(e, post)}
                              className={`p-2 rounded-xl border text-xs cursor-pointer transition-all shadow-sm flex flex-col gap-1 relative group/card ${
                                isSelected
                                  ? 'ring-2 ring-primary bg-primary/10 border-primary'
                                  : 'bg-card border-border/80 hover:border-primary/50'
                              } ${isPublished ? 'cursor-default opacity-90' : 'cursor-grab active:cursor-grabbing'}`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 truncate">
                                  {/* Channel Dot */}
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: post.channel.color }}
                                  />
                                  <span className="font-bold text-[10px] text-foreground truncate">
                                    {post.channel.accountName}
                                  </span>
                                </div>

                                {/* Status Pill */}
                                {isPublished && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Published" />
                                )}
                                {isPublishing && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" title="Publishing" />
                                )}
                                {isFailed && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" title="Failed" />
                                )}
                              </div>

                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                                {post.content}
                              </p>

                              {/* Card action controls on hover */}
                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                <span>{post.scheduledAt?.slice(11, 16)} UTC</span>

                                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePublishNow(post.id);
                                    }}
                                    title="Publish Now"
                                    className="p-0.5 hover:text-foreground"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicatePost(post.id);
                                    }}
                                    title="Duplicate"
                                    className="p-0.5 hover:text-foreground"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePost(post.id);
                                    }}
                                    title="Delete"
                                    className="p-0.5 hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Faint Slot placeholder at bottom if free */}
                    {hasSlot && dayPosts.length === 0 && dayItem.isCurrentMonth && (
                      <button
                        onClick={() => onOpenComposer(undefined, dateStr)}
                        className="w-full mt-1 py-1 rounded-lg border border-dashed border-border/60 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors text-center font-mono opacity-60 hover:opacity-100"
                      >
                        + Queue Slot
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="border border-border rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md divide-y divide-border">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs">
              {t('emptyMonth')}
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ backgroundColor: post.channel.color }}
                  >
                    {post.channel.provider.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">{post.channel.accountName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {post.scheduledAt?.slice(0, 10)} at {post.scheduledAt?.slice(11, 16)} UTC
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-xl">{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {post.status.toLowerCase()}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePublishNow(post.id)}
                      className="h-8 px-2 text-xs"
                      title="Publish Now"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicatePost(post.id)}
                      className="h-8 px-2 text-xs"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePost(post.id)}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating Bulk Actions Toolbar */}
      {selectedPostIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-primary/40 rounded-2xl shadow-2xl p-3 px-6 flex items-center gap-4 z-40 animate-in slide-in-from-bottom-4">
          <span className="text-xs font-bold text-primary">
            {t('bulkActions', { count: selectedPostIds.length })}
          </span>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkReschedule} className="text-xs">
              {t('bulkReschedule')} (+24h)
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="text-xs">
              {t('bulkDelete')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedPostIds([])} className="text-xs">
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
