export interface GraphData {
  schema_version: string;
  meta: GraphMeta;
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphMeta {
  repo: string;
  generated_at: string;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  kind: string;
  language: string;
  name: string;
  metrics: NodeMetrics;
  tags: string[];
}

export interface FunctionMetrics {
  name: string;
  line: number;
  cc: number;
  loc: number;
  mi: number | null;
}

export interface NodeMetrics {
  loc: number | null;
  cc: number | null;
  mi: number | null;
  mi_min?: number | null;
  mi_median?: number | null;
  max_cc?: number | null;
  median_cc?: number | null;
  functions?: FunctionMetrics[];
}

export interface GraphLink {
  source: string;
  target: string;
  kind: string;
  weight: number;
  evidence: Evidence[];
}

export interface Evidence {
  file: string;
  line: number;
}

export interface RenderOptions {
  width?: number;
  height?: number;
}

export interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface SimLink {
  source: SimNode;
  target: SimNode;
  kind: string;
  weight: number;
  evidence: Evidence[];
}
