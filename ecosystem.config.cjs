module.exports = {
  apps: [
    {
      name: "food-scheduler",
      script: "./scripts/service-scheduler.js",
      interpreter: "node",
      interpreter_args: "--es-module-specifier-resolution=node", // Essential for ES Modules
      restart_delay: 5000,
      env: { NODE_ENV: "production" }
    },
    {
      name: "worker-willys",
      script: "./scripts/service-worker.js",
      args: "willys",
      interpreter: "node",
      interpreter_args: "--es-module-specifier-resolution=node",
      restart_delay: 5000,
      env: { NODE_ENV: "production" }
    },
    {
      name: "worker-ica",
      script: "./scripts/service-worker.js",
      args: "ica",
      interpreter: "node",
      interpreter_args: "--es-module-specifier-resolution=node",
      restart_delay: 5000,
      env: { NODE_ENV: "production" }
    }
  ]
};