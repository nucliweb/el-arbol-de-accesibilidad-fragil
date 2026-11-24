// Runs the "what does the AI generate?" experiment: the same prompt, with a
// clean agent profile (no skills, memory or plugins), in one of two scenarios:
//   empty         an empty folder: the agent picks the stack
//   react-shadcn  an existing React + shadcn/ui (Radix) project from
//                 agents/starters/, without a radio-group component
//
// Usage: AGENT_LAB=/path/to/lab node agents/run.js --agent=claude|agy
//          --scenario=empty|react-shadcn --condition=baseline|mwg|mwg-agents [--reps=3]
//
// Conditions: baseline (no Modern Web Guidance), mwg (installed in the agent
// profile), mwg-agents (installed, plus the project files in
// agents/conditions/mwg-agents asking the agent to use it; react-shadcn only).
//
// AGENT_LAB must contain the signed-in clean profiles:
//   profiles/claude    (used as CLAUDE_CONFIG_DIR)
//   profiles/agy-home  (used as HOME for Antigravity)
// Generations are written to AGENT_LAB/runs/ (outside this repo, so no
// CLAUDE.md or AGENTS.md from parent folders leaks in) and then copied, without
// node_modules or build output, to agents/generations/ in this repo.

import { execFileSync, spawn } from 'node:child_process';
import { cpSync, createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const PROMPT =
  'Crea una página de ajustes con un selector de tono de llamada. Las opciones son: Calisto, Ganímedes, Luna y Europa.';

const TIMEOUT_MS = 30 * 60 * 1000;
const COPY_EXCLUDE = new Set(['node_modules', 'dist', '.next', 'build', '.git', '.vite', '.turbo']);

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);
const lab = process.env.AGENT_LAB;
const agent = args.agent;
const condition = args.condition;
const scenario = args.scenario;
const reps = Number(args.reps ?? 3);

if (!lab || !existsSync(lab)) throw new Error('Set AGENT_LAB to the lab folder with the signed-in profiles');
if (!['claude', 'agy'].includes(agent)) throw new Error('--agent must be claude or agy');
if (!['baseline', 'mwg', 'mwg-agents'].includes(condition)) throw new Error('--condition must be baseline, mwg or mwg-agents');
if (!['empty', 'react-shadcn'].includes(scenario)) throw new Error('--scenario must be empty or react-shadcn');
if (condition === 'mwg-agents' && scenario !== 'react-shadcn') throw new Error('mwg-agents only applies to react-shadcn');

const git = (dir, ...gitArgs) =>
  execFileSync('git', ['-c', 'user.name=Bench', '-c', 'user.email=bench@example.invalid', ...gitArgs], {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

// For an existing project: copies the starter into the run folder, installs
// it and commits it, so the agent's changes can be saved as a diff afterwards.
// The empty scenario stays truly empty (no git, no .gitignore hinting at npm).
const prepare = (dir) => {
  if (scenario === 'empty') return;
  const starter = resolve(import.meta.dirname, 'starters', scenario);
  cpSync(starter, dir, { recursive: true, filter: (source) => basename(source) !== 'node_modules' });
  execFileSync('npm', ['install', '--silent'], { cwd: dir, stdio: 'ignore' });
  if (condition === 'mwg-agents') {
    cpSync(resolve(import.meta.dirname, 'conditions', condition), dir, { recursive: true });
  }
  git(dir, 'init', '--quiet');
  writeFileSync(join(dir, '.gitignore'), 'node_modules\ndist\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '--quiet', '--allow-empty', '-m', 'Starting point');
};

const saveChanges = (dir, target) => {
  if (scenario === 'empty') return;
  git(dir, 'add', '-A');
  const exclude = [':(exclude)package-lock.json'];
  writeFileSync(join(target, 'changes.stat.txt'), git(dir, 'diff', '--cached', '--stat', 'HEAD', '--', '.', ...exclude));
  writeFileSync(join(target, 'changes.diff'), git(dir, 'diff', '--cached', 'HEAD', '--', '.', ...exclude));
};

const AGENTS = {
  claude: {
    env: { CLAUDE_CONFIG_DIR: join(lab, 'profiles/claude') },
    command: 'claude',
    args: ['-p', PROMPT, '--permission-mode', 'auto', '--output-format', 'json'],
    version: ['claude', ['--version']],
  },
  agy: {
    env: { HOME: join(lab, 'profiles/agy-home') },
    command: 'agy',
    // --mode auto is not available on every account; in default mode headless
    // runs auto-deny every command, so skip prompts and rely on the sandbox.
    args: ['-p', PROMPT, '--dangerously-skip-permissions', '--sandbox', '--output-format', 'json'],
    version: ['agy', ['--version']],
  },
};

const config = AGENTS[agent];
const env = { ...process.env, ...config.env };
const cliVersion = execFileSync(...config.version, { env, encoding: 'utf8' }).trim();
const generationsDir = resolve(import.meta.dirname, 'generations');

const runOnce = (dir) =>
  new Promise((done) => {
    const started = Date.now();
    const child = spawn(config.command, config.args, { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(createWriteStream(join(dir, '..', `${basename(dir)}.transcript.json`)));
    child.stderr.pipe(createWriteStream(join(dir, '..', `${basename(dir)}.stderr.log`)));
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, TIMEOUT_MS);
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      done({ exitCode, timedOut, durationMs: Date.now() - started });
    });
  });

for (let rep = 1; rep <= reps; rep += 1) {
  const name = `${agent}-${scenario}-${condition}-${rep}`;
  const dir = join(lab, 'runs', name);
  if (existsSync(dir)) throw new Error(`${dir} already exists; refusing to overwrite a generation`);
  mkdirSync(dir, { recursive: true });
  prepare(dir);

  const startedAt = new Date().toISOString();
  console.log(`${name}: running ${config.command} in ${dir}`);
  const result = await runOnce(dir);
  const meta = { agent, scenario, condition, rep, prompt: PROMPT, cliVersion, startedAt, ...result };
  writeFileSync(join(lab, 'runs', `${name}.meta.json`), `${JSON.stringify(meta, null, 2)}\n`);

  const target = join(generationsDir, name);
  cpSync(dir, join(target, 'project'), {
    recursive: true,
    filter: (source) => !COPY_EXCLUDE.has(basename(source)),
  });
  for (const suffix of ['meta.json', 'transcript.json', 'stderr.log']) {
    cpSync(join(lab, 'runs', `${name}.${suffix}`), join(target, suffix));
  }
  saveChanges(dir, target);
  console.log(`${name}: exit ${result.exitCode}${result.timedOut ? ' (timed out)' : ''} in ${Math.round(result.durationMs / 1000)} s`);
}
