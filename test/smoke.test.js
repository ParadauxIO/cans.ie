import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';

// Exercise the real Express server and rendered/static assets without production credentials.
test('serves a rendered can, its image, metrics and a real 404', { timeout: 15000 }, async () => {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const child = spawn(process.execPath, ['index.js'], {
    env: { PATH: process.env.PATH, PORT: String(port), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  try {
    const base = `http://127.0.0.1:${port}`;
    let response;
    for (let attempt = 0; attempt < 50; attempt++) {
      assert.equal(child.exitCode, null, output);
      try {
        response = await fetch(base, { signal: AbortSignal.timeout(1000) });
        break;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    assert.ok(response, `server did not start: ${output}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<title>cans<\/title>/);
    const image = html.match(/src="(cans\/[a-z]+\.webp)"/);
    assert.ok(image, 'template must render a real can image, not EJS source');
    const asset = await fetch(`${base}/${image[1]}`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /image\/webp/);
    assert.ok((await asset.arrayBuffer()).byteLength > 100);
    const metrics = await fetch(`${base}/metrics`);
    assert.equal(metrics.status, 200);
    assert.match(await metrics.text(), /process_cpu_user_seconds_total/);
    assert.equal((await fetch(`${base}/nonexistent-smoke-route`)).status, 404);
  } finally {
    child.kill('SIGTERM');
    await exited;
  }
});
