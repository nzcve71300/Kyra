module.exports = {
  apps: [
    {
      name: 'kyra-bot',
      script: 'src/bot/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      cwd: '/opt/kyra-bot',
      env: {
        NODE_ENV: 'production',
        PORT: 8081
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8081
      },
      error_file: '/opt/kyra-bot/logs/err.log',
      out_file: '/opt/kyra-bot/logs/out.log',
      log_file: '/opt/kyra-bot/logs/combined.log',
      time: true
    }
    // Add your other bot here if you want to manage it from this file
    // {
    //   name: 'your-other-bot',
    //   script: 'path/to/your/other/bot.js',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '1G',
    //   cwd: '/path/to/your/other/bot',
    //   env: {
    //     NODE_ENV: 'production'
    //   },
    //   error_file: '/path/to/your/other/bot/logs/err.log',
    //   out_file: '/path/to/your/other/bot/logs/out.log',
    //   log_file: '/path/to/your/other/bot/logs/combined.log',
    //   time: true
    // }
  ]
};
