# Data Schema Reference (v1.0)

This document describes the JSON data format consumed by `simple-code-graph-viewer`. Any tool that produces a JSON file conforming to this schema can be visualized by the viewer.

## Overview

The schema represents a directed graph of code artifacts (files, scenes, resources) and the relationships between them (inheritance, calls, signals, etc.), enriched with code-quality metrics at both the file and function level.

```
GraphData
├── schema_version   (string)
├── meta             (object)
├── nodes[]          (array of GraphNode)
│   ├── id, kind, language, name, tags
│   └── metrics
│       ├── loc, max_cc, median_cc, mi, mi_min, mi_median
│       └── functions[]              (per-function breakdown)
└── links[]          (array of GraphLink)
    ├── source, target, kind, weight
    └── evidence[]
```

## Top-Level Structure

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | `string` | **Yes** | Must be `"1.0"`. The viewer rejects unknown versions. |
| `meta` | `object` | **Yes** | Metadata about the analysis run. |
| `nodes` | `GraphNode[]` | **Yes** | Array of code artifacts (files, scenes, resources). |
| `links` | `GraphLink[]` | **Yes** | Array of directed edges between nodes. |

### Minimal Valid Document

```json
{
  "schema_version": "1.0",
  "meta": { "repo": "my-project", "generated_at": "2026-01-15T12:00:00Z" },
  "nodes": [],
  "links": []
}
```

## `meta` — Analysis Metadata

Describes when and where the analysis was produced.

| Field | Type | Required | Description |
|---|---|---|---|
| `repo` | `string` | **Yes** | Repository or project name. |
| `generated_at` | `string` | **Yes** | ISO 8601 timestamp of when the data was generated. |
| *additional keys* | `unknown` | No | The `meta` object is extensible — any additional fields are preserved but not used by the viewer. |

**Example:**

```json
{
  "repo": "my-game",
  "generated_at": "2026-02-13T10:00:00Z",
  "analyzer_version": "0.5.0",
  "commit_sha": "abc123"
}
```

## `nodes[]` — Graph Nodes

