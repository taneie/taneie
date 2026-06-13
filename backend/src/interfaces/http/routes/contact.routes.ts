import type { Express } from "express";
import type { ContactService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import { createContactInquirySchema } from "../schemas.js";

export function registerContactRoutes(
  app: Express,
  contactService: ContactService,
) {
  app.post(
    "/api/contact-inquiries",
    requireAuth,
    validateBody(createContactInquirySchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.status(201).json(await contactService.createInquiry(req.auth!, req.body));
    }),
  );
}
