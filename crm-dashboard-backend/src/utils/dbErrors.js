export function isDbConnectionError(err) {
  return (
    err?.name === 'PrismaClientInitializationError' ||
    err?.code === 'P1000' ||
    err?.code === 'P1001' ||
    err?.message?.includes('Authentication failed') ||
    err?.message?.includes("Can't reach database server")
  );
}

export function dbConnectionErrorResponse(res) {
  return res.status(503).json({
    error:
      'Database not connected. From the project root run: npm run setup:db',
    code: 'DB_CONNECTION_FAILED',
  });
}
