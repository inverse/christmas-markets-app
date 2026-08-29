import { spawn } from 'node:child_process';
import qrcode from 'qrcode-terminal';

const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:5173']);

let qrGenerated = false;

tunnel.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output); // Keep normal output

  if (!qrGenerated) {
    // Regex to capture the trycloudflare.com URL
    const match = output.match(/https:\/\/([a-zA-Z0-9-]+\.trycloudflare\.com)/);
    if (match) {
      const url = match[0];
      console.log('\n\n--- QR Code for Tunnel URL ---');
      console.log(`URL: ${url}`);
      qrcode.generate(url, { small: true });
      console.log('-------------------------------\n');
      qrGenerated = true;
    }
  }
});

tunnel.stdout.on('data', (data) => {
  process.stdout.write(data);
});

tunnel.on('close', (code) => {
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  tunnel.kill('SIGINT');
});
process.on('SIGTERM', () => {
  tunnel.kill('SIGTERM');
});
