// Integration tests boot the whole app in-process; no external services.
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
// Each test imports exactly the data it needs.
process.env.SEED_ON_STARTUP = 'false';
