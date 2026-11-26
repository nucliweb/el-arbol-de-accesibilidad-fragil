import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeEnvironment } from '../scripts/lib/environment.js';

const fakeOs = {
  platform: () => 'darwin',
  release: () => '27.0.0',
  arch: () => 'arm64',
  cpus: () => Array.from({ length: 10 }, () => ({ model: 'Apple M4' })),
  totalmem: () => 16 * 1024 ** 3,
  hostname: () => 'joans-macbook.local',
  userInfo: () => ({ username: 'joan', homedir: '/Users/joan' }),
  homedir: () => '/Users/joan',
};

test('describes the machine: system, CPU, memory, Node and Chrome', () => {
  const env = describeEnvironment({ os: fakeOs, nodeVersion: 'v25.3.0', chromeVersion: '158.0.8127.88' });

  assert.deepEqual(env, {
    os: 'darwin 27.0.0',
    arch: 'arm64',
    cpu: 'Apple M4',
    cpuCores: 10,
    memoryGB: 16,
    node: 'v25.3.0',
    chrome: '158.0.8127.88',
  });
});

test('never includes the host name, the user name or a home path', () => {
  const text = JSON.stringify(describeEnvironment({ os: fakeOs, nodeVersion: 'v25.3.0', chromeVersion: '158' }));

  assert.doesNotMatch(text, /joans-macbook|joan|\/Users\//);
});
