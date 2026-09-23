import { extractJson, uiSchema } from './genui';

describe('extractJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses a fenced JSON block', () => {
    expect(extractJson('Here you go:\n```json\n{"b":2}\n```')).toEqual({ b: 2 });
  });

  it('parses JSON surrounded by prose', () => {
    expect(extractJson('Sure! {"c":3} — done.')).toEqual({ c: 3 });
  });

  it('throws when no JSON is present', () => {
    expect(() => extractJson('no json here')).toThrow(/No JSON object found/);
  });
});

describe('uiSchema', () => {
  it('accepts a valid status-card schema', () => {
    const parsed = uiSchema.parse({
      version: '1',
      widgets: [{ type: 'status-card', title: 'CPU', value: '12.3', unit: '%' }],
    });
    expect(parsed.widgets).toHaveLength(1);
  });

  it('accepts a valid chart schema', () => {
    expect(() =>
      uiSchema.parse({
        version: '1',
        widgets: [
          {
            type: 'chart',
            title: 'net',
            chartType: 'area',
            series: [{ name: 'in', points: [{ x: 0, y: 1 }, { x: 1, y: 2 }] }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects an unknown widget type', () => {
    expect(() =>
      uiSchema.parse({ version: '1', widgets: [{ type: 'hologram' as never }] }),
    ).toThrow();
  });

  it('rejects an empty widget list', () => {
    expect(() => uiSchema.parse({ version: '1', widgets: [] })).toThrow();
  });

  it('requires topology-patch to demand confirmation', () => {
    expect(() =>
      uiSchema.parse({
        version: '1',
        widgets: [
          {
            type: 'topology-patch',
            summary: 's',
            requiresConfirmation: false,
            nodes: [],
            edges: [],
          },
        ],
      }),
    ).toThrow();
  });
});
