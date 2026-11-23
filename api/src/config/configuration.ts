/** Typed config. Read with ConfigService.get('path.to.key'). */
export default () => ({
  /** Shown in API docs. */
  appName: process.env.APP_NAME ?? 'Koovo Review Workbench',
  port: parseInt(process.env.PORT ?? '', 10) || 4000,
  /** React review UI: CORS. */
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
});
