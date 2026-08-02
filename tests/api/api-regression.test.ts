import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  expectErrorCode,
  login,
  startTestServer,
  type TestServer,
  useLocalTestDatabase,
} from "../helpers/http";

useLocalTestDatabase();

let server: TestServer;
let prisma: typeof import("../../backend/src/infrastructure/prisma").prisma;
let closePrisma: typeof import("../../backend/src/infrastructure/prisma").closePrisma;

const created = {
  applicationIds: new Set<string>(),
  contactInquiryIds: new Set<string>(),
  jobIds: new Set<string>(),
  meetingIds: new Set<string>(),
  messageIds: new Set<string>(),
  userIds: new Set<string>(),
};

const profileSnapshots = new Map<
  string,
  {
    availabilityNote: string | null;
    initialMeetingCompleted: boolean;
    initialMeetingCompletedAt: Date | null;
  }
>();

async function rememberProfile(profileId: string) {
  if (profileSnapshots.has(profileId)) return;
  const profile = await prisma.freelancerProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: {
      availabilityNote: true,
      initialMeetingCompleted: true,
      initialMeetingCompletedAt: true,
    },
  });
  profileSnapshots.set(profileId, profile);
}

async function cleanup() {
  for (const id of created.messageIds) {
    await prisma.message.delete({ where: { id } }).catch(() => {});
  }
  for (const id of created.meetingIds) {
    await prisma.meetingRequest.delete({ where: { id } }).catch(() => {});
  }
  for (const id of created.contactInquiryIds) {
    await prisma.contactInquiry.delete({ where: { id } }).catch(() => {});
  }
  for (const id of created.applicationIds) {
    await prisma.application.delete({ where: { id } }).catch(() => {});
  }
  for (const id of created.jobIds) {
    await prisma.job.delete({ where: { id } }).catch(() => {});
  }
  for (const [id, snapshot] of profileSnapshots) {
    await prisma.freelancerProfile
      .update({
        where: { id },
        data: snapshot,
      })
      .catch(() => {});
  }
  for (const id of created.userIds) {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
}

before(async () => {
  const appModule = await import("../../backend/src/interfaces/http/app");
  const prismaModule = await import("../../backend/src/infrastructure/prisma");
  prisma = prismaModule.prisma;
  closePrisma = prismaModule.closePrisma;
  server = await startTestServer(appModule.createApp());
});

after(async () => {
  await cleanup();
  await server.close();
  await closePrisma();
});

describe("API疎通・認証フロー", () => {
  /**
   * @testData 認証なしの`GET /api/health` request。
   * @expected HTTP 200、status `ok`、service `Frichy API` が返る。
   */
  it("GET /api/health returns API status", async () => {
    const response = await server.request<{ status: string; service: string }>(
      "/health",
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.status, "ok");
    assert.equal(response.data.service, "Frichy API");
  });

  /**
   * @testData デモ求職者/営業の正しい認証情報と、求職者emailに誤passwordを指定したlogin request。
   * @expected デモユーザーはrole付きでlogin成功し、不正passwordは401 `INVALID_CREDENTIALS` になる。
   */
  it("auth login succeeds for demo accounts and fails for invalid credentials", async () => {
    const freelancer = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );
    assert.equal(freelancer.user.role, "freelancer");
    assert.ok(freelancer.user.freelancerId);

    const sales = await login(server, "sales@frichy.jp", "sales123");
    assert.equal(sales.user.role, "sales");

    const invalid = await server.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "freelancer@example.com",
        password: "wrong",
      }),
    });
    expectErrorCode(invalid, 401, "INVALID_CREDENTIALS");
  });

  /**
   * @testData tokenなしの`/auth/me` requestと、デモ求職者token付きrequest。
   * @expected 未認証は401 `AUTH_REQUIRED`、認証済みはroleとfreelancerIdを含むcurrent userを返す。
   */
  it("GET /api/auth/me requires auth and returns current user", async () => {
    const unauthorized = await server.request("/auth/me");
    expectErrorCode(unauthorized, 401, "AUTH_REQUIRED");

    const { token } = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );
    const me = await server.request<{ role: string; freelancerId?: string }>(
      "/auth/me",
      {},
      token,
    );

    assert.equal(me.status, 200);
    assert.equal(me.data.role, "freelancer");
    assert.ok(me.data.freelancerId);
  });

  /**
   * @testData 一意なemailの新規登録payload、同一emailの重複登録payload、作成ユーザーのmessage一覧。
   * @expected 新規求職者は201でtoken/freelancerIdを返し、重複emailは409、初期未読営業messageは0件になる。
   */
  it("register creates a new freelancer and rejects duplicate emails", async () => {
    const email = `api-regression-${Date.now()}@example.com`;
    const createdUser = await server.request<{
      token: string;
      user: { id: string; role: string; freelancerId?: string };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: "password123",
        privacyPolicyAccepted: true,
      }),
    });
    created.userIds.add(createdUser.data.user.id);

    assert.equal(createdUser.status, 201);
    assert.equal(createdUser.data.user.role, "freelancer");
    assert.ok(createdUser.data.token);
    assert.ok(createdUser.data.user.freelancerId);

    const duplicate = await server.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: "password123",
        privacyPolicyAccepted: true,
      }),
    });
    expectErrorCode(duplicate, 409, "EMAIL_ALREADY_EXISTS");

    const messages = await server.request<Array<{ channel: string; readAt: string }>>(
      "/messages",
      {},
      createdUser.data.token,
    );
    assert.equal(messages.status, 200);
    assert.equal(
      messages.data.filter((message) => message.channel === "sales" && !message.readAt)
        .length,
      0,
    );
  });

  /**
   * @testData 未登録emailのpassword reset requestと、存在しない32文字tokenのconfirm request。
   * @expected 未登録emailでも安全な200応答を返し、無効tokenでの確定は400 `INVALID_PASSWORD_RESET_TOKEN` になる。
   */
  it("password reset request is safe for unknown email and invalid confirm token is rejected", async () => {
    const request = await server.request<{ message: string }>(
      "/auth/password-reset/request",
      {
        method: "POST",
        body: JSON.stringify({ email: "unknown@example.com" }),
      },
    );
    assert.equal(request.status, 200);
    assert.match(request.data.message, /パスワード再設定/);

    const confirm = await server.request("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({
        token: "a".repeat(32),
        password: "password123",
      }),
    });
    expectErrorCode(confirm, 400, "INVALID_PASSWORD_RESET_TOKEN");
  });
});

