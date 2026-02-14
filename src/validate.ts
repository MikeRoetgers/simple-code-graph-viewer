import type { GraphData } from './types.js';

const SUPPORTED_VERSIONS = ['1.0'];

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export function validateGraphData(data: unknown): GraphData {
  if (typeof data !== 'object' || data === null) {
    throw new SchemaValidationError('Graph data must be a non-null object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.schema_version !== 'string') {
    throw new SchemaValidationError('Missing or invalid schema_version');
  }
  if (!SUPPORTED_VERSIONS.includes(obj.schema_version)) {
    throw new SchemaValidationError(
      `Unsupported schema_version "${obj.schema_version}". Supported: ${SUPPORTED_VERSIONS.join(', ')}`
    );
  }

  if (typeof obj.meta !== 'object' || obj.meta === null) {
    throw new SchemaValidationError('meta must be a non-null object');
  }

  if (!Array.isArray(obj.nodes)) {
    throw new SchemaValidationError('nodes must be an array');
  }
  for (let i = 0; i < obj.nodes.length; i++) {
    const node = obj.nodes[i] as Record<string, unknown>;
    if (typeof node.id !== 'string') {
      throw new SchemaValidationError(`nodes[${i}] must have a string "id"`);
    }
    if (typeof node.name !== 'string') {
      throw new SchemaValidationError(`nodes[${i}] must have a string "name"`);
    }
    if (typeof node.kind !== 'string') {
      throw new SchemaValidationError(`nodes[${i}] must have a string "kind"`);
    }
    if (typeof node.language !== 'string') {
      throw new SchemaValidationError(`nodes[${i}] must have a string "language"`);
    }
    if (typeof node.metrics !== 'object' || node.metrics === null) {
      throw new SchemaValidationError(`nodes[${i}] must have a non-null object "metrics"`);
    }
    if (!Array.isArray(node.tags)) {
      throw new SchemaValidationError(`nodes[${i}] must have an array "tags"`);
    }
    // Warn if metrics.functions is present but not an array
    if (node.metrics != null && typeof node.metrics === 'object') {
      const metrics = node.metrics as Record<string, unknown>;
      if ('functions' in metrics && !Array.isArray(metrics.functions)) {
        console.warn(
          `Warning: nodes[${i}].metrics.functions should be an array`
        );
      }
    }
  }

  if (!Array.isArray(obj.links)) {
    throw new SchemaValidationError('links must be an array');
  }
  for (let i = 0; i < obj.links.length; i++) {
    const link = obj.links[i] as Record<string, unknown>;
    if (typeof link.source !== 'string') {
      throw new SchemaValidationError(`links[${i}] must have a string "source"`);
    }
    if (typeof link.target !== 'string') {
      throw new SchemaValidationError(`links[${i}] must have a string "target"`);
    }
    if (typeof link.kind !== 'string') {
      throw new SchemaValidationError(`links[${i}] must have a string "kind"`);
    }
    if (typeof link.weight !== 'number') {
      throw new SchemaValidationError(`links[${i}] must have a number "weight"`);
    }
    if (!Array.isArray(link.evidence)) {
      throw new SchemaValidationError(`links[${i}] must have an array "evidence"`);
    }
  }

  const nodeIds = new Set(
    (obj.nodes as Array<Record<string, unknown>>).map((n) => n.id as string)
  );
  if (nodeIds.size !== (obj.nodes as unknown[]).length) {
    throw new SchemaValidationError('Duplicate node IDs detected');
  }
  for (const link of obj.links as Array<Record<string, unknown>>) {
    if (!nodeIds.has(link.source as string)) {
      console.warn(
        `Warning: link source "${link.source}" does not match any node id`
      );
    }
    if (!nodeIds.has(link.target as string)) {
      console.warn(
        `Warning: link target "${link.target}" does not match any node id`
      );
    }
  }

  return data as GraphData;
}
