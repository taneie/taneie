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
    const hasStartDate = Object.prototype.hasOwnProperty.call(
      input,
      "startDate",
    );
    const profile = await this.db.freelancerProfile.upsert({
      where: { userId },
      update: {
        roleTitle: input.roleTitle,
        yearsExperience: input.yearsExperience,
        desiredRate: input.desiredRate,
        startDate: hasStartDate
          ? input.startDate
            ? new Date(input.startDate)
            : null
          : undefined,
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
      const yearsBySkill = new Map(
        (input.skillExperiences || []).map((item) => [
          item.name,
          item.yearsExperience,
        ]),
      );
      await this.db.freelancerSkill.createMany({
        data: skills.map((skill) => ({
          freelancerProfileId: profile.id,
          skillId: skill.id,
          yearsExperience: yearsBySkill.get(skill.name),
        })),
      });
    }

    const updated = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: freelancerInclude,
    });
    return mapFreelancer(updated);
  }

  async updateInitialMeetingCompleted(
    freelancerProfileId: string,
    completed: boolean,
    changedBy?: string,
  ) {
    const current = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { id: freelancerProfileId },
      include: freelancerInclude,
    });
    if (current.initialMeetingCompleted === completed) {
      return mapFreelancer(current);
    }

    await this.db.freelancerProfile.update({
      where: { id: freelancerProfileId },
      data: {
        initialMeetingCompleted: completed,
        initialMeetingCompletedAt: completed ? new Date() : null,
      },
    });
    await this.syncApplicationStatusAfterInitialMeeting(
      freelancerProfileId,
      completed,
      changedBy,
    );
    const profile = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { id: freelancerProfileId },
      include: freelancerInclude,
    });
    return mapFreelancer(profile);
  }

  private async syncApplicationStatusAfterInitialMeeting(
    freelancerProfileId: string,
    completed: boolean,
    changedBy?: string,
  ) {
    const fromStatus = completed ? "screening" : "initial_meeting_completed";
    const toStatus = completed ? "initial_meeting_completed" : "screening";
    const applications = await this.db.application.findMany({
      where: {
        freelancerProfileId,
        status: fromStatus,
      },
      select: { id: true, status: true },
    });
    if (!applications.length) return;

    await this.db.application.updateMany({
      where: { id: { in: applications.map((application) => application.id) } },
      data: { status: toStatus },
    });
    await this.db.applicationStatusHistory.createMany({
      data: applications.map((application) => ({
        applicationId: application.id,
        fromStatus: application.status,
        toStatus,
        changedBy,
        note: completed
          ? "初回面談完了に伴う自動更新"
          : "初回面談完了解除に伴う自動更新",
      })),
    });
  }

}
