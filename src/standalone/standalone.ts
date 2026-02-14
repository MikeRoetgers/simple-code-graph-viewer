import { validateGraphData } from '../validate.js';
import { renderGraph } from '../renderer/force-graph.js';

async function fetchGraphData(): Promise<unknown> {
  // Try the CLI-served endpoint first
  const cliResponse = await fetch('/__graph_data__.json');
  if (cliResponse.ok) {
    return cliResponse.json();
  }

  // Fall back to dev mode fixture
  const devResponse = await fetch('/sample-graph.json');
  if (!devResponse.ok) {
    throw new Error(`Failed to fetch graph data: ${devResponse.status} ${devResponse.statusText}`);
  }
  return devResponse.json();
}

async function main(): Promise<void> {
  const json = await fetchGraphData();
  const data = validateGraphData(json);

  const container = document.getElementById('app');
  if (!container) throw new Error('Missing #app container');

  renderGraph(container, data, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

main().catch((err: unknown) => {
  const app = document.getElementById('app');
  if (app) {
    const msg = document.createElement('pre');
    msg.style.cssText = 'color:#c00;font-family:system-ui,sans-serif;padding:2rem;margin:0;white-space:pre-wrap;word-break:break-word;';
    msg.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
    app.textContent = '';
    app.appendChild(msg);
  }
  console.error(err);
});