describe("APIプロフィール・案件フロー", () => {
  /**
   * @testData デモ求職者token、デモ営業token、プロフィール更新payload、範囲外yearsExperience。
   * @expected 営業のprofile/me参照は403、求職者は取得/更新でき、範囲外経験年数は400 validation errorになる。
   */
  it("profile can be fetched and updated by freelancer, while sales is forbidden", async () => {
    const freelancer = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );
    const sales = await login(server, "sales@frichy.jp", "sales123");

    const forbidden = await server.request("/profile/me", {}, sales.token);
    expectErrorCode(forbidden, 403, "FORBIDDEN");

    const profile = await server.request<{
      id: string;
      name: string;
      email: string;
      phone: string;
      skills: string[];
      skillExperiences: Array<{ name: string; yearsExperience?: number }>;
    }>("/profile/me", {}, freelancer.token);
    assert.equal(profile.status, 200);
    assert.ok(profile.data.name);
    assert.ok(profile.data.email);
    await rememberProfile(profile.data.id);

    const saved = await server.request<{ availability: string }>(
      "/profile/me",
      {
        method: "PUT",
        body: JSON.stringify({
          name: profile.data.name,
          phone: profile.data.phone || "090-1111-2222",
          roleTitle: "フルスタックエンジニア",
          yearsExperience: 6,
          desiredRate: 850000,
          startDate: "2026-09-01",
          workRate: "週5",
          remoteType: "フルリモート",
          availabilityNote: "API regression test",
          skills: profile.data.skills.length ? profile.data.skills : ["TypeScript"],
          skillExperiences: profile.data.skillExperiences.length
            ? profile.data.skillExperiences
            : [{ name: "TypeScript", yearsExperience: 5 }],
        }),
      },
      freelancer.token,
    );
    assert.equal(saved.status, 200);
    assert.equal(saved.data.availability, "API regression test");

    const invalid = await server.request(
      "/profile/me",
      {
        method: "PUT",
        body: JSON.stringify({ yearsExperience: 100 }),
      },
      freelancer.token,
    );
    expectErrorCode(invalid, 400, "VALIDATION_ERROR");
  });

  /**
   * @testData 求職者による案件作成payload、営業による案件作成/flag更新payload、求職者の一覧/詳細/応募request。
   * @expected 求職者の案件作成は403、営業作成/更新は成功し、求職者は一覧/詳細取得と初回応募だけ成功する。
   */
  it("sales can create/update jobs and freelancer can list/get/apply once", async () => {
    const sales = await login(server, "sales@frichy.jp", "sales123");
    const freelancer = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );

    const createAsFreelancer = await server.request(
      "/jobs",
      {
        method: "POST",
        body: JSON.stringify({
          title: "権限NG案件",
          rateMin: 700000,
          rateMax: 900000,
          marginRate: 10,
          streamType: "エンド直",
          remoteType: "フルリモート",
        }),
      },
      freelancer.token,
    );
    expectErrorCode(createAsFreelancer, 403, "FORBIDDEN");

    const job = await server.request<{ id: string; title: string; active: boolean }>(
      "/jobs",
      {
        method: "POST",
        body: JSON.stringify({
          title: `API回帰テスト案件 ${Date.now()}`,
          client: "API Test Client",
          summary: "TypeScript/GCPのテスト案件",
          required: ["TypeScript"],
          nice: ["GCP"],
          rateMin: 700000,
          rateMax: 950000,
          marginRate: 10,
          streamType: "エンド直",
          remoteType: "フルリモート",
          isPinned: false,
        }),
      },
      sales.token,
    );
    created.jobIds.add(job.data.id);
    assert.equal(job.status, 201);
    assert.equal(job.data.active, true);

    const patched = await server.request<{ active: boolean; sortFlag: boolean }>(
      `/jobs/${job.data.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isPinned: true, isActive: true }),
      },
      sales.token,
    );
    assert.equal(patched.status, 200);
    assert.equal(patched.data.sortFlag, true);

    const list = await server.request<{ items: Array<{ id: string }>; total: number }>(
      "/jobs?limit=5&offset=0",
      {},
      freelancer.token,
    );
    assert.equal(list.status, 200);
    assert.ok(list.data.total >= 1);

    const fetched = await server.request<{ id: string }>(
      `/jobs/${job.data.id}`,
      {},
      freelancer.token,
    );
    assert.equal(fetched.status, 200);
    assert.equal(fetched.data.id, job.data.id);

    const application = await server.request<{ id: string; status: string }>(
      "/applications",
      {
        method: "POST",
        body: JSON.stringify({ jobId: job.data.id }),
      },
      freelancer.token,
    );
    created.applicationIds.add(application.data.id);
    assert.equal(application.status, 201);
    assert.equal(application.data.status, "選考中");

    const duplicate = await server.request(
      "/applications",
      {
        method: "POST",
        body: JSON.stringify({ jobId: job.data.id }),
      },
      freelancer.token,
    );
    expectErrorCode(duplicate, 409, "APPLICATION_ALREADY_EXISTS");

    const changed = await server.request<{ status: string }>(
      `/applications/${application.data.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "面談待ち", note: "API regression" }),
      },
      sales.token,
    );
    assert.equal(changed.status, 200);
    assert.equal(changed.data.status, "面談待ち");
  });
});

