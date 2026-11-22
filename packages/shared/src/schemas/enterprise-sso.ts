import { z } from 'zod';

export const SsoConfigSchema = z.object({
  providerType: z.enum(['SAML', 'OIDC']).default('SAML'),
  domain: z.string().min(3).max(100),
  idpEntityId: z.string().optional(),
  idpSsoUrl: z.string().url().optional(),
  idpCertificate: z.string().optional(),
  oidcClientId: z.string().optional(),
  oidcClientSecret: z.string().optional(),
  oidcIssuer: z.string().url().optional(),
  enforceSso: z.boolean().default(false),
});

export type SsoConfigInput = z.infer<typeof SsoConfigSchema>;

export const ScimUserSchema = z.object({
  schemas: z.array(z.string()).default(['urn:ietf:params:scim:schemas:core:2.0:User']),
  userName: z.string().email(),
  name: z
    .object({
      formatted: z.string().optional(),
      familyName: z.string().optional(),
      givenName: z.string().optional(),
    })
    .optional(),
  emails: z
    .array(
      z.object({
        value: z.string().email(),
        primary: z.boolean().optional(),
      }),
    )
    .optional(),
  roles: z.array(z.string()).optional(),
  active: z.boolean().default(true),
});

export type ScimUserInput = z.infer<typeof ScimUserSchema>;

export const SiemExportConfigSchema = z.object({
  format: z.enum(['splunk', 'datadog']),
  endpointUrl: z.string().url(),
  token: z.string().min(1),
});

export type SiemExportConfigInput = z.infer<typeof SiemExportConfigSchema>;

export const Soc2ComplianceSettingsSchema = z.object({
  sessionTimeoutMinutes: z.enum(['15', '60', '480']).or(z.number()),
  ipAllowlist: z.array(z.string()).default([]),
  enforceSso: z.boolean().default(false),
});

export type Soc2ComplianceSettingsInput = z.infer<typeof Soc2ComplianceSettingsSchema>;
