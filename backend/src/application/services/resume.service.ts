import type { PrismaClient } from "@prisma/client";
import { encryptText } from "../../infrastructure/crypto.js";
import type { ResumeMetadataInput } from "./shared.js";

export class ResumeService {
  constructor(private readonly db: PrismaClient) {}

  async createLatest(userId: string, input: ResumeMetadataInput) {
    const profile = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { userId },
    });
    await this.db.resume.updateMany({
      where: { freelancerProfileId: profile.id },
      data: { isLatest: false },
    });
    return this.db.resume.create({
      data: {
        ...input,
        originalFilename: encryptText(input.originalFilename),
        freelancerProfileId: profile.id,
        isLatest: true,
      },
    });
  }
}
