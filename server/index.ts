import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startTrialNotificationCron } from "./trialNotificationCron";
import { startPaymentReminderCron } from "./paymentReminderCron";
import { startReferralEmailCron } from "./referralEmailCron";
import { startReactivationCron } from "./reactivationEmailCron";
import { setupMailgunWebhooks } from "./mailgunWebhook";
import { runAutoMigrations } from "./migrations/autoMigrate";

const app = express();

// Redirect to canonical domain (SEO: prevent duplicate content)
app.use((req, res, next) => {
  const host = req.headers.host;
  const canonicalDomain = 'meinedokbox.de';
  
  if (host) {
    // Redirect www to non-www
    if (host.startsWith('www.')) {
      const newHost = host.slice(4);
      return res.redirect(301, `https://${newHost}${req.originalUrl}`);
    }
    
    // Redirect replit.app to custom domain
    if (host.includes('.replit.app')) {
      return res.redirect(301, `https://${canonicalDomain}${req.originalUrl}`);
    }
  }
  
  next();
});

// Stripe Webhook needs raw body - must be BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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

(async () => {
  // Run auto-migrations BEFORE starting the server
  // This ensures the database schema is up-to-date in both Dev and Production
  await runAutoMigrations();
  
  // Setup Mailgun webhooks (before routes to ensure it's registered)
  setupMailgunWebhooks(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start trial notification cron job
    startTrialNotificationCron();
    
    // Start payment reminder cron job
    startPaymentReminderCron();
    
    // Start day-8 referral program email cron job
    startReferralEmailCron();
    
    // Start post-trial reactivation email cron job
    startReactivationCron();
  });
})();