describe("API面談・メッセージ・問い合わせフロー", () => {
  /**
   * @testData timezoneなし日時、営業のprofile未指定request、求職者のtimezone付き面談候補、求職者/営業のstatus更新request。
   * @expected 不正日時と営業profile未指定は400、求職者は候補作成可、求職者status更新は403、営業status更新は成功する。
   */
  it("meeting requests validate date/role and support sales status updates", async () => {
    const freelancer = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );
    const sales = await login(server, "sales@frichy.jp", "sales123");
    assert.ok(freelancer.user.freelancerId);

    const invalid = await server.request(
      "/meeting-requests",
      {
        method: "POST",
        body: JSON.stringify({ candidateAt: "2026-08-20T10:00" }),
      },
      freelancer.token,
    );
    expectErrorCode(invalid, 400, "VALIDATION_ERROR");

    const salesMissingProfile = await server.request(
      "/meeting-requests",
      {
        method: "POST",
        body: JSON.stringify({ candidateAt: "2026-08-20T10:00:00+09:00" }),
      },
      sales.token,
    );
    expectErrorCode(salesMissingProfile, 400, "FREELANCER_PROFILE_REQUIRED");

    const meeting = await server.request<{ id: string; status: string }>(
      "/meeting-requests",
      {
        method: "POST",
        body: JSON.stringify({ candidateAt: "2026-08-20T10:00:00+09:00" }),
      },
      freelancer.token,
    );
    created.meetingIds.add(meeting.data.id);
    assert.equal(meeting.status, 201);
    assert.equal(meeting.data.status, "候補");

    const updateAsFreelancer = await server.request(
      `/meeting-requests/${meeting.data.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "確定" }),
      },
      freelancer.token,
    );
    expectErrorCode(updateAsFreelancer, 403, "FORBIDDEN");

    const updated = await server.request<{ status: string }>(
      `/meeting-requests/${meeting.data.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "確定" }),
      },
      sales.token,
    );
    assert.equal(updated.status, 200);
    assert.equal(updated.data.status, "confirmed");
  });

  /**
   * @testData 初期message一覧、空body、求職者のscout送信、営業のchat送信、求職者の既読化request。
   * @expected 初期未読は0件、空bodyは400、求職者scoutは403、営業chatは作成され、受信者既読化でreadAtが入る。
   */
  it("messages enforce scout rules, support chat sending, and mark reads by receiver", async () => {
    const freelancer = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );
    const sales = await login(server, "sales@frichy.jp", "sales123");
    assert.ok(freelancer.user.freelancerId);

    const initial = await server.request<Array<{ channel: string; readAt: string }>>(
      "/messages",
      {},
      freelancer.token,
    );
    assert.equal(initial.status, 200);
    assert.equal(
      initial.data.filter((message) => message.channel === "sales" && !message.readAt)
        .length,
      0,
    );

    const blank = await server.request(
      "/messages",
      {
        method: "POST",
        body: JSON.stringify({ body: " " }),
      },
      freelancer.token,
    );
    expectErrorCode(blank, 400, "VALIDATION_ERROR");

    const scoutAsFreelancer = await server.request(
      "/messages",
      {
        method: "POST",
        body: JSON.stringify({
          freelancerProfileId: freelancer.user.freelancerId,
          jobId: "11111111-1111-4111-8111-111111111111",
          body: "スカウト",
          messageType: "scout",
        }),
      },
      freelancer.token,
    );
    expectErrorCode(scoutAsFreelancer, 403, "FORBIDDEN");

    const chat = await server.request<{ id: string; channel: string; body: string }>(
      "/messages",
      {
        method: "POST",
        body: JSON.stringify({
          freelancerProfileId: freelancer.user.freelancerId,
          body: "API回帰テストのチャットです。",
        }),
      },
      sales.token,
    );
    created.messageIds.add(chat.data.id);
    assert.equal(chat.status, 201);
    assert.equal(chat.data.channel, "sales");
    assert.equal(chat.data.body, "API回帰テストのチャットです。");

    const read = await server.request<Array<{ id: string; readAt: string }>>(
      "/messages/read",
      {
        method: "PATCH",
        body: JSON.stringify({}),
      },
      freelancer.token,
    );
    assert.equal(read.status, 200);
    assert.ok(read.data.find((message) => message.id === chat.data.id)?.readAt);
  });

  /**
   * @testData 求職者の問い合わせ作成payload、営業の問い合わせ一覧request、求職者/営業の回答request。
   * @expected 問い合わせ作成と営業一覧は成功し、求職者回答は403、営業回答後はstatus `answered` と回答本文が返る。
   */
  it("contact inquiries can be created, listed, and answered by sales only", async () => {
    const freelancer = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );
    const sales = await login(server, "sales@frichy.jp", "sales123");

    const inquiry = await server.request<{ id: string; createdAt: string }>(
      "/contact-inquiries",
      {
        method: "POST",
        body: JSON.stringify({
          inquiryType: "案件相談",
          name: "山田 太郎",
          email: "freelancer@example.com",
          phone: "090-1111-2222",
          subject: "API回帰テスト",
          body: "問い合わせ本文",
        }),
      },
      freelancer.token,
    );
    created.contactInquiryIds.add(inquiry.data.id);
    assert.equal(inquiry.status, 201);
    assert.ok(inquiry.data.createdAt);

    const createdList = await server.request<Array<{ id: string; status: string }>>(
      "/contact-inquiries",
      {},
      sales.token,
    );
    assert.equal(createdList.status, 200);
    assert.equal(
      createdList.data.find((item) => item.id === inquiry.data.id)?.status,
      "new",
    );

    const freelancerAnswer = await server.request(
      `/contact-inquiries/${inquiry.data.id}/answer`,
      {
        method: "PATCH",
        body: JSON.stringify({ answerBody: "回答" }),
      },
      freelancer.token,
    );
    expectErrorCode(freelancerAnswer, 403, "FORBIDDEN");

    const answered = await server.request<{ status: string; answerBody: string }>(
      `/contact-inquiries/${inquiry.data.id}/answer`,
      {
        method: "PATCH",
        body: JSON.stringify({ answerBody: "回答本文" }),
      },
      sales.token,
    );
    assert.equal(answered.status, 200);
    assert.equal(answered.data.status, "answered");
    assert.equal(answered.data.answerBody, "回答本文");

    const list = await server.request<Array<{ id: string }>>(
      "/contact-inquiries",
      {},
      sales.token,
    );
    assert.equal(list.status, 200);
    assert.ok(list.data.some((item) => item.id === inquiry.data.id));
  });

  /**
   * @testData デモ求職者profileId、求職者token/営業token、initial meeting completed更新payload。
   * @expected 求職者自身の更新は403、営業更新は200で`initialMeetingCompleted`がtrueになる。
   */
  it("sales can update initial meeting completion and freelancer cannot", async () => {
    const freelancer = await login(
      server,
      "freelancer@example.com",
      "freelance123",
    );
    const sales = await login(server, "sales@frichy.jp", "sales123");
    assert.ok(freelancer.user.freelancerId);
    await rememberProfile(freelancer.user.freelancerId);

    const forbidden = await server.request(
      `/freelancers/${freelancer.user.freelancerId}/initial-meeting`,
      {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
      },
      freelancer.token,
    );
    expectErrorCode(forbidden, 403, "FORBIDDEN");

    const updated = await server.request<{ initialMeetingCompleted: boolean }>(
      `/freelancers/${freelancer.user.freelancerId}/initial-meeting`,
      {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
      },
      sales.token,
    );
    assert.equal(updated.status, 200);
    assert.equal(updated.data.initialMeetingCompleted, true);
  });
});
