import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const isTsx = process.execArgv.some(arg => arg.includes('tsx') || arg.includes('loader.mjs'));

if (!isTsx) {
  // Started with pure `node server.ts` (e.g. in Cloud Run / npm start)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverMain = path.join(__dirname, 'server-main.ts');

  const child = spawn(process.execPath, ['--max-old-space-size=8192', '--import', 'tsx', serverMain], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  const forwardSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  forwardSignals.forEach(sig => {
    process.on(sig, () => {
      try {
        child.kill(sig);
      } catch {}
    });
  });
} else {
  // Started with `tsx server.ts` or already bootstrapped
  await import('./server-main');
}
