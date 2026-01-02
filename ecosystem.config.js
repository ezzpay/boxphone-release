module.exports = {
  apps: [
    {
      name: 'ezzpout',
      script: 'dist/main.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      min_uptime: 30000,
      max_restarts: 10,
      merge_logs: false, // Log vào file riêng
      max_memory_restart: '4G',
      wait_ready: true,
      kill_timeout: 20000,
      listen_timeout: 30000,
      node_args: '--enable-source-maps',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=8000',
      },
    },
  ],
};