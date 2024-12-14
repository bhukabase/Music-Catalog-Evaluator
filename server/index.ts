/**
 * Main server application entry point
 * @module server/index
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

/**
 * Express application instance
 * Configures middleware and initializes server
 */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * Request logging middleware
 * Captures and logs API request details including response time and payload
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Intercept json responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log request details on completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// IIFE to allow async/await
(async () => {
  const server = registerRoutes(app);

  /**
   * Global error handling middleware
   * Catches and formats all uncaught errors
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup development or production server
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /**
   * Attempts to start server on specified port
   * Falls back to next available port if occupied
   * @param {number} port - Port number to attempt
   * @returns {Promise<number>} Successfully bound port
   */
  const tryPort = (port: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
      
      server.once('listening', () => {
        resolve(port);
      });
      
      server.listen(port, "0.0.0.0");
    });
  };

  // Initialize server
  tryPort(5000)
    .then(port => {
      log(`Server running on port ${port}`);
    })
    .catch(err => {
      log(`Failed to start server: ${err.message}`);
      process.exit(1);
    });
})();
