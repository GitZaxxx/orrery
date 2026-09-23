import {
  registerPlugin,
  listPlugins,
  removePlugin,
  countPlugins,
  __resetRegistryForTests,
} from './registry';

beforeEach(() => {
  __resetRegistryForTests();
});

const valid = { id: 'mcp-github', name: 'GitHub MCP', version: '1.0.0', kind: 'mcp' as const };

describe('plugin registry', () => {
  it('registers a valid manifest', () => {
    registerPlugin(valid);
    expect(countPlugins()).toBe(1);
    expect(listPlugins()[0].id).toBe('mcp-github');
  });

  it('rejects an invalid id', () => {
    expect(() => registerPlugin({ ...valid, id: 'BAD_ID' })).toThrow();
    expect(countPlugins()).toBe(0);
  });

  it('rejects an invalid version', () => {
    expect(() => registerPlugin({ ...valid, version: 'one.two.three' })).toThrow();
  });

  it('rejects an unknown kind', () => {
    expect(() => registerPlugin({ ...valid, kind: 'teleporter' })).toThrow();
  });

  it('upserts on re-register', () => {
    registerPlugin(valid);
    registerPlugin({ ...valid, version: '1.1.0' });
    expect(countPlugins()).toBe(1);
    expect(listPlugins()[0].version).toBe('1.1.0');
  });

  it('removes a plugin', () => {
    registerPlugin(valid);
    expect(removePlugin('mcp-github')).toBe(true);
    expect(countPlugins()).toBe(0);
  });
});
