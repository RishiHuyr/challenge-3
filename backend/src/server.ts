import app from './app';
import { config } from './config';

const server = app.listen(config.PORT, () => {
  console.log(`=========================================`);
  console.log(`  EcoTrack Pro Server is running!        `);
  console.log(`  Port: ${config.PORT}                   `);
  console.log(`  Environment: ${config.ENV}             `);
  console.log(`=========================================`);
});

// Handle uncaught exceptions and rejections safely
process.on('unhandledRejection', (err: Error) => {
  console.error(`[Unhandled Rejection] Shutting down...`);
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err: Error) => {
  console.error(`[Uncaught Exception] Shutting down...`);
  console.error(err.name, err.message);
  process.exit(1);
});
