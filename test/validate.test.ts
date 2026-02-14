/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import {
  validateGraphData,
  SchemaValidationError,
} from '../src/validate.js';

function makeValidGraph() {
  return {
    schema_version: '1.0',
    meta: {
      repo: 'test-repo',
      generated_at: '2025-01-01T00:00:00Z',
    },
    nodes: [
      {
        id: 'res://main.gd',
        kind: 'script',
        language: 'gdscript',
        name: 'main.gd',
        metrics: { loc: 100, cc: 5, mi: 70 },
        tags: ['entry'],
      },
      {
        id: 'res://player.gd',
        kind: 'script',
        language: 'gdscript',
        name: 'player.gd',
        metrics: { loc: 200, cc: 10, mi: 60 },
        tags: [],
      },
    ],
    links: [
      {
        source: 'res://main.gd',
        target: 'res://player.gd',
        kind: 'preload',
        weight: 1,
        evidence: [{ file: 'main.gd', line: 3 }],
      },
    ],
  };
}

describe('validateGraphData', () => {
  it('accepts valid graph data and returns typed result', () => {
    const data = makeValidGraph();
    const result = validateGraphData(data);
    expect(result.schema_version).toBe('1.0');
    expect(result.nodes).toHaveLength(2);
    expect(result.links).toHaveLength(1);
    expect(result.meta.repo).toBe('test-repo');
  });

  it('throws SchemaValidationError instances on invalid input', () => {
    let caught: unknown;
    try { validateGraphData(null); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(SchemaValidationError);
    expect((caught as Error).message).toBe('Graph data must be a non-null object');
  });

  it('throws when data is not an object', () => {
    expect(() => validateGraphData(null)).toThrow(
      'Graph data must be a non-null object'
    );
    expect(() => validateGraphData('string')).toThrow(
      'Graph data must be a non-null object'
    );
    expect(() => validateGraphData(42)).toThrow(
      'Graph data must be a non-null object'
    );
  });

  it('throws when schema_version is missing', () => {
    const data = makeValidGraph();
    delete (data as any).schema_version;
    expect(() => validateGraphData(data)).toThrow(
      'Missing or invalid schema_version'
    );
  });

  it('throws when schema_version is unsupported', () => {
    const data = makeValidGraph();
    data.schema_version = '2.0';
    expect(() => validateGraphData(data)).toThrow(
      'Unsupported schema_version "2.0"'
    );
  });

  it('throws when meta is missing', () => {
    const data = makeValidGraph();
    delete (data as any).meta;
    expect(() => validateGraphData(data)).toThrow(
      'meta must be a non-null object'
    );
  });

  it('throws when meta is null', () => {
    const data = makeValidGraph();
    (data as any).meta = null;
    expect(() => validateGraphData(data)).toThrow(
      'meta must be a non-null object'
    );
  });

  it('throws when meta is a non-object type', () => {
    const data = makeValidGraph();
    (data as any).meta = 'not-an-object';
    expect(() => validateGraphData(data)).toThrow(
      'meta must be a non-null object'
    );
  });

  it('throws SchemaValidationError for undefined input', () => {
    expect(() => validateGraphData(undefined)).toThrow(
      'Graph data must be a non-null object'
    );
  });

  it('throws SchemaValidationError for array input', () => {
    // Arrays pass the typeof === 'object' check but fail on subsequent field checks.
    // An array like [1, 2, 3] has no string schema_version, so it fails there.
    expect(() => validateGraphData([1, 2, 3])).toThrow(
      'Missing or invalid schema_version'
    );
  });

  it('throws when nodes is not an array', () => {
    const data = makeValidGraph();
    (data as any).nodes = 'not-an-array';
    expect(() => validateGraphData(data)).toThrow('nodes must be an array');
  });

  it('throws when a node is missing id', () => {
    const data = makeValidGraph();
    delete (data.nodes[0] as any).id;
    expect(() => validateGraphData(data)).toThrow(
      'nodes[0] must have a string "id"'
    );
  });

  it('throws when a node is missing name', () => {
    const data = makeValidGraph();
    delete (data.nodes[0] as any).name;
    expect(() => validateGraphData(data)).toThrow(
      'nodes[0] must have a string "name"'
    );
  });

  it('throws when links is not an array', () => {
    const data = makeValidGraph();
    (data as any).links = 'not-an-array';
    expect(() => validateGraphData(data)).toThrow('links must be an array');
  });

  it('throws when a link is missing source', () => {
    const data = makeValidGraph();
    delete (data.links[0] as any).source;
    expect(() => validateGraphData(data)).toThrow(
      'links[0] must have a string "source"'
    );
  });

  it('throws when a link is missing target', () => {
    const data = makeValidGraph();
    delete (data.links[0] as any).target;
    expect(() => validateGraphData(data)).toThrow(
      'links[0] must have a string "target"'
    );
  });

  it('accepts data with new per-function metrics format', () => {
    const data = makeValidGraph();
    data.nodes[0].metrics = {
      loc: 240,
      cc: 12,
      mi: 65,
      max_cc: 12,
      median_cc: 4.0,
      mi_min: 42.5,
      mi_median: 68.3,
      functions: [
        { name: '_ready', line: 5, cc: 2, loc: 15, mi: 95.2 },
        { name: '_process', line: 21, cc: 12, loc: 85, mi: 42.5 },
      ],
    };
    const result = validateGraphData(data);
    expect(result.nodes[0].metrics.mi_min).toBe(42.5);
    expect(result.nodes[0].metrics.mi_median).toBe(68.3);
    expect(result.nodes[0].metrics.functions).toHaveLength(2);
    expect(result.nodes[0].metrics.functions![0].name).toBe('_ready');
  });

  it('accepts data with empty functions array and null aggregates', () => {
    const data = makeValidGraph();
    (data.nodes[0] as Record<string, unknown>).metrics = {
      loc: null,
      cc: null,
      mi: null,
      max_cc: null,
      median_cc: null,
      mi_min: null,
      mi_median: null,
      functions: [],
    };
    const result = validateGraphData(data);
    expect((result.nodes[0].metrics as any).functions).toEqual([]);
    expect((result.nodes[0].metrics as any).mi_min).toBeNull();
  });

  it('accepts data with old metrics format (no functions field)', () => {
    const data = makeValidGraph();
    // Old format: only loc, cc, mi — no functions, mi_min, mi_median
    data.nodes[0].metrics = { loc: 100, cc: 5, mi: 70 };
    const result = validateGraphData(data);
    expect(result.nodes[0].metrics.loc).toBe(100);
    expect(result.nodes[0].metrics.functions).toBeUndefined();
  });

  it('warns when metrics.functions is present but not an array', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const data = makeValidGraph();
    (data.nodes[0].metrics as any).functions = 'not-an-array';

    expect(() => validateGraphData(data)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('nodes[0].metrics.functions should be an array')
    );

    warnSpy.mockRestore();
  });

  it('warns on dangling link references but does not throw', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const data = makeValidGraph();
    data.links.push({
      source: 'res://nonexistent.gd',
      target: 'res://also-nonexistent.gd',
      kind: 'calls',
      weight: 1,
      evidence: [],
    });

    expect(() => validateGraphData(data)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('res://nonexistent.gd')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('res://also-nonexistent.gd')
    );

    warnSpy.mockRestore();
  });

  it('throws when a node is missing kind', () => {
    const data = makeValidGraph();
    delete (data.nodes[0] as any).kind;
    expect(() => validateGraphData(data)).toThrow(
      'nodes[0] must have a string "kind"'
    );
  });

  it('throws when a node is missing language', () => {
    const data = makeValidGraph();
    delete (data.nodes[0] as any).language;
    expect(() => validateGraphData(data)).toThrow(
      'nodes[0] must have a string "language"'
    );
  });

  it('throws when a node is missing metrics', () => {
    const data = makeValidGraph();
    delete (data.nodes[0] as any).metrics;
    expect(() => validateGraphData(data)).toThrow(
      'nodes[0] must have a non-null object "metrics"'
    );
  });

  it('throws when a node metrics is null', () => {
    const data = makeValidGraph();
    (data.nodes[0] as any).metrics = null;
    expect(() => validateGraphData(data)).toThrow(
      'nodes[0] must have a non-null object "metrics"'
    );
  });

  it('throws when a node is missing tags', () => {
    const data = makeValidGraph();
    delete (data.nodes[0] as any).tags;
    expect(() => validateGraphData(data)).toThrow(
      'nodes[0] must have an array "tags"'
    );
  });

  it('throws when a link is missing kind', () => {
    const data = makeValidGraph();
    delete (data.links[0] as any).kind;
    expect(() => validateGraphData(data)).toThrow(
      'links[0] must have a string "kind"'
    );
  });

  it('throws when a link is missing weight', () => {
    const data = makeValidGraph();
    delete (data.links[0] as any).weight;
    expect(() => validateGraphData(data)).toThrow(
      'links[0] must have a number "weight"'
    );
  });

  it('throws when a link is missing evidence', () => {
    const data = makeValidGraph();
    delete (data.links[0] as any).evidence;
    expect(() => validateGraphData(data)).toThrow(
      'links[0] must have an array "evidence"'
    );
  });

  it('throws when duplicate node IDs are present', () => {
    const data = makeValidGraph();
    data.nodes[1].id = data.nodes[0].id;
    expect(() => validateGraphData(data)).toThrow(
      'Duplicate node IDs detected'
    );
  });
});
