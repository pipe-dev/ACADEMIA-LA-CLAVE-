const { spawn } = require('child_process');

const url = process.env.CF_URL || 'http://localhost:9005';
const command = 'npx --yes cloudflared tunnel --url ' + url;
const child = spawn(command, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

const fs = require('fs');

function transmit(chunk) {
  process.stdout.write(chunk);
  const matches = chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
  if (matches) {
    matches.forEach((m) => {
      try { fs.writeFileSync('tunnel-url.log', m, 'utf8'); } catch (e) {}
      console.log('\n=========================');
      console.log('>>> COMPARTE ESTE ENLACE: ' + m);
      console.log('=========================\n');
    });
  }
}

child.stdout.on('data', transmit);
child.stderr.on('data', transmit);
child.on('exit', (code) => process.exit(code));

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => child.kill(sig)));