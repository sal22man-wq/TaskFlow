module.exports = {
  apps: [{
    name: 'taskflow',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      WHATSAPP_SIMULATION: 'false'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      WHATSAPP_SIMULATION: 'false'
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // Health monitoring
    health_check_url: 'http://localhost:5000/health',
    health_check_grace_period: 10000
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/taskflow.git',
      path: '/var/www/taskflow',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};