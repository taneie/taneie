import type { Express } from "express";
import type { CommunicationService } from "../../../application/services.js";
import { getKeyByValue, labelToMeetingStatus } from "../../../domain/types.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { createMeetingSchema, updateMeetingStatusSchema } from "../schemas.js";
import { routeParam, singleQueryParam } from "./helpers.js";

export function registerMeetingRoutes(
  app: Express,
  communicationService: CommunicationService,
) {
  app.get(
    "/api/meeting-requests",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      const meetings = await communicationService.listMeetings(
        req.auth!,
        singleQueryParam(req.query.freelancerProfileId),
      );
      res.json(
        meetings.map((meeting) => ({
          id: meeting.id,
          freelancerId: meeting.freelancerProfileId,
          applicationId: meeting.applicationId,
          candidate: meeting.candidateAt.toISOString(),
          status: getKeyByValue(labelToMeetingStatus, meeting.status),
        })),
      );
    }),
  );

  app.post(
    "/api/meeting-requests",
    requireAuth,
    validateBody(createMeetingSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res
        .status(201)
        .json(await communicationService.createMeeting(req.auth!, req.body));
    }),
  );

  app.patch(
    "/api/meeting-requests/:id/status",
    requireAuth,
    requireRole("sales"),
    validateBody(updateMeetingStatusSchema),
    asyncHandler(async (req, res) => {
      res.json(
        await communicationService.updateMeeting(
          routeParam(req.params.id),
          req.body.status,
        ),
      );
    }),
  );
}
