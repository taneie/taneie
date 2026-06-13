import type { Express } from "express";
import type { CommunicationService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { markMessagesReadSchema, sendMessageSchema } from "../schemas.js";
import { singleQueryParam } from "./helpers.js";

export function registerMessageRoutes(
  app: Express,
  communicationService: CommunicationService,
) {
  app.get(
    "/api/messages",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(
        await communicationService.listMessages(
          req.auth!,
          singleQueryParam(req.query.freelancerProfileId),
        ),
      );
    }),
  );

  app.post(
    "/api/messages",
    requireAuth,
    validateBody(sendMessageSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res
        .status(201)
        .json(await communicationService.sendMessage(req.auth!, req.body));
    }),
  );

  app.patch(
    "/api/messages/read",
    requireAuth,
    validateBody(markMessagesReadSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(await communicationService.markMessagesRead(req.auth!, req.body));
    }),
  );
}
