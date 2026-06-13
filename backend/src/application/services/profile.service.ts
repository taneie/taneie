import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { encryptText } from "../../infrastructure/crypto.js";
import { mapFreelancer } from "../mappers.js";
import {
  freelancerInclude,
  type ProfileInput,
  upsertSkills,
} from "./shared.js";

export class ProfileService {
  constructor(private readonly db: PrismaClient) {}

  async listFreelancers() {
    const profiles = await this.db.freelancerProfile.findMany({
      include: freelancerInclude,
      orderBy: { updatedAt: "desc" },
    });
    return profiles.map(mapFreelancer);
  }

  async getCurrent(userId: string) {
    const profile = await this.db.freelancerProfile.findUnique({
      where: { userId },
      include: freelancerInclude,
    });
    return profile ? mapFreelancer(profile) : null;
  }

  async updateCurrent(userId: string, input: ProfileInput) {
    const profile = await this.db.freelancerProfile.upsert({
      where: { userId },
      update: {
        roleTitle: input.roleTitle,
        yearsExperience: input.yearsExperience,
        desiredRate: input.desiredRate,
        startDate: input.startDate ? new Date(input.startDate) : null,
        workRate: input.workRate,
        remoteType: input.remoteType,
        availabilityStatus: input.availabilityStatus,
        availabilityNote: input.availabilityNote,
        pledgedAt: input.pledgeAccepted ? new Date() : undefined,
        lastUpdatedOn: new Date(),
      },
      create: {
        userId,
        publicCode: `tf-${randomUUID().slice(0, 8)}`,
        roleTitle: input.roleTitle,
        yearsExperience: input.yearsExperience,
        desiredRate: input.desiredRate,
        startDate: input.startDate ? new Date(input.startDate) : null,
        workRate: input.workRate,
        remoteType: input.remoteType,
        availabilityStatus: input.availabilityStatus,
        availabilityNote: input.availabilityNote,
        pledgedAt: input.pledgeAccepted ? new Date() : undefined,
        lastUpdatedOn: new Date(),
      },
    });

    if (input.name || input.nameKana !== undefined || input.phone) {
      await this.db.user.update({
        where: { id: userId },
        data: {
          name: input.name ? encryptText(input.name) : undefined,
          nameKana:
            input.nameKana !== undefined
              ? encryptText(input.nameKana)
              : undefined,
          phone: input.phone ? encryptText(input.phone) : undefined,
        },
      });
    }

    if (input.skills) {
      await this.db.freelancerSkill.deleteMany({
        where: { freelancerProfileId: profile.id },
      });
      const skills = await upsertSkills(this.db, input.skills, "other");
      await this.db.freelancerSkill.createMany({
        data: skills.map((skill) => ({
          freelancerProfileId: profile.id,
          skillId: skill.id,
        })),
      });
    }

    const updated = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: freelancerInclude,
    });
    return mapFreelancer(updated);
  }
}
