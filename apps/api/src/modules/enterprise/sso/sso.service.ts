import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { SsoConfigInput } from '@orbitly/shared';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SsoService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev_secret_jwt_key_at_least_32_characters';

  async configureSso(workspaceId: string, input: SsoConfigInput) {
    const domain = input.domain.toLowerCase().trim();

    const connection = await prisma.ssoConnection.upsert({
      where: { workspaceId },
      update: {
        providerType: input.providerType as any,
        domain,
        idpEntityId: input.idpEntityId,
        idpSsoUrl: input.idpSsoUrl,
        idpCertificate: input.idpCertificate,
        oidcClientId: input.oidcClientId,
        oidcClientSecretEnc: input.oidcClientSecret ? `enc_${input.oidcClientSecret}` : undefined,
        oidcIssuer: input.oidcIssuer,
        enforceSso: input.enforceSso,
      },
      create: {
        workspaceId,
        providerType: input.providerType as any,
        domain,
        idpEntityId: input.idpEntityId,
        idpSsoUrl: input.idpSsoUrl,
        idpCertificate: input.idpCertificate,
        oidcClientId: input.oidcClientId,
        oidcClientSecretEnc: input.oidcClientSecret ? `enc_${input.oidcClientSecret}` : undefined,
        oidcIssuer: input.oidcIssuer,
        enforceSso: input.enforceSso,
      },
    });

    // Sync enforceSso back to WorkspaceSettings
    await prisma.workspaceSettings.upsert({
      where: { workspaceId },
      update: { enforceSso: input.enforceSso },
      create: { workspaceId, enforceSso: input.enforceSso },
    });

    return connection;
  }

  async getSsoConfig(workspaceId: string) {
    const sso = await prisma.ssoConnection.findUnique({
      where: { workspaceId },
    });
    return sso;
  }

  async generateIdpLoginUrl(domain: string): Promise<{ url: string; providerType: string }> {
    const cleanDomain = domain.toLowerCase().trim();
    const sso = await prisma.ssoConnection.findUnique({
      where: { domain: cleanDomain },
    });

    if (!sso) {
      throw new NotFoundException(`No enterprise SSO connection found for domain '${cleanDomain}'.`);
    }

    if (sso.providerType === 'SAML') {
      const ssoUrl = sso.idpSsoUrl || 'https://idp.okta.com/app/sso/saml';
      const redirectUrl = `${ssoUrl}?RelayState=${encodeURIComponent(cleanDomain)}&IssueInstant=${Date.now()}`;
      return { url: redirectUrl, providerType: 'SAML' };
    } else {
      const issuer = sso.oidcIssuer || 'https://accounts.google.com/o/oauth2/v2/auth';
      const clientId = sso.oidcClientId || 'orbitly_oidc_client';
      const redirectUri = encodeURIComponent('https://orbitly.app/api/sso/callback');
      const redirectUrl = `${issuer}?client_id=${clientId}&response_type=code&scope=openid%20profile%20email&redirect_uri=${redirectUri}&state=${cleanDomain}`;
      return { url: redirectUrl, providerType: 'OIDC' };
    }
  }

  async processSsoCallback(data: {
    domain: string;
    email: string;
    name?: string;
    samlResponse?: string;
    code?: string;
  }): Promise<{ user: any; tokens: { accessToken: string; refreshToken: string }; workspaceId: string }> {
    const cleanDomain = data.domain.toLowerCase().trim();
    const sso = await prisma.ssoConnection.findUnique({
      where: { domain: cleanDomain },
      include: { workspace: true },
    });

    if (!sso) {
      throw new BadRequestException(`No active SSO configuration for domain: ${cleanDomain}`);
    }

    const email = data.email.toLowerCase().trim();
    if (!email.endsWith(`@${cleanDomain}`)) {
      throw new UnauthorizedException(`User email (${email}) does not match SSO domain (${cleanDomain}).`);
    }

    // JIT (Just-In-Time) User Provisioning
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: data.name || email.split('@')[0],
          emailVerified: new Date(),
          locale: 'en',
          timezone: 'UTC',
        },
      });
    }

    // Ensure Workspace Membership exists
    let membership = await prisma.membership.findFirst({
      where: { userId: user.id, workspaceId: sso.workspaceId },
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          userId: user.id,
          workspaceId: sso.workspaceId,
          role: 'EDITOR',
        },
      });
    }

    // Issue JWT session tokens
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: membership.role,
      currentWorkspaceId: sso.workspaceId,
      ssoProvider: sso.providerType,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, sso: true }, this.jwtSecret, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: membership.role,
      },
      tokens: { accessToken, refreshToken },
      workspaceId: sso.workspaceId,
    };
  }
}
