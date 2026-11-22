'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Clock,
  KeyRound,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  emailVerified: boolean;
  isDisabled: boolean;
  platformRole?: 'SUPERADMIN' | 'SUPPORT' | null;
  workspacesCount: number;
  createdAt: string;
  lastLoginAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPERADMIN' | 'SUPPORT' | 'STANDARD'>('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);

  const [users, setUsers] = useState<AdminUserRow[]>([
    {
      id: 'usr_sarah_01',
      name: 'Sarah Miller',
      email: 'sarah@example.com',
      emailVerified: true,
      isDisabled: false,
      platformRole: null,
      workspacesCount: 2,
      createdAt: '2026-08-14',
      lastLoginAt: '12 mins ago',
    },
    {
      id: 'usr_alex_02',
      name: 'Alex Rivera',
      email: 'alex@growthagency.io',
      emailVerified: true,
      isDisabled: false,
      platformRole: null,
      workspacesCount: 5,
      createdAt: '2026-09-02',
      lastLoginAt: '1 hour ago',
    },
    {
      id: 'usr_supp_03',
      name: 'Elena Rostova',
      email: 'elena@orbitly.app',
      emailVerified: true,
      isDisabled: false,
      platformRole: 'SUPPORT',
      workspacesCount: 1,
      createdAt: '2026-01-10',
      lastLoginAt: '4 mins ago',
    },
    {
      id: 'usr_spammer_04',
      name: 'Crypto Bot 99',
      email: 'pump100x@tempmail.ninja',
      emailVerified: false,
      isDisabled: true,
      platformRole: null,
      workspacesCount: 1,
      createdAt: '2026-11-20',
      lastLoginAt: '1 day ago',
    },
  ]);

  const handleToggleDisabled = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextState = !u.isDisabled;
          toast.success(`User ${nextState ? 'disabled and access revoked' : 'enabled'}`);
          return { ...u, isDisabled: nextState };
        }
        return u;
      })
    );
  };

  const handleVerifyEmail = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          toast.success(`Marked email as verified for ${u.email}`);
          return { ...u, emailVerified: true };
        }
        return u;
      })
    );
  };

  const handleImpersonate = (user: AdminUserRow) => {
    localStorage.setItem(
      'orbitly_impersonated_user',
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        startedAt: new Date().toISOString(),
      })
    );
    toast.success(`Impersonating ${user.name} for 1 hour. Redirecting to workspace...`);
    setShowImpersonateModal(false);
    setTimeout(() => {
      router.push(`/${locale}/dashboard`);
    }, 1000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (roleFilter === 'SUPERADMIN') return u.platformRole === 'SUPERADMIN';
    if (roleFilter === 'SUPPORT') return u.platformRole === 'SUPPORT';
    if (roleFilter === 'STANDARD') return !u.platformRole;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground">
            Search, inspect, disable, manage verification, or securely impersonate user accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {filteredUsers.length} Users
          </Badge>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(['ALL', 'STANDARD', 'SUPPORT', 'SUPERADMIN'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === tab
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-2xl bg-card/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/40 font-bold text-foreground">
              <th className="p-4">User</th>
              <th className="p-4">Status</th>
              <th className="p-4">Platform Role</th>
              <th className="p-4">Workspaces</th>
              <th className="p-4">Last Active</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        {user.name}
                        {user.emailVerified && (
                          <span title="Email Verified">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {user.isDisabled ? (
                    <Badge variant="outline" className="text-rose-500 border-rose-500/20 bg-rose-500/10 font-bold">
                      DISABLED
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 font-bold">
                      ACTIVE
                    </Badge>
                  )}
                </td>
                <td className="p-4">
                  {user.platformRole ? (
                    <Badge variant="outline" className="text-purple-400 border-purple-400/20 bg-purple-400/10 font-mono">
                      {user.platformRole}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Standard</span>
                  )}
                </td>
                <td className="p-4 font-mono">{user.workspacesCount}</td>
                <td className="p-4 text-muted-foreground">{user.lastLoginAt}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowImpersonateModal(true);
                      }}
                      className="text-[11px] font-bold h-7 gap-1 hover:border-amber-500 hover:text-amber-500"
                    >
                      <KeyRound className="w-3 h-3" /> Impersonate
                    </Button>
                    {!user.emailVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyEmail(user.id)}
                        className="text-[11px] font-bold h-7"
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant={user.isDisabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleDisabled(user.id)}
                      className={`text-[11px] font-bold h-7 ${
                        user.isDisabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'hover:border-rose-500 hover:text-rose-500'
                      }`}
                    >
                      {user.isDisabled ? 'Enable' : 'Disable'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Impersonation Confirmation Modal */}
      {showImpersonateModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Impersonate User</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are about to initiate a 1-hour session as{' '}
                <strong className="text-foreground">{selectedUser.name}</strong> ({selectedUser.email}).
                A prominent banner will remain visible and all actions will be tagged in the audit trail.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border text-[11px] space-y-1">
              <p className="font-semibold text-foreground">Security Protocol:</p>
              <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                <li>No access to user plaintext passwords or Stripe credentials</li>
                <li>Session automatically expires in 60 minutes</li>
                <li>Full audit trail logged with admin IP and timestamp</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowImpersonateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleImpersonate(selectedUser)}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                Start Impersonation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
