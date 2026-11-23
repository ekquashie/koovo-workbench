// Integration tests boot the whole app in-process; no external services.
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';
