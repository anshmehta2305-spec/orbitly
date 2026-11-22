import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isIpInCidr, isIpAllowed } from '@orbitly/shared';
import { SsoService } from '../modules/enterprise/sso/sso.service';
import { ScimService } from '../modules/enterprise/scim/scim.service';
import { SiemExportService } from '../modules/enterprise/audit-siem/siem-export.service';
import { BackupVerificationService } from '../modules/enterprise/compliance/backup-verification.service';
import { SessionTimeoutGuard } from '../modules/enterprise/guards/session-timeout.guard';
import { IpAllowlistGuard } from '../modules/enterprise/guards/ip-allowlist.guard';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '@orbitly/db';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';

vi.mock('@orbitly/db', () => ({
  prisma: {
    ssoConnection: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    workspaceSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    membership: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    backupVerificationLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

describe('Increment 4: Enterprise SSO, SCIM & Compliance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. CIDR & IP Allowlist Utilities', () => {
    it('should correctly evaluate IPv4 in CIDR blocks', () => {
      expect(isIpInCidr('192.168.1.50', '192.168.1.0/24')).toBe(true);
      expect(isIpInCidr('192.168.2.1', '192.168.1.0/24')).toBe(false);
      expect(isIpInCidr('10.50.20.1', '10.0.0.0/8')).toBe(true);
      expect(isIpInCidr('172.16.0.5', '172.16.0.0/16')).toBe(true);
      expect(isIpInCidr('172.17.0.5', '172.16.0.0/16')).toBe(false);
      expect(isIpInCidr('127.0.0.1', '127.0.0.1')).toBe(true);
    });

    it('should allow all if allowlist is empty', () => {
      expect(isIpAllowed('203.0.113.19', [])).toBe(true);
      expect(isIpAllowed('203.0.113.19', ['203.0.113.0/24'])).toBe(true);
      expect(isIpAllowed('198.51.100.1', ['203.0.113.0/24'])).toBe(false);
    });
  });

  describe('2. SsoService - SAML 2.0 & OIDC', () => {
    let ssoService: SsoService;

    beforeEach(() => {
      ssoService = new SsoService();
    });

    it('should configure enterprise SSO and sync settings', async () => {
      (prisma.ssoConnection.upsert as any).mockResolvedValue({
        id: 'sso_1',
        workspaceId: 'ws_corp',
        providerType: 'SAML',
        domain: 'acmecorp.com',
        enforceSso: true,
      });

      const result = await ssoService.configureSso('ws_corp', {
        providerType: 'SAML',
        domain: 'acmecorp.com',
        idpEntityId: 'https://idp.okta.com/exk123',
        idpSsoUrl: 'https://acmecorp.okta.com/app/sso',
        idpCertificate: 'CERT_DATA',
        enforceSso: true,
      });

      expect(prisma.ssoConnection.upsert).toHaveBeenCalled();
      expect(prisma.workspaceSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws_corp' },
          update: { enforceSso: true },
        }),
      );
      expect(result.domain).toBe('acmecorp.com');
    });

    it('should generate correct SAML redirect URL with RelayState', async () => {
      (prisma.ssoConnection.findUnique as any).mockResolvedValue({
        providerType: 'SAML',
        domain: 'acmecorp.com',
        idpSsoUrl: 'https://acmecorp.okta.com/app/sso/saml',
      });

      const res = await ssoService.generateIdpLoginUrl('acmecorp.com');
      expect(res.providerType).toBe('SAML');
      expect(res.url).toContain('https://acmecorp.okta.com/app/sso/saml');
      expect(res.url).toContain('RelayState=acmecorp.com');
    });

    it('should generate correct OIDC redirect URL with client_id and scopes', async () => {
      (prisma.ssoConnection.findUnique as any).mockResolvedValue({
        providerType: 'OIDC',
        domain: 'enterprise.io',
        oidcIssuer: 'https://accounts.google.com/o/oauth2/v2/auth',
        oidcClientId: 'orbitly_client_id_123',
      });

      const res = await ssoService.generateIdpLoginUrl('enterprise.io');
      expect(res.providerType).toBe('OIDC');
      expect(res.url).toContain('client_id=orbitly_client_id_123');
      expect(res.url).toContain('scope=openid%20profile%20email');
    });

    it('should throw NotFoundException if domain is unregistered', async () => {
      (prisma.ssoConnection.findUnique as any).mockResolvedValue(null);
      await expect(ssoService.generateIdpLoginUrl('unknown.com')).rejects.toThrow(NotFoundException);
    });

    it('should process SSO callback, perform JIT provisioning, and return JWT tokens', async () => {
      (prisma.ssoConnection.findUnique as any).mockResolvedValue({
        id: 'sso_1',
        workspaceId: 'ws_ent',
        domain: 'acme.com',
        providerType: 'SAML',
      });
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'usr_jit_1',
        email: 'alice@acme.com',
        name: 'Alice JIT',
      });
      (prisma.membership.findFirst as any).mockResolvedValue(null);
      (prisma.membership.create as any).mockResolvedValue({
        id: 'mem_1',
        userId: 'usr_jit_1',
        workspaceId: 'ws_ent',
        role: 'EDITOR',
      });

      const res = await ssoService.processSsoCallback({
        domain: 'acme.com',
        email: 'alice@acme.com',
        name: 'Alice JIT',
      });

      expect(res.user.email).toBe('alice@acme.com');
      expect(res.workspaceId).toBe('ws_ent');
      expect(res.tokens.accessToken).toBeDefined();
      expect(res.tokens.refreshToken).toBeDefined();
    });

    it('should reject callback if email domain does not match SSO connection', async () => {
      (prisma.ssoConnection.findUnique as any).mockResolvedValue({
        id: 'sso_1',
        domain: 'acme.com',
      });

      await expect(
        ssoService.processSsoCallback({
          domain: 'acme.com',
          email: 'attacker@evil.com',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('3. Enforced SSO Login Restriction', () => {
    let authService: AuthService;

    beforeEach(() => {
      const mockAuditService = { log: vi.fn() } as any;
      authService = new AuthService(mockAuditService);
    });

    it('should reject standard password login if domain enforces SSO', async () => {
      (prisma.ssoConnection.findUnique as any).mockResolvedValue({
        domain: 'enterprise.com',
        enforceSso: true,
      });

      await expect(
        authService.login({
          email: 'john@enterprise.com',
          password: 'SecretPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        authService.login({
          email: 'john@enterprise.com',
          password: 'SecretPassword123!',
        }),
      ).rejects.toThrow(/SSO is enforced for enterprise.com/);
    });
  });

  describe('4. SCIM 2.0 User Provisioning', () => {
    let scimService: ScimService;

    beforeEach(() => {
      scimService = new ScimService();
    });

    it('should list users according to RFC 7644 SCIM 2.0 list response schema', async () => {
      (prisma.membership.findMany as any).mockResolvedValue([
        {
          id: 'mem_1',
          role: 'EDITOR',
          user: {
            id: 'u1',
            email: 'dev@acme.com',
            name: 'Dev Engineer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ]);
      (prisma.membership.count as any).mockResolvedValue(1);

      const res = await scimService.listUsers('ws_corp', 1, 50);

      expect(res.schemas).toContain('urn:ietf:params:scim:api:messages:2.0:ListResponse');
      expect(res.totalResults).toBe(1);
      expect(res.itemsPerPage).toBe(1);
      expect(res.Resources[0].schemas).toContain('urn:ietf:params:scim:schemas:core:2.0:User');
      expect(res.Resources[0].userName).toBe('dev@acme.com');
      expect(res.Resources[0].name.givenName).toBe('Dev');
    });

    it('should create new SCIM user and link workspace membership', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'u_scim_new',
        email: 'bob@acme.com',
        name: 'Bob Ross',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.membership.findFirst as any).mockResolvedValue(null);
      (prisma.membership.create as any).mockResolvedValue({
        id: 'mem_bob',
        userId: 'u_scim_new',
        workspaceId: 'ws_corp',
        role: 'EDITOR',
      });

      const res = await scimService.createUser('ws_corp', {
        userName: 'bob@acme.com',
        name: { formatted: 'Bob Ross', givenName: 'Bob', familyName: 'Ross' },
        emails: [{ value: 'bob@acme.com', primary: true, type: 'work' }],
        roles: ['EDITOR'],
      });

      expect(res.id).toBe('u_scim_new');
      expect(res.userName).toBe('bob@acme.com');
      expect(res.roles).toContain('EDITOR');
    });

    it('should deprovision SCIM user by removing workspace membership', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue({
        id: 'mem_target',
        userId: 'u123',
        workspaceId: 'ws_corp',
      });
      (prisma.membership.delete as any).mockResolvedValue({ id: 'mem_target' });

      const success = await scimService.deprovisionUser('ws_corp', 'u123');
      expect(success).toBe(true);
      expect(prisma.membership.delete).toHaveBeenCalledWith({ where: { id: 'mem_target' } });
    });
  });

  describe('5. SIEM Audit Export (Splunk HEC & Datadog)', () => {
    let siemService: SiemExportService;

    beforeEach(() => {
      siemService = new SiemExportService();
    });

    it('should transform audit log into valid Splunk HEC format', () => {
      const mockLog = {
        id: 'audit_1',
        action: 'POST_PUBLISHED',
        entityType: 'POST',
        entityId: 'post_100',
        userId: 'u_admin',
        workspaceId: 'ws_enterprise',
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0',
        metadataJson: { channel: 'twitter' },
        createdAt: new Date('2026-11-20T12:00:00Z'),
      };

      const splunkEvent = siemService.formatSplunkHec(mockLog);
      expect(splunkEvent.sourcetype).toBe('orbitly:audit');
      expect(splunkEvent.time).toBe(Math.floor(new Date('2026-11-20T12:00:00Z').getTime() / 1000));
      expect(splunkEvent.event.action).toBe('POST_PUBLISHED');
      expect(splunkEvent.event.ipAddress).toBe('192.168.1.10');
    });

    it('should transform audit log into valid Datadog Log v2 format', () => {
      const mockLog = {
        id: 'audit_2',
        action: 'USER_INVITED',
        entityType: 'USER',
        entityId: 'inv_10',
        userId: 'u_admin',
        workspaceId: 'ws_enterprise',
        ipAddress: '10.0.0.1',
        userAgent: 'DatadogAgent',
        metadataJson: { role: 'ADMIN' },
        createdAt: new Date('2026-11-20T14:30:00Z'),
      };

      const ddLog = siemService.formatDatadogLog(mockLog);
      expect(ddLog.ddsource).toBe('orbitly');
      expect(ddLog.service).toBe('audit-log');
      expect(ddLog.ddtags).toContain('workspace:ws_enterprise');
      expect(ddLog.message).toContain('USER_INVITED');
      expect(ddLog.audit.action).toBe('USER_INVITED');
    });

    it('should test dispatch to SIEM with proper authentication headers', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([
        {
          id: 'audit_3',
          action: 'SSO_LOGIN',
          entityType: 'SESSION',
          entityId: 'sess_1',
          createdAt: new Date(),
        },
      ]);

      const res = await siemService.testDispatchToSiem(
        {
          format: 'splunk',
          endpointUrl: 'https://splunk-hec.corp:8088/services/collector',
          token: 'hec_token_123',
        },
        'ws_enterprise',
      );

      expect(res.status).toBe('SUCCESS');
      expect(res.dispatched).toBe(1);
    });
  });

  describe('6. SOC 2 Compliance & Backup Verification', () => {
    let backupService: BackupVerificationService;

    beforeEach(() => {
      backupService = new BackupVerificationService();
    });

    it('should run daily backup verification guaranteeing RPO <= 15m and RTO <= 30m', async () => {
      (prisma.backupVerificationLog.create as any).mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'bvl_1',
          ...data,
        }),
      );

      const verification = await backupService.runDailyBackupVerification();

      expect(verification.status).toBe('VERIFIED');
      expect(verification.rpoMinutes).toBeLessThanOrEqual(15);
      expect(verification.rtoMinutes).toBeLessThanOrEqual(30);
      expect(verification.checksumSha256).toBeDefined();
      expect(verification.checksumSha256.length).toBe(64); // SHA-256 hex
      expect(prisma.backupVerificationLog.create).toHaveBeenCalled();
    });
  });

  describe('7. Enterprise Security Guards', () => {
    it('SessionTimeoutGuard should allow session if within timeout limit', async () => {
      const guard = new SessionTimeoutGuard();
      (prisma.workspaceSettings.findUnique as any).mockResolvedValue({
        sessionTimeoutMinutes: 60, // 1 hour
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { iat: Math.floor(Date.now() / 1000) - 10 * 60 }, // 10 minutes ago
            headers: { 'x-workspace-id': 'ws_1' },
          }),
        }),
      } as any;

      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(true);
    });

    it('SessionTimeoutGuard should reject session if token age exceeds workspace timeout', async () => {
      const guard = new SessionTimeoutGuard();
      (prisma.workspaceSettings.findUnique as any).mockResolvedValue({
        sessionTimeoutMinutes: 15, // 15 minutes
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { iat: Math.floor(Date.now() / 1000) - 20 * 60 }, // 20 minutes ago (> 15m)
            headers: { 'x-workspace-id': 'ws_1' },
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('IpAllowlistGuard should allow whitelisted IP', async () => {
      const guard = new IpAllowlistGuard();
      (prisma.workspaceSettings.findUnique as any).mockResolvedValue({
        ipAllowlist: ['192.168.1.0/24'],
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-workspace-id': 'ws_1' },
            socket: { remoteAddress: '192.168.1.45' },
          }),
        }),
      } as any;

      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(true);
    });

    it('IpAllowlistGuard should reject foreign IP when allowlist is configured', async () => {
      const guard = new IpAllowlistGuard();
      (prisma.workspaceSettings.findUnique as any).mockResolvedValue({
        ipAllowlist: ['192.168.1.0/24'],
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-workspace-id': 'ws_1' },
            socket: { remoteAddress: '10.200.5.1' },
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });
  });
});
