module.exports = {
  apps: [
    {
      name: "bank-nagari-qris",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      time: true, // prefix waktu di log
      env: { NODE_ENV: "production" },
    },
  ],
};
