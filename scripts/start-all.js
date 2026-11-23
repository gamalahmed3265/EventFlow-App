'use strict';

const { spawn, execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const NEST_BIN = path.join(ROOT_DIR, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

const APPS = [
  { name: 'api-gateway', color: '\x1b[36m' },           // Cyan
  { name: 'auth-service', color: '\x1b[32m' },          // Green
  { name: 'events-service', color: '\x1b[33m' },        // Yellow
  { name: 'tickets-service', color: '\x1b[35m' },       // Magenta
  { name: 'notifications-service', color: '\x1b[34m' }, // Blue
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const MAX_NAME_LEN = Math.max(...APPS.map((a) => a.name.length));

const args = process.argv.slice(2);
const isBuildMode = args.includes('--build');
const isProdMode = args.includes('--prod');

function prefixLines(stream, app, target) {
  let buffer = '';
  const tag = `${app.color}${BOLD}[${app.name.padEnd(MAX_NAME_LEN)}]${RESET} `;

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`${tag}${line}\n`);
    }
  });

  stream.on('end', () => {
    if (buffer.length > 0) {
      target.write(`${tag}${buffer}\n`);
      buffer = '';
    }
  });
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
  } catch {
    // Process already exited
  }
}

async function runBuildAll() {
  console.log(`${BOLD}Building all ${APPS.length} EventFlow applications...${RESET}\n`);

  for (const app of APPS) {
    console.log(`${app.color}${BOLD}==> Building ${app.name}...${RESET}`);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [NEST_BIN, 'build', app.name], {
        cwd: ROOT_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      });

      prefixLines(child.stdout, app, process.stdout);
      prefixLines(child.stderr, app, process.stderr);

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed for ${app.name} (exit code ${code})`));
        }
      });
    });
  }

  console.log(`\n${BOLD}\x1b[32mAll ${APPS.length} applications built successfully!${RESET}`);
}

function runStartAll() {
  const modeLabel = isProdMode ? 'production' : 'development (watch)';
  console.log(`${BOLD}Starting all ${APPS.length} EventFlow applications in ${modeLabel} mode...${RESET}`);
  console.log('Press Ctrl+C to stop all services.\n');

  const children = [];
  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${BOLD}Shutting down all EventFlow services...${RESET}`);
    for (const child of children) {
      killProcessTree(child.pid);
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  for (const app of APPS) {
    const spawnArgs = isProdMode
      ? [path.join(ROOT_DIR, 'dist', 'apps', app.name, 'main.js')]
      : [NEST_BIN, 'start', app.name, '--watch'];

    const child = spawn(process.execPath, spawnArgs, {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    children.push(child);
    prefixLines(child.stdout, app, process.stdout);
    prefixLines(child.stderr, app, process.stderr);

    child.on('exit', (code) => {
      if (!shuttingDown && code !== 0) {
        console.error(
          `${app.color}${BOLD}[${app.name}]${RESET} exited with code ${code}`,
        );
      }
    });
  }
}

if (isBuildMode) {
  runBuildAll().catch((err) => {
    console.error(`\x1b[31m${err.message}${RESET}`);
    process.exit(1);
  });
} else {
  runStartAll();
}

