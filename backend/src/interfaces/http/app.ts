import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  ApplicationService,
  AuthService,
  CatalogService,
  CommunicationService,
  ContactService,
  JobService,
  ProfileService,
  PushSubscriptionService,
  ResumeService,
} from "../../application/services.js";
import { AppError } from "../../domain/types.js";
import { config } from "../../infrastructure/config.js";
import { prisma } from "../../infrastructure/prisma.js";
import { errorHandler, requireBasicAuth } from "./middleware.js";
import { registerAliveCheckRoutes } from "./routes/alive-checks.routes.js";
import { registerApplicationRoutes } from "./routes/applications.routes.js";
import { registerAuthRoutes } from "./routes/auth.routes.js";
import { registerBootstrapRoutes } from "./routes/bootstrap.routes.js";
import { registerContactRoutes } from "./routes/contact.routes.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerJobRoutes } from "./routes/jobs.routes.js";
import { registerMeetingRoutes } from "./routes/meetings.routes.js";
import { registerMessageRoutes } from "./routes/messages.routes.js";
import { registerProfileRoutes } from "./routes/profiles.routes.js";
import { registerPushRoutes } from "./routes/push.routes.js";
import { registerResumeRoutes } from "./routes/resumes.routes.js";

const authService = new AuthService(prisma);
const catalogService = new CatalogService(prisma);
const jobService = new JobService(prisma);
const profileService = new ProfileService(prisma);
const applicationService = new ApplicationService(prisma);
const communicationService = new CommunicationService(prisma);
const contactService = new ContactService(prisma);
const resumeService = new ResumeService(prisma);
const pushSubscriptionService = new PushSubscriptionService(prisma);

export function createApp() {
  const app = express();

  app.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      'unload=(self "https://view.officeapps.live.com")',
    );
    next();
  });
  app.use(requireBasicAuth);

  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(
          new AppError(403, "許可されていないオリジンです。", "CORS_FORBIDDEN"),
        );
      },
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  registerHealthRoutes(app);
  registerPushRoutes(app, pushSubscriptionService);
  registerAuthRoutes(app, authService);
  registerBootstrapRoutes(app, catalogService);
  registerJobRoutes(app, jobService);
  registerProfileRoutes(app, profileService);
  registerResumeRoutes(app, resumeService);
  registerApplicationRoutes(app, applicationService);
  registerMeetingRoutes(app, communicationService);
  registerMessageRoutes(app, communicationService);
  registerContactRoutes(app, contactService);
  registerAliveCheckRoutes(app, communicationService);

  const staticDir =
    process.env.STATIC_DIR ||
    path.resolve(process.cwd(), "Frontend/.output/public");
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
