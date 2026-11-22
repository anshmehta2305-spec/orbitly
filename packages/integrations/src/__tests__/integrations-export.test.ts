import { describe, it, expect } from 'vitest';
import { ZapierApp, makeModules, makeConnection, slackManifest } from '../index';

describe('@orbitly/integrations package exports', () => {
  it('should export valid ZapierApp configuration', () => {
    expect(ZapierApp).toBeDefined();
    expect(ZapierApp.version).toBe('1.0.0');
    expect(ZapierApp.triggers.new_post_published).toBeDefined();
    expect(ZapierApp.triggers.post_failed).toBeDefined();
    expect(ZapierApp.creates.create_post).toBeDefined();
    expect(ZapierApp.creates.upload_media).toBeDefined();
  });

  it('should export valid Make modules and connection specification', () => {
    expect(makeModules).toBeDefined();
    expect(Array.isArray(makeModules.modules)).toBe(true);
    expect(makeModules.modules.length).toBeGreaterThanOrEqual(4);

    expect(makeConnection).toBeDefined();
    expect(makeConnection.type).toBe('api-key');
  });

  it('should export valid Slack App Manifest', () => {
    expect(slackManifest).toBeDefined();
    expect(slackManifest.display_information.name).toBe('Orbitly');
    expect(slackManifest.features.slash_commands).toBeDefined();
    expect(slackManifest.features.slash_commands[0].command).toBe('/orbitly');
    expect(slackManifest.oauth_config.scopes.bot).toContain('chat:write');
    expect(slackManifest.oauth_config.scopes.bot).toContain('commands');
  });
});
