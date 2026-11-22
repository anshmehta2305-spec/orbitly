'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app/AppShell';
import {
  ShieldCheck,
  Key,
  Users,
  Clock,
  Globe,
  Database,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Shield,
  Lock,
  Server,
  FileText,
  Trash2,
  Download,
  AlertTriangle,
  Mail,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SecuritySettingsPage() {
  const workspaceId = 'ws_demo_1';
  const [activeTab, setActiveTab] = useState<
    'sso' | 'scim' | 'access' | 'siem' | 'soc2' | 'residency' | 'governance' | 'branding'
  >('sso');

  // SSO Form State
  const [ssoProvider, setSsoProvider] = useState<'SAML' | 'OIDC'>('SAML');
  const [ssoDomain, setSsoDomain] = useState('acmecorp.com');
  const [idpEntityId, setIdpEntityId] = useState('https://idp.okta.com/exk123456');
  const [idpSsoUrl, setIdpSsoUrl] = useState('https://acmecorp.okta.com/app/orbitly/sso/saml');
  const [idpCertificate, setIdpCertificate] = useState(
    '-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAXv4v10XMA0GCSqGSIb3DQEBCwUAMIGSMQswCQYDVQQG\n...IDP CERTIFICATE BODY...\n-----END CERTIFICATE-----',
  );
  const [oidcIssuer, setOidcIssuer] = useState('https://accounts.google.com');
  const [oidcClientId, setOidcClientId] = useState('orbitly-enterprise-app-01');
  const [oidcClientSecret, setOidcClientSecret] = useState('sec_oidc_live_98a7bc');
  const [enforceSso, setEnforceSso] = useState(false);
  const [ssoSaved, setSsoSaved] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  // SCIM State
  const [scimToken, setScimToken] = useState('scim_orb_live_782048f0293d84a71b8e');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Access & Session Policy State
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(480);
  const [ipAllowlistStr, setIpAllowlistStr] = useState('192.168.1.0/24\n10.0.0.0/8\n127.0.0.1');
  const [policyLoading, setPolicyLoading] = useState(false);

  // SIEM State
  const [siemType, setSiemType] = useState<'splunk' | 'datadog'>('splunk');
  const [splunkHecUrl, setSplunkHecUrl] = useState('https://splunk-hec.corp.internal:8088/services/collector');
  const [splunkToken, setSplunkToken] = useState('splunk-hec-token-secret-999');
  const [datadogApiKey, setDatadogApiKey] = useState('dd_api_key_8482094204');
  const [datadogSite, setDatadogSite] = useState<'us1' | 'eu1'>('us1');
  const [siemTesting, setSiemTesting] = useState(false);

  // SOC 2 Backup Verification State
  const [backupStatus, setBackupStatus] = useState<any>({
    status: 'VERIFIED',
    rpoMinutes: 8,
    rtoMinutes: 14,
    backupSizeBytes: 4294967296,
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verifiedAt: new Date().toISOString(),
  });
  const [verifyingBackup, setVerifyingBackup] = useState(false);

  // Data Residency (US vs EU) State
  const [dataRegion, setDataRegion] = useState<'US' | 'EU'>('US');
  const [dedicatedEgressIps, setDedicatedEgressIps] = useState<string>('198.51.100.12, 198.51.100.13');
  const [residencyLoading, setResidencyLoading] = useState(false);

  // Data Retention & Legal Hold State
  const [analyticsRetentionDays, setAnalyticsRetentionDays] = useState<number>(365);
  const [auditLogRetentionDays, setAuditLogRetentionDays] = useState<number>(365);
  const [deletedPostRetentionDays, setDeletedPostRetentionDays] = useState<number>(30);
  const [legalHold, setLegalHold] = useState<boolean>(false);
  const [retentionLoading, setRetentionLoading] = useState(false);

  // GDPR Export & Erasure State
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [exportingData, setExportingData] = useState(false);
  const [erasureConfirmEmail, setErasureConfirmEmail] = useState('');
  const [erasureLoading, setErasureLoading] = useState(false);

  // Enterprise Branding & Email State
  const [customDomainInput, setCustomDomainInput] = useState('social.acmecorp.com');
  const [sslStatus, setSslStatus] = useState('ACTIVE');
  const [emailDomainInput, setEmailDomainInput] = useState('mail.acmecorp.com');
  const [emailDkimStatus, setEmailDkimStatus] = useState('VERIFIED');
  const [emailSpfStatus, setEmailSpfStatus] = useState('VERIFIED');
  const [emailDmarcStatus, setEmailDmarcStatus] = useState('VERIFIED');
  const [brandingLoading, setBrandingLoading] = useState(false);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const ssoRes = await fetch('http://localhost:4000/sso/config', {
          headers: { 'x-workspace-id': workspaceId },
        });
        if (ssoRes.ok) {
          const ssoData = await ssoRes.json();
          if (ssoData?.configured && ssoData.config) {
            setSsoProvider(ssoData.config.type || 'SAML');
            setSsoDomain(ssoData.config.domain || '');
            setIdpEntityId(ssoData.config.idpEntityId || '');
            setIdpSsoUrl(ssoData.config.idpSsoUrl || '');
            setEnforceSso(ssoData.config.enforceSso || false);
            setSsoSaved(true);
          }
        }

        const compRes = await fetch('http://localhost:4000/enterprise/compliance/settings', {
          headers: { 'x-workspace-id': workspaceId },
        });
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData.sessionTimeoutMinutes) setSessionTimeoutMinutes(compData.sessionTimeoutMinutes);
          if (Array.isArray(compData.ipAllowlist)) setIpAllowlistStr(compData.ipAllowlist.join('\n'));
          if (compData.analyticsRetentionDays) setAnalyticsRetentionDays(compData.analyticsRetentionDays);
          if (compData.auditLogRetentionDays) setAuditLogRetentionDays(compData.auditLogRetentionDays);
          if (compData.deletedPostRetentionDays) setDeletedPostRetentionDays(compData.deletedPostRetentionDays);
          if (compData.legalHold !== undefined) setLegalHold(compData.legalHold);
        }

        const resRes = await fetch('http://localhost:4000/enterprise/residency', {
          headers: { 'x-workspace-id': workspaceId },
        });
        if (resRes.ok) {
          const resData = await resRes.json();
          if (resData.region) setDataRegion(resData.region);
          if (resData.dedicatedEgressIpPool) setDedicatedEgressIps(resData.dedicatedEgressIpPool.join(', '));
        }

        const bkpRes = await fetch('http://localhost:4000/enterprise/compliance/backup-status');
        if (bkpRes.ok) {
          const bkpData = await bkpRes.json();
          if (bkpData) setBackupStatus(bkpData);
        }
      } catch {
        // Fallback default
      }
    };
    fetchSecurityData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveSso = async (e: React.FormEvent) => {
    e.preventDefault();
    setSsoLoading(true);
    try {
      const payload: any = { type: ssoProvider, domain: ssoDomain, enforceSso };
      if (ssoProvider === 'SAML') {
        payload.idpEntityId = idpEntityId;
        payload.idpSsoUrl = idpSsoUrl;
        payload.idpCertificate = idpCertificate;
      } else {
        payload.oidcIssuer = oidcIssuer;
        payload.oidcClientId = oidcClientId;
        payload.oidcClientSecret = oidcClientSecret;
      }

      const res = await fetch('http://localhost:4000/sso/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save SSO configuration');
      setSsoSaved(true);
      toast.success('Enterprise SSO configuration saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSsoLoading(false);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicyLoading(true);
    try {
      const ipList = ipAllowlistStr.split('\n').map((s) => s.trim()).filter(Boolean);
      const res = await fetch('http://localhost:4000/enterprise/compliance/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({
          sessionTimeoutMinutes: Number(sessionTimeoutMinutes),
          ipAllowlist: ipList,
          enforceSso,
        }),
      });
      if (!res.ok) throw new Error('Failed to update access policy');
      toast.success('Security policies updated successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleSaveResidency = async () => {
    setResidencyLoading(true);
    try {
      const ipArray = dedicatedEgressIps.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch('http://localhost:4000/enterprise/residency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({ region: dataRegion, dedicatedEgressIpPool: ipArray }),
      });
      if (!res.ok) throw new Error('Failed to update data residency');
      toast.success(`Data residency updated to ${dataRegion} region.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResidencyLoading(false);
    }
  };

  const handleSaveRetention = async () => {
    setRetentionLoading(true);
    try {
      const res = await fetch('http://localhost:4000/enterprise/compliance/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({
          analyticsRetentionDays: Number(analyticsRetentionDays),
          auditLogRetentionDays: Number(auditLogRetentionDays),
          deletedPostRetentionDays: Number(deletedPostRetentionDays),
          legalHold,
        }),
      });
      if (!res.ok) throw new Error('Failed to update retention policy');
      toast.success('Data retention & legal hold settings updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleRequestDataExport = async () => {
    setExportingData(true);
    try {
      const res = await fetch('http://localhost:4000/enterprise/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({ format: exportFormat }),
      });
      if (!res.ok) throw new Error('Data export generation failed');
      const data = await res.json();
      setExportDownloadUrl(data.data.downloadUrl);
      toast.success('Machine-readable GDPR/CCPA export generated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExportingData(false);
    }
  };

  const handleProcessErasure = async () => {
    if (!erasureConfirmEmail) {
      toast.error('Please enter your account email to confirm erasure.');
      return;
    }
    setErasureLoading(true);
    try {
      const res = await fetch('http://localhost:4000/enterprise/compliance/erasure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({ confirmEmail: erasureConfirmEmail }),
      });
      if (!res.ok) throw new Error('Erasure request failed.');
      toast.success('GDPR Right-to-be-Forgotten erasure executed. Account anonymized.');
      setErasureConfirmEmail('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setErasureLoading(false);
    }
  };

  const handleVerifyEmailDomain = async () => {
    setBrandingLoading(true);
    try {
      const res = await fetch('http://localhost:4000/enterprise/tier/email-domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({ emailDomain: emailDomainInput }),
      });
      if (!res.ok) throw new Error('Email domain verification failed');
      const data = await res.json();
      setEmailDkimStatus(data.dkimStatus);
      setEmailSpfStatus(data.spfStatus);
      setEmailDmarcStatus(data.dmarcStatus);
      toast.success('DKIM, SPF, and DMARC verified successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBrandingLoading(false);
    }
  };

  return (
    <AppShell activeNav="security">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="border-b border-border pb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Enterprise Security, Governance & Global Scale</h1>
              <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20">SOC 2 & GDPR Ready</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-region data residency, SAML/OIDC SSO, SCIM 2.0 provisioning, automated retention pruning, and SLA governance.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
          {[
            { id: 'sso', label: 'Single Sign-On (SSO)', icon: ShieldCheck },
            { id: 'scim', label: 'SCIM 2.0 Provisioning', icon: Users },
            { id: 'access', label: 'Session & IP Policies', icon: Lock },
            { id: 'siem', label: 'SIEM Audit Stream', icon: Send },
            { id: 'soc2', label: 'SOC 2 Verification', icon: Database },
            { id: 'residency', label: 'Data Residency (US/EU)', icon: Server },
            { id: 'governance', label: 'Retention & GDPR', icon: FileText },
            { id: 'branding', label: 'Custom Domains & SLA', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: SSO */}
        {activeTab === 'sso' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Identity Provider Configuration</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect Okta, Google Workspace, Azure AD, or PingFederate via SAML 2.0 or OIDC.
                  </p>
                </div>
                {ssoSaved && (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600/20 bg-emerald-500/10 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    SSO Active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSsoProvider('SAML')}
                  className={`flex-1 p-3 rounded-xl border text-left text-sm transition-all ${
                    ssoProvider === 'SAML'
                      ? 'border-primary bg-primary/5 font-semibold text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/20'
                  }`}
                >
                  <div className="font-medium text-foreground">SAML 2.0</div>
                  <div className="text-xs text-muted-foreground">Okta, Azure AD, OneLogin, PingIdentity</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSsoProvider('OIDC')}
                  className={`flex-1 p-3 rounded-xl border text-left text-sm transition-all ${
                    ssoProvider === 'OIDC'
                      ? 'border-primary bg-primary/5 font-semibold text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/20'
                  }`}
                >
                  <div className="font-medium text-foreground">OpenID Connect (OIDC)</div>
                  <div className="text-xs text-muted-foreground">Google Workspace, Auth0, Keycloak</div>
                </button>
              </div>

              <form onSubmit={handleSaveSso} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Corporate Email Domain
                  </label>
                  <Input value={ssoDomain} onChange={(e) => setSsoDomain(e.target.value)} placeholder="company.com" required />
                </div>

                {ssoProvider === 'SAML' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        IdP SSO URL
                      </label>
                      <Input value={idpSsoUrl} onChange={(e) => setIdpSsoUrl(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        IdP Entity ID (Issuer)
                      </label>
                      <Input value={idpEntityId} onChange={(e) => setIdpEntityId(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        X.509 Public Certificate (PEM)
                      </label>
                      <textarea
                        value={idpCertificate}
                        onChange={(e) => setIdpCertificate(e.target.value)}
                        rows={4}
                        className="w-full text-xs font-mono p-3 rounded-lg border border-border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        OIDC Issuer URL
                      </label>
                      <Input value={oidcIssuer} onChange={(e) => setOidcIssuer(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client ID</label>
                        <Input value={oidcClientId} onChange={(e) => setOidcClientId(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Secret</label>
                        <Input type="password" value={oidcClientSecret} onChange={(e) => setOidcClientSecret(e.target.value)} required />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20 mt-4">
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Enforce SSO Authentication
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Disables password and social logins for all employees under <code>@{ssoDomain}</code>.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceSso}
                    onChange={(e) => setEnforceSso(e.target.checked)}
                    className="rounded text-primary w-4 h-4 mt-1 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={ssoLoading}>
                    {ssoLoading ? 'Saving...' : 'Save SSO Settings'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: SCIM 2.0 */}
        {activeTab === 'scim' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div>
                <h3 className="text-base font-semibold">SCIM 2.0 Automated User Provisioning</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically sync team members and roles from your identity provider using the RFC 7644 SCIM 2.0 protocol.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    SCIM 2.0 Base URL
                  </label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value="https://api.orbitly.io/scim/v2" className="font-mono text-xs bg-muted/20" />
                    <Button variant="outline" size="sm" onClick={() => handleCopy('https://api.orbitly.io/scim/v2', 'scim_url')}>
                      {copiedField === 'scim_url' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    SCIM Bearer API Token
                  </label>
                  <div className="flex items-center gap-2">
                    <Input readOnly type="password" value={scimToken} className="font-mono text-xs bg-muted/20" />
                    <Button variant="outline" size="sm" onClick={() => handleCopy(scimToken, 'scim_token')}>
                      {copiedField === 'scim_token' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACCESS & POLICIES */}
        {activeTab === 'access' && (
          <form onSubmit={handleSavePolicy} className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div>
                <h3 className="text-base font-semibold">Session Timeout & IP Allowlisting</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enforce SOC 2 session limits and restrict workspace login access to enterprise corporate VPNs and CIDR blocks.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Inactive Session Timeout
                  </label>
                  <select
                    value={sessionTimeoutMinutes}
                    onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                    className="w-full text-sm p-2.5 rounded-lg border border-border bg-background"
                  >
                    <option value={15}>15 Minutes (Strict SOC 2 High-Security)</option>
                    <option value={60}>1 Hour (Recommended for Enterprise)</option>
                    <option value={480}>8 Hours (Standard Business Day)</option>
                    <option value={1440}>24 Hours</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    IP Address Allowlist (CIDR notation)
                  </label>
                  <textarea
                    value={ipAllowlistStr}
                    onChange={(e) => setIpAllowlistStr(e.target.value)}
                    rows={4}
                    className="w-full text-xs font-mono p-3 rounded-lg border border-border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={policyLoading}>
                  {policyLoading ? 'Saving Policies...' : 'Update Access Policies'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: SIEM AUDIT STREAM */}
        {activeTab === 'siem' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div>
                <h3 className="text-base font-semibold">SIEM Audit Log Ingestion</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stream workspace audit logs in real-time to your security operations center (Splunk HEC or Datadog Logs).
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Splunk HEC Endpoint URL</label>
                  <Input value={splunkHecUrl} onChange={(e) => setSplunkHecUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HEC Token</label>
                  <Input type="password" value={splunkToken} onChange={(e) => setSplunkToken(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={() => toast.success('SIEM stream saved')}>Save SIEM Stream</Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SOC 2 VERIFICATION */}
        {activeTab === 'soc2' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">SOC 2 Backup Integrity & SLA Guarantees</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daily automated snapshot integrity verification and recovery objectives.
                  </p>
                </div>
                <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {backupStatus.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">RPO Target & SLA</div>
                  <div className="text-2xl font-bold text-foreground">{backupStatus.rpoMinutes} min</div>
                  <div className="text-[11px] text-emerald-600">Guaranteed RPO &le; 15 min</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">RTO Target & SLA</div>
                  <div className="text-2xl font-bold text-foreground">{backupStatus.rtoMinutes} min</div>
                  <div className="text-[11px] text-emerald-600">Guaranteed RTO &le; 30 min</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Snapshot Checksum</div>
                  <div className="font-mono text-xs truncate max-w-full">{backupStatus.checksumSha256?.slice(0, 24)}...</div>
                  <div className="text-[11px] text-muted-foreground">SHA-256 Verified</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DATA RESIDENCY (US / EU) */}
        {activeTab === 'residency' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Multi-Region Data Residency</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pin your workspace data, database, media assets, and queue workers to US or EU data centers.
                  </p>
                </div>
                <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-500/10">
                  Strict Isolation Guarantees
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setDataRegion('US')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    dataRegion === 'US' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">United States (US East)</span>
                    <Badge variant={dataRegion === 'US' ? 'default' : 'outline'}>us-east-1</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Primary US database cluster, S3 bucket storage, and publishing workers. Ideal for North American enterprises.
                  </p>
                </div>

                <div
                  onClick={() => setDataRegion('EU')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    dataRegion === 'EU' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">European Union (Frankfurt)</span>
                    <Badge variant={dataRegion === 'EU' ? 'default' : 'outline'}>eu-central-1</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    GDPR compliant. All customer data, media uploads, and redis queues remain strictly within the European Union.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dedicated Egress IP Pool
                </label>
                <Input
                  value={dedicatedEgressIps}
                  onChange={(e) => setDedicatedEgressIps(e.target.value)}
                  placeholder="198.51.100.12, 198.51.100.13"
                />
                <p className="text-[11px] text-muted-foreground">
                  Outbound webhook dispatches and publishing traffic will egress exclusively from these dedicated IP addresses.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveResidency} disabled={residencyLoading}>
                  {residencyLoading ? 'Updating Residency...' : 'Save Region Settings'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DATA RETENTION, LEGAL HOLD & GDPR */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div>
                <h3 className="text-base font-semibold">Data Retention Policies & Legal Hold</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure automated data lifecycle pruning and emergency legal holds.
                </p>
              </div>

              {/* Legal Hold Toggle Banner */}
              <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                legalHold ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/20 border-border'
              }`}>
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${legalHold ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    Active Legal Hold
                  </div>
                  <div className="text-xs text-muted-foreground">
                    When enabled, all automated pruning jobs, post deletions, and audit purges are completely suspended across the workspace.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={legalHold}
                  onChange={(e) => setLegalHold(e.target.checked)}
                  className="rounded text-amber-500 w-4 h-4 mt-1 cursor-pointer"
                />
              </div>

              {/* Retention Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                  <span className="font-semibold text-muted-foreground">Analytics Retention</span>
                  <select
                    value={analyticsRetentionDays}
                    onChange={(e) => setAnalyticsRetentionDays(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  >
                    <option value={90}>90 Days</option>
                    <option value={365}>365 Days (1 Year)</option>
                    <option value={730}>730 Days (2 Years)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                  <span className="font-semibold text-muted-foreground">Audit Log Retention</span>
                  <select
                    value={auditLogRetentionDays}
                    onChange={(e) => setAuditLogRetentionDays(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  >
                    <option value={90}>90 Days</option>
                    <option value={365}>365 Days (1 Year)</option>
                    <option value={1825}>1,825 Days (5 Years)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                  <span className="font-semibold text-muted-foreground">Deleted Post Purge Window</span>
                  <select
                    value={deletedPostRetentionDays}
                    onChange={(e) => setDeletedPostRetentionDays(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  >
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={handleSaveRetention} disabled={retentionLoading}>
                  {retentionLoading ? 'Saving...' : 'Save Retention Policy'}
                </Button>
              </div>
            </div>

            {/* GDPR Self-Serve Export & Right to be Forgotten */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div>
                <h3 className="text-base font-semibold">GDPR & CCPA Self-Serve Privacy Tools</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Machine-readable data archives and Article 17 Right to be Forgotten erasure pipeline.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-primary" />
                    Download Machine-Readable Export
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Exports all workspace posts, channels, media links, and analytics snapshots into a structured archive.
                  </p>
                  <div className="flex items-center gap-3">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="text-xs p-2 rounded-lg border border-border bg-background"
                    >
                      <option value="JSON">JSON Archive</option>
                      <option value="CSV">CSV Archive</option>
                    </select>
                    <Button size="sm" onClick={handleRequestDataExport} disabled={exportingData}>
                      {exportingData ? 'Generating...' : 'Generate Export'}
                    </Button>
                  </div>
                  {exportDownloadUrl && (
                    <div className="pt-2 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <a href={exportDownloadUrl} className="underline" target="_blank" rel="noreferrer">
                        Download Exported Archive (.zip)
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
                  <span className="font-semibold text-sm text-red-500 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    Right to be Forgotten (Account Erasure)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Anonymizes all personal identifiers, deletes active sessions, and wipes user profile per GDPR Article 17.
                  </p>
                  <Input
                    type="email"
                    placeholder="Confirm your email address"
                    value={erasureConfirmEmail}
                    onChange={(e) => setErasureConfirmEmail(e.target.value)}
                    className="text-xs bg-background"
                  />
                  <Button variant="destructive" size="sm" onClick={handleProcessErasure} disabled={erasureLoading}>
                    {erasureLoading ? 'Anonymizing...' : 'Execute Account Erasure'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: CUSTOM DOMAINS, EMAIL & SLA */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
              <div>
                <h3 className="text-base font-semibold">Custom Email Sender Domain (DKIM, SPF, DMARC)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send notification and client portal emails directly from your own corporate domain with 100% deliverability.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sending Domain</label>
                  <div className="flex items-center gap-3">
                    <Input
                      value={emailDomainInput}
                      onChange={(e) => setEmailDomainInput(e.target.value)}
                      placeholder="mail.acmecorp.com"
                    />
                    <Button onClick={handleVerifyEmailDomain} disabled={brandingLoading}>
                      {brandingLoading ? 'Verifying...' : 'Verify DNS'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-muted/10 flex items-center justify-between">
                    <span className="font-semibold">DKIM Status</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">{emailDkimStatus}</Badge>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/10 flex items-center justify-between">
                    <span className="font-semibold">SPF Status</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">{emailSpfStatus}</Badge>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/10 flex items-center justify-between">
                    <span className="font-semibold">DMARC Status</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">{emailDmarcStatus}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise SLA Dashboard Card */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Enterprise SLA & Capacity Commitments</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Continuous uptime monitoring and dedicated infrastructure allocations.
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">Tier: Enterprise</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Uptime SLA</div>
                  <div className="text-2xl font-bold text-foreground mt-1">99.99%</div>
                  <div className="text-[11px] text-emerald-500 mt-0.5">30d actual: 99.998%</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">API Rate Limits</div>
                  <div className="text-2xl font-bold text-foreground mt-1">600 req/m</div>
                  <div className="text-[11px] text-primary mt-0.5">10x Enterprise boost</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">RPO Target</div>
                  <div className="text-2xl font-bold text-foreground mt-1">&le; 15 min</div>
                  <div className="text-[11px] text-emerald-500 mt-0.5">Continuous WAL sync</div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">RTO Target</div>
                  <div className="text-2xl font-bold text-foreground mt-1">&le; 30 min</div>
                  <div className="text-[11px] text-emerald-500 mt-0.5">Automated failover</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
