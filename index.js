// FormaTeX Compile Action
// Zero-dependency Node.js 20 script — no npm install or build step required.
// Uses only Node.js built-in modules and the native fetch API (Node 18+).

'use strict';

const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.formatex.io/api/v1/compile';

// ── GitHub Actions helpers (no @actions/core dependency) ──────────────────────

function getInput(name) {
  const key = `INPUT_${name.toUpperCase().replace(/-/g, '_')}`;
  return (process.env[key] || '').trim();
}

function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  }
}

function info(msg)  { console.log(msg); }
function notice(msg) { console.log(`::notice::${msg}`); }
function fail(msg)  { console.error(`::error::${msg}`); process.exit(1); }

// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const apiKey  = getInput('api-key');
  const file    = getInput('file')    || 'main.tex';
  const engine  = getInput('engine')  || 'pdflatex';
  const output  = getInput('output')  || 'output.pdf';
  const runsRaw = getInput('runs');
  const toRaw   = getInput('timeout');

  if (!apiKey) fail('api-key input is required');

  if (!fs.existsSync(file)) fail(`File not found: ${file}`);

  const latex = fs.readFileSync(file, 'utf-8');
  info(`Compiling ${file} (${latex.length.toLocaleString()} chars) with engine=${engine}`);

  // Build request payload
  const body = { latex, engine };
  if (runsRaw)         body.runs    = parseInt(runsRaw, 10);
  if (toRaw)           body.timeout = parseInt(toRaw,   10);

  // ── Call FormaTeX API ──────────────────────────────────────────────────────
  let response;
  try {
    response = await fetch(API_URL, {
      method:  'POST',
      headers: {
        'X-API-Key':    apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    fail(`Network error: ${err.message}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isPDF = contentType.includes('application/pdf');

  if (!response.ok || !isPDF) {
    // Error response is always JSON
    let msg = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      msg = json.error || msg;
      if (json.log) {
        console.error('\n─── Compilation log ───────────────────────────────────');
        console.error(json.log.trim());
        console.error('───────────────────────────────────────────────────────\n');
      }
      if (Array.isArray(json.suggestions) && json.suggestions.length > 0) {
        console.error('Suggestions:');
        for (const s of json.suggestions) console.error(`  • ${s}`);
      }
    } catch {
      // non-JSON body — swallow
    }
    fail(`Compilation failed: ${msg}`);
  }

  // ── Save PDF ───────────────────────────────────────────────────────────────
  const pdfData = Buffer.from(await response.arrayBuffer());

  const outputDir = path.dirname(path.resolve(output));
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(output, pdfData);

  const kb = (pdfData.length / 1024).toFixed(1);
  notice(`PDF compiled successfully — ${output} (${kb} KB)`);
  setOutput('pdf-path', output);
}

run().catch(err => fail(err.message));
