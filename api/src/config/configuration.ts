/** Typed config. Read with ConfigService.get('path.to.key'). */
export default () => ({
  /** Shown in API docs. */
  appName: process.env.APP_NAME ?? 'Koovo Review Workbench',
  port: parseInt(process.env.PORT ?? '', 10) || 4000,
  /** React review UI: CORS. */
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  /** Load src/data/seed-transactions.json at startup. Off in integration tests. */
  seedOnStartup: process.env.SEED_ON_STARTUP !== 'false',
});
