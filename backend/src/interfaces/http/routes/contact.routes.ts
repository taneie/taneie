import type { Express } from "express";
import type { ContactService } from "../../../application/services.js";
import {
  asyncHandler,
  requireAuth,
  requireRole,
  validateBody,
  type AuthedRequest,
} from "../middleware.js";
import {
  answerContactInquirySchema,
  contactInquiryMessageSchema,
  createContactInquirySchema,
} from "../schemas.js";

export function registerContactRoutes(
  app: Express,
  contactService: ContactService,
) {
  app.get(
    "/api/contact-inquiries",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.json(await contactService.listInquiries(req.auth!));
    }),
  );

  app.post(
    "/api/contact-inquiries",
    requireAuth,
    validateBody(createContactInquirySchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      res.status(201).json(await contactService.createInquiry(req.auth!, req.body));
    }),
  );

  app.patch(
    "/api/contact-inquiries/:id/answer",
    requireAuth,
    requireRole("sales"),
    validateBody(answerContactInquirySchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(
        await contactService.answerInquiry(req.auth!, id, req.body),
      );
    }),
  );

  app.patch(
    "/api/contact-inquiries/:id/messages",
    requireAuth,
    validateBody(contactInquiryMessageSchema),
    asyncHandler<AuthedRequest>(async (req, res) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(
        await contactService.addInquiryMessage(req.auth!, id, req.body),
      );
    }),
  );

  app.patch(
    "/api/contact-inquiries/:id/close",
    requireAuth,
    asyncHandler<AuthedRequest>(async (req, res) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(await contactService.closeInquiry(req.auth!, id));
    }),
  );
}