Each node represents a single code artifact (source file, scene file, resource, etc.).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | Globally unique identifier. Typically a file path (e.g., `"res://src/player.gd"`). Referenced by `links[].source` and `links[].target`. |
| `kind` | `string` | **Yes** | Category of the artifact. Determines the node's **fill color** in the visualization (ordinal color scale). Common values: `"script"`, `"scene"`, `"resource"`. |
| `language` | `string` | **Yes** | Programming language or file type (e.g., `"gdscript"`, `"csharp"`). |
| `name` | `string` | **Yes** | Human-readable display name shown as the node label in the graph. Used by the search control for case-insensitive substring matching. |
| `metrics` | `NodeMetrics` | **Yes** | Code quality metrics for this artifact. See [Node Metrics](#nodemetrics--code-quality-metrics) below. |
| `tags` | `string[]` | **Yes** | Arbitrary tags for categorization (e.g., `["entry-point", "autoload"]`, `["ui"]`, `["character"]`). |

### Visual Mapping

| Field | Visual Property |
|---|---|
| `kind` | Circle fill color (D3 ordinal scale, Tableau10 palette) |
| `name` | `<text>` label next to the node |
| `metrics.loc` | Circle radius via `d3.scaleSqrt` (domain 0–2000, range 4–20 px, clamped). Nodes with `loc: null` get a default radius of 6 px. |

## `NodeMetrics` — Code Quality Metrics

Metrics are split into three tiers: file-level scalars, function-level aggregates, and per-function breakdowns.

### File-Level Metrics

| Field | Type | Required | Description |
|---|---|---|---|
| `loc` | `number \| null` | **Yes** | Lines of code (non-empty, non-comment). Drives the node's circle radius. `null` for non-code artifacts (scenes, resources). |
| `mi` | `number \| null` | **Yes** | File-level Maintainability Index (0–171 scale, higher is better). Combines LOC, complexity, and Halstead volume. `null` when the file cannot be analyzed. |

### Function-Level Aggregates

These fields summarize per-function metrics across the entire file.

| Field | Type | Required | Description |
|---|---|---|---|
| `max_cc` | `number \| null` | **Yes** | Maximum cyclomatic complexity among all functions. Identifies the most complex function (the "hotspot"). `null` when the file cannot be parsed or is not source code. |
| `median_cc` | `number \| null` | **Yes** | Median cyclomatic complexity across all functions. Represents typical function complexity. `null` when the file cannot be parsed or is not source code. |
| `mi_min` | `number \| null` | **Yes** | Lowest per-function Maintainability Index. Pinpoints the least maintainable function. `null` when no functions have a computable MI. |
| `mi_median` | `number \| null` | **Yes** | Median per-function Maintainability Index. Represents typical function maintainability. `null` when no functions have a computable MI. |

### Per-Function Breakdown (Optional)

| Field | Type | Required | Description |
|---|---|---|---|
| `functions` | `FunctionMetrics[]` | No | Array of per-function metric objects. Empty array for files with no functions. May be omitted by simpler analyzers. |

Each `FunctionMetrics` object:

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | Function/method name. |
| `line` | `number` | **Yes** | Line number where the function is defined (1-based). |
| `cc` | `number` | **Yes** | Cyclomatic complexity of this function. |
| `loc` | `number` | **Yes** | Lines of code in this function. |
| `mi` | `number \| null` | **Yes** | Maintainability Index for this function. `null` if it cannot be computed (e.g., zero Halstead volume). |

### Metrics Examples

**Full metrics (script with functions):**

```json
{
  "loc": 240,
  "max_cc": 12,
  "median_cc": 4.0,
  "mi": 65,
  "mi_min": 42.5,
  "mi_median": 68.3,
  "functions": [
    { "name": "_ready", "line": 5, "cc": 2, "loc": 15, "mi": 95.2 },
    { "name": "_process", "line": 21, "cc": 12, "loc": 85, "mi": 42.5 },
    { "name": "spawn_enemies", "line": 107, "cc": 6, "loc": 45, "mi": 68.3 }
  ]
}
```

**Minimal metrics (no per-function data):**

```json
{
  "loc": 95,
  "max_cc": 5,
  "median_cc": 3.0,
  "mi": 80,
  "mi_min": null,
  "mi_median": null
}
```

**Non-code artifact (scene or resource):**

```json
{
  "loc": null,
  "max_cc": null,
  "median_cc": null,
  "mi": null,
  "mi_min": null,
  "mi_median": null
}
```

### Interpreting Metric Values

| Metric | Better Direction | Scale | Good | Moderate | Concerning | Bad |
|---|---|---|---|---|---|---|
| `loc` | Lower | 0–∞ | 1–100 | 100–300 | 300–500 | 500+ |
| `max_cc` | Lower | 1–∞ | 1–5 | 6–10 | 11–20 | 21+ |
| `median_cc` | Lower | 1.0–∞ | 1–5 | 6–10 | 11–20 | 21+ |
| `mi` | Higher | 0–171 | 120–171 | 85–119 | 65–84 | 0–64 |
| `mi_min` | Higher | 0–171 | 120–171 | 85–119 | 65–84 | 0–64 |
| `mi_median` | Higher | 0–171 | 120–171 | 85–119 | 65–84 | 0–64 |

### Null Handling

Metrics fields use `null` to indicate "not applicable" or "not computable":

- **`loc: null`** — The artifact is not source code (e.g., a scene or resource file).
- **`max_cc: null` / `median_cc: null`** — The file could not be parsed, or is not source code.
- **`mi: null`** — The file could not be analyzed, has 0 LOC, or has 0 Halstead volume.
- **`mi_min: null` / `mi_median: null`** — No functions in the file have a computable MI.

The viewer handles `null` gracefully: nodes with `loc: null` render at a default size, and `null` metric values are excluded from tooltips and summaries.

## `links[]` — Graph Edges

Each link represents a directed dependency from one node to another.

| Field | Type | Required | Description |
|---|---|---|---|
| `source` | `string` | **Yes** | `id` of the originating node. Must match a value in `nodes[].id` (a warning is logged if not, but rendering proceeds). |
| `target` | `string` | **Yes** | `id` of the destination node. Same referential integrity rules as `source`. |
| `kind` | `string` | **Yes** | Type of relationship. Determines the edge's **stroke color** (ordinal color scale, Set2 palette). Used by the filter panel to show/hide edge categories. Common values: `"extends"`, `"preloads"`, `"calls"`, `"signals"`. |
| `weight` | `number` | **Yes** | Numeric strength of the relationship. Determines the edge's **stroke width**. Typically equals the number of evidence entries. |
| `evidence` | `Evidence[]` | **Yes** | Array of source locations proving this dependency exists. |

### Visual Mapping

| Field | Visual Property |
|---|---|
| `kind` | Line stroke color (D3 ordinal scale, Set2 palette). Each unique `kind` gets its own color. A filter panel checkbox controls visibility per kind. |
| `weight` | Line stroke width. Higher weight = thicker line. |

### `Evidence` — Source Location

Each evidence entry pinpoints a specific location in the source code where the dependency was detected.

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | `string` | **Yes** | Relative file path where the reference occurs. |
| `line` | `number` | **Yes** | Line number (1-based) of the reference. |

Evidence is displayed in the evidence sidebar when a user clicks on an edge.

**Example:**

```json
{
  "source": "res://src/main.gd",
  "target": "res://src/enemies/enemy_base.gd",
  "kind": "calls",
  "weight": 5,
  "evidence": [
    { "file": "src/main.gd", "line": 45 },
    { "file": "src/main.gd", "line": 78 },
    { "file": "src/main.gd", "line": 102 }
  ]
}
```

### Common Link Kinds

These are typical `kind` values, though the schema places no restriction on what strings are used:

| Kind | Meaning |
|---|---|
| `"extends"` | Class inheritance — source extends target. |
| `"preloads"` | Static resource loading — source preloads/loads target. |
| `"calls"` | Function call — source calls functions defined in target. |
| `"signals"` | Signal connection — source emits a signal consumed by target. |

## Validation Rules

The viewer validates data at runtime via `validateGraphData()`. The following rules are enforced:

### Errors (Throws `SchemaValidationError`)

| Rule | Error Message |
|---|---|
| Data is not a non-null object | `"Graph data must be a non-null object"` |
| `schema_version` missing or not a string | `"Missing or invalid schema_version"` |
| `schema_version` not in `["1.0"]` | `"Unsupported schema_version \"X\". Supported: 1.0"` |
| `meta` missing or not a non-null object | `"meta must be a non-null object"` |
| `nodes` is not an array | `"nodes must be an array"` |
| Any node missing string `id` | `"nodes[i] must have a string \"id\""` |
| Any node missing string `name` | `"nodes[i] must have a string \"name\""` |
| `links` is not an array | `"links must be an array"` |
| Any link missing string `source` | `"links[i] must have a string \"source\""` |
| Any link missing string `target` | `"links[i] must have a string \"target\""` |

### Warnings (Logged to Console)

| Rule | Warning Message |
|---|---|
| `metrics.functions` is present but not an array | `"Warning: nodes[i].metrics.functions should be an array"` |
| Link `source` doesn't match any node `id` | `"Warning: link source \"X\" does not match any node id"` |
| Link `target` doesn't match any node `id` | `"Warning: link target \"X\" does not match any node id"` |

Dangling link references (pointing to non-existent node IDs) produce warnings, not errors — the graph will still render with the valid portion of the data.

## Full Example

```json
{
  "schema_version": "1.0",
  "meta": {
    "repo": "my-game",
    "generated_at": "2026-02-13T10:00:00Z"
  },
  "nodes": [
    {
      "id": "res://src/main.gd",
      "kind": "script",
      "language": "gdscript",
      "name": "Main",
      "metrics": {
        "loc": 240,
        "max_cc": 12,
        "median_cc": 4.0,
        "mi": 65,
        "mi_min": 42.5,
        "mi_median": 68.3,
        "functions": [
          { "name": "_ready", "line": 5, "cc": 2, "loc": 15, "mi": 95.2 },
          { "name": "_process", "line": 21, "cc": 12, "loc": 85, "mi": 42.5 }
        ]
      },
      "tags": ["entry-point", "autoload"]
    },
    {
      "id": "res://src/player/player.tscn",
      "kind": "scene",
      "language": "gdscript",
      "name": "PlayerScene",
      "metrics": {
        "loc": null,
        "max_cc": null,
        "median_cc": null,
        "mi": null,
        "mi_min": null,
        "mi_median": null
      },
      "tags": ["scene"]
    }
  ],
  "links": [
    {
      "source": "res://src/main.gd",
      "target": "res://src/player/player.tscn",
      "kind": "preloads",
      "weight": 2,
      "evidence": [
        { "file": "src/main.gd", "line": 3 },
        { "file": "src/main.gd", "line": 12 }
      ]
    }
  ]
}
```

## TypeScript Interfaces

For consumers using TypeScript, the library exports the following interfaces from `simple-code-graph-viewer`:

```ts
interface GraphData {
  schema_version: string;
  meta: GraphMeta;
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphMeta {
  repo: string;
  generated_at: string;
  [key: string]: unknown;
}

interface GraphNode {
  id: string;
  kind: string;
  language: string;
  name: string;
  metrics: NodeMetrics;
  tags: string[];
}

interface NodeMetrics {
  loc: number | null;
  max_cc: number | null;
  median_cc: number | null;
  mi: number | null;
  mi_min: number | null;
  mi_median: number | null;
  functions?: FunctionMetrics[];
}

interface FunctionMetrics {
  name: string;
  line: number;
  cc: number;
  loc: number;
  mi: number | null;
}

interface GraphLink {
  source: string;
  target: string;
  kind: string;
  weight: number;
  evidence: Evidence[];
}

interface Evidence {
  file: string;
  line: number;
}
```

Import them as type-only:

```ts
import type { GraphData, GraphNode, GraphLink, NodeMetrics, FunctionMetrics, Evidence } from 'simple-code-graph-viewer';
```
