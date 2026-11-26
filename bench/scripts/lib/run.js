// Runs a command, shows its output as it goes and returns it as text.
import { spawn } from 'node:child_process';

export function run(command, args, { cwd, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: process.platform === 'win32' });
    let output = '';
    const collect = (stream, target) =>
      stream.on('data', (chunk) => {
        output += chunk;
        if (!quiet) target.write(chunk);
      });
    collect(child.stdout, process.stdout);
    collect(child.stderr, process.stderr);
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(output) : reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`)),
    );
  });
}

export const runNode = (script, args = [], options) => run(process.execPath, [script, ...args], options);
