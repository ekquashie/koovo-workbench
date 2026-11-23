export function extractErrorTrace(error: unknown): string {
  if (error instanceof Error) {
    const trace = error.stack ?? error.message;
    const responseData = (error as { response?: { data?: unknown } }).response
      ?.data;
    return responseData
      ? `${trace} | response: ${JSON.stringify(responseData)}`
      : trace;
  }
  return String(error);
}
