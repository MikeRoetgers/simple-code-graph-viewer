#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: simple-code-graph-viewer <path-to-graph.json>');
  process.exit(1);
}

const jsonPath = resolve(args[0]);

let graphJson;
try {
  const raw = readFileSync(jsonPath, 'utf-8');
  graphJson = JSON.parse(raw);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error reading ${jsonPath}: ${msg}`);
  process.exit(1);
}

const graphPayload = JSON.stringify(graphJson);

const distDir = fileURLToPath(new URL('../dist/standalone/', import.meta.url));
const serve = sirv(distDir, { single: true });

const server = createServer((req, res) => {
  if (req.url === '/__graph_data__.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(graphPayload);
    return;
  }
  serve(req, res);
});

function listen(port) {
  return new Promise((resolve, reject) => {
    server.once('error', (err) => {
      reject(err);
    });
    server.listen(port, () => resolve(port));
  });
}

const DEFAULT_PORT = 3000;
const MAX_TRIES = 20;

let port = DEFAULT_PORT;
for (let i = 0; i < MAX_TRIES; i++) {
  try {
    await listen(port);
    break;
  } catch {
    port++;
    if (i === MAX_TRIES - 1) {
      console.error(`Could not find an available port after ${MAX_TRIES} attempts.`);
      process.exit(1);
    }
  }
}

const url = `http://localhost:${port}`;
console.log(`Serving simple-code-graph-viewer at ${url}`);

try {
  const open = await import('open');
  await open.default(url);
} catch {
  // If open fails, just continue — user can open the URL manually
}
