import { SetMetadata } from '@nestjs/common';
import { ApiKeyScope } from '@orbitly/shared';

export const SCOPES_KEY = 'api_key_scopes';
export const RequireScope = (...scopes: ApiKeyScope[]) => SetMetadata(SCOPES_KEY, scopes);
