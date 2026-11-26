// What a participant's results say about their machine: enough to compare
// devices, nothing that identifies the person (no host name, user name or
// paths). Takes the os module as an argument so it can be tested.
import os from 'node:os';

export function describeEnvironment({ os: system = os, nodeVersion = process.version, chromeVersion }) {
  const cpus = system.cpus();
  return {
    os: `${system.platform()} ${system.release()}`,
    arch: system.arch(),
    cpu: cpus[0]?.model?.trim() ?? 'unknown',
    cpuCores: cpus.length,
    memoryGB: Math.round(system.totalmem() / 1024 ** 3),
    node: nodeVersion,
    chrome: chromeVersion,
  };
}
