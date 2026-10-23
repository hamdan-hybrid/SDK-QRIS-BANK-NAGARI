const { findNode22 } = require("./node22");

module.exports = {
  apps: [
    {
      name: "bank-nagari-qris",
      script: "index.js",
      // wajib Node 22, dicari otomatis (QRIS_NODE, nvm, fnm, n, node sistem)
      interpreter: findNode22() || "node",
      cwd: __dirname,
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
