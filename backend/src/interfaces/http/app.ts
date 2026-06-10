import cors from "cors";
import express from "express";
import { config } from "../../infrastructure/config.js";
import { prisma } from "../../infrastructure/prisma.js";
import {
  ApplicationService,
  AuthService,
  CatalogService,
  CommunicationService,
  JobService,
  ProfileService
} from "../../application/services.js";
import { AppError, getKeyByValue, labelToMeetingStatus } from "../../domain/types.js";
import {
  asyncHandler,
  errorHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest
} from "./middleware.js";
import {
  applySchema,
  changeApplicationStatusSchema,
  createJobSchema,
  createMeetingSchema,
  loginSchema,
  registerSchema,
  resumeMetadataSchema,
  sendMessageSchema,
  updateJobFlagsSchema,
  updateMeetingStatusSchema,
  updateProfileSchema
} from "./schemas.js";

const authService = new AuthService(prisma);
const catalogService = new CatalogService(prisma);
const jobService = new JobService(prisma);
const profileService = new ProfileService(prisma);
const applicationService = new ApplicationService(prisma);
const communicationService = new CommunicationService(prisma);

function routeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export function createApp() {
  const app = express();

  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, "許可されていないオリジンです。", "CORS_FORBIDDEN"));
    }
  }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "TRYANGLE FREELANCE API" });
  });

  app.post("/api/auth/register", validateBody(registerSchema), asyncHandler(async (req, res) => {
    const result = await authService.register({
      ...req.body,
      policyVersion: config.privacyPolicyVersion,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    res.status(201).json(result);
  }));

  app.post("/api/auth/login", validateBody(loginSchema), asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.password);
    if (!result) throw new AppError(401, "メールアドレスまたはパスワードが違います。", "INVALID_CREDENTIALS");
    res.json(result);
  }));

  app.get("/api/auth/me", requireAuth, asyncHandler<AuthedRequest>(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.auth!.userId },
      include: { freelancerProfile: true }
    });
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      freelancerId: user.freelancerProfile?.id
    });
  }));

  app.get("/api/bootstrap", requireAuth, asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await catalogService.bootstrap(req.auth!));
  }));

  app.get("/api/jobs", requireAuth, asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await jobService.list(req.auth));
  }));

  app.post("/api/jobs", requireAuth, requireRole("sales"), validateBody(createJobSchema), asyncHandler<AuthedRequest>(async (req, res) => {
    res.status(201).json(await jobService.create(req.body, req.auth!.userId));
  }));

  app.patch("/api/jobs/:id", requireAuth, requireRole("sales"), validateBody(updateJobFlagsSchema), asyncHandler(async (req, res) => {
    res.json(await jobService.updateFlags(routeParam(req.params.id), req.body));
  }));

  app.get("/api/freelancers", requireAuth, requireRole("sales"), asyncHandler(async (_req, res) => {
    res.json(await profileService.listFreelancers());
  }));

  app.get("/api/profile/me", requireAuth, requireRole("freelancer"), asyncHandler<AuthedRequest>(async (req, res) => {
    const profile = await profileService.getCurrent(req.auth!.userId);
    if (!profile) throw new AppError(404, "プロフィールが見つかりません。", "PROFILE_NOT_FOUND");
    res.json(profile);
  }));

  app.put("/api/profile/me", requireAuth, requireRole("freelancer"), validateBody(updateProfileSchema), asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await profileService.updateCurrent(req.auth!.userId, req.body));
  }));

  app.post("/api/resumes", requireAuth, requireRole("freelancer"), validateBody(resumeMetadataSchema), asyncHandler<AuthedRequest>(async (req, res) => {
    const profile = await prisma.freelancerProfile.findUniqueOrThrow({ where: { userId: req.auth!.userId } });
    await prisma.resume.updateMany({ where: { freelancerProfileId: profile.id }, data: { isLatest: false } });
    const resume = await prisma.resume.create({
      data: { ...req.body, freelancerProfileId: profile.id, isLatest: true }
    });
    res.status(201).json(resume);
  }));

  app.get("/api/applications", requireAuth, asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await applicationService.list(req.auth!));
  }));

  app.post("/api/applications", requireAuth, requireRole("freelancer"), validateBody(applySchema), asyncHandler<AuthedRequest>(async (req, res) => {
    res.status(201).json(await applicationService.apply(req.body.jobId, req.auth!.userId));
  }));

  app.patch("/api/applications/:id/status", requireAuth, requireRole("sales"), validateBody(changeApplicationStatusSchema), asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await applicationService.changeStatus(routeParam(req.params.id), req.body.status, req.auth!.userId, req.body.note));
  }));

  app.get("/api/meeting-requests", requireAuth, asyncHandler<AuthedRequest>(async (req, res) => {
    const meetings = await communicationService.listMeetings(req.auth!, req.query.freelancerProfileId?.toString());
    res.json(meetings.map((meeting) => ({
      id: meeting.id,
      freelancerId: meeting.freelancerProfileId,
      applicationId: meeting.applicationId,
      candidate: meeting.candidateAt.toISOString(),
      status: getKeyByValue(labelToMeetingStatus, meeting.status)
    })));
  }));

  app.post("/api/meeting-requests", requireAuth, validateBody(createMeetingSchema), asyncHandler<AuthedRequest>(async (req, res) => {
    res.status(201).json(await communicationService.createMeeting(req.auth!, req.body));
  }));

  app.patch("/api/meeting-requests/:id/status", requireAuth, requireRole("sales"), validateBody(updateMeetingStatusSchema), asyncHandler(async (req, res) => {
    res.json(await communicationService.updateMeeting(routeParam(req.params.id), req.body.status));
  }));

  app.get("/api/messages", requireAuth, asyncHandler<AuthedRequest>(async (req, res) => {
    res.json(await communicationService.listMessages(req.auth!, req.query.freelancerProfileId?.toString()));
  }));

  app.post("/api/messages", requireAuth, validateBody(sendMessageSchema), asyncHandler<AuthedRequest>(async (req, res) => {
    res.status(201).json(await communicationService.sendMessage(req.auth!, req.body));
  }));

  app.post("/api/alive-checks", requireAuth, requireRole("sales"), asyncHandler<AuthedRequest>(async (req, res) => {
    res.status(201).json(await communicationService.createAliveCheck(req.auth!.userId));
  }));

  app.use(errorHandler);

  return app;
}
