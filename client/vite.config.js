import { execFile } from 'node:child_process';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const serverDir = path.join(import.meta.dirname, '../server');
const contentFile = path.join(serverDir, 'db/content.json');

// Dev only: saving content.json loads it into Postgres, then refreshes the browser.
function reseedOnSave() {
  return {
    name: 'reseed-on-save',
    apply: 'serve',
    configureServer(server) {
      let timer;
      const onSave = (file) => {
        if (path.resolve(file) !== contentFile) return;

        // Editors can write a file more than once per save.
        clearTimeout(timer);
        timer = setTimeout(() => {
          execFile(
            process.execPath,
            ['--env-file-if-exists=../.env', 'db/seed.js'],
            { cwd: serverDir },
            (err, stdout, stderr) => {
              if (err) {
                server.config.logger.error(`content.json not loaded:\n${stderr || err.message}`);
                return;
              }
              server.config.logger.info('content.json loaded');
              server.ws.send({ type: 'full-reload' });
            },
          );
        }, 200);
      };

      // Docker sync replaces the file, so watch its folder and treat a new file as a save.
      server.watcher.add(path.dirname(contentFile));
      server.watcher.on('change', onSave);
      server.watcher.on('add', onSave);
    },
  };
}

export default defineConfig({
  plugins: [react(), reseedOnSave()],
  server: {
    host: true,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
