module.exports = {
  apps: [
    {
      name: "erp-backend",
      script: "apps/backend/dist/main.js",
      cwd: "/var/www/erp",
      instances: 1,
      env_file: "apps/backend/.env",
      env: { NODE_ENV: "production", PORT: 3000 },
    },
    {
      name: "erp-frontend",
      script: "node_modules/.bin/next",
      args: "start -p 5000",
      cwd: "/var/www/erp/apps/frontend",
      instances: 1,
      env: { NODE_ENV: "production", PORT: 5000, BACKEND_URL: "http://127.0.0.1:3000" },
    },
  ],
};
