/**
 * PM2 process config (PRD §10.2).
 *
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save && pm2 startup    # auto-start after VPS reboot
 *
 * App settings (port, auth, limits) live in .env — this file only
 * controls how PM2 runs the process.
 */
module.exports = {
  apps: [
    {
      name: 'handwriting-folio',
      script: 'src/server.js',
      cwd: __dirname,

      // Rendering is synchronous and CPU-bound; one process is plenty for
      // a handful of users on a 1-2 vCPU VPS.
      instances: 1,
      exec_mode: 'fork',

      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
      // Canvas buffers can pile up on long texts; restart if memory leaks.
      max_memory_restart: '400M',

      time: true, // timestamp log lines
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      merge_logs: true,

      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
