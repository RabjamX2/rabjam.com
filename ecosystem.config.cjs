module.exports = {
  apps: [
    {
      name: "portfolio-client",
      cwd: "./client",
      script: "build/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "127.0.0.1",
      },
    },
  ],
};
