import { app } from "./app.js";
import { closeServices, initializeServices } from "./config/initializeServices.js";
import { env } from "./config/env.js";

const PORT = env.PORT || 3000;

try {
  await initializeServices();
  const server = app.listen(PORT, () => {
    console.log('Welcome to swiftstash server');
    console.log(`Successfully running on http://localhost:${PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; closing HTTP server`);

    server.close((serverError) => {
      if (serverError) {
        console.error('Error closing HTTP server:', serverError);
        process.exitCode = 1;
      }

      void closeServices().catch((error: unknown) => {
        console.error('Error closing database connections:', error);
        process.exitCode = 1;
      });
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (error) {
  console.error('Failed to initialize server:', error);
  try {
    await closeServices();
  } catch (shutdownError) {
    console.error('Error cleaning up after startup failure:', shutdownError);
  }
  process.exitCode = 1;
}
