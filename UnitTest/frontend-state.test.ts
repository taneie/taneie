import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blankProfile, createSeedState } from "../Frontend/composables/frichy/state";

describe("フロントエンド初期状態", () => {
  /**
   * @testData 任意IDを指定した空プロフィール生成。
   * @expected IDは指定値になり、入力項目、面談候補、規約同意状態は安全な初期値になる。
   */
  it("blankProfile returns a safe empty profile", () => {
    const profile = blankProfile("fr-empty");

    assert.equal(profile.id, "fr-empty");
    assert.equal(profile.name, "");
    assert.deepEqual(profile.meetingCandidates, []);
    assert.equal(profile.pledgeAccepted, false);
  });

  /**
   * @testData seed stateに含まれる初期メッセージ一覧。
   * @expected デモログイン直後に未読バッジが出ないよう、未読messageは0件になる。
   */
  it("createSeedState does not expose initial unread chat badges", () => {
    const state = createSeedState();
    const unread = state.messages.filter((message) => !message.readAt);

    assert.equal(unread.length, 0);
  });

  /**
   * @testData seed stateの求職者デモ応募と面談候補。
   * @expected 3か月以内と3〜5か月の応募があり、初回面談完了後の案件面談候補は3年後になる。
   */
  it("createSeedState includes current and expired applied jobs for freelancer demo", () => {
    const state = createSeedState();
    const freelancerApplications = state.applications.filter(
      (application) => application.freelancerId === "fr-001",
    );
    const meetingYears = state.meetingRequests
      .filter((meeting) => meeting.freelancerId === "fr-001")
      .map((meeting) => Number(meeting.candidate.slice(0, 4)));
    const threeYearsLater = new Date().getFullYear() + 3;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
    const demoFreelancer = state.freelancers.find(
      (freelancer) => freelancer.id === "fr-001",
    );
    const currentApplication = freelancerApplications.find(
      (application) => !application.isHiddenByExpiration,
    );
    const hiddenApplication = freelancerApplications.find(
      (application) => application.isHiddenByExpiration,
    );

    assert.ok(currentApplication);
    assert.ok(
      new Date(currentApplication.appliedAt).getTime() >
        threeMonthsAgo.getTime(),
    );
    assert.ok(hiddenApplication);
    assert.ok(
      new Date(hiddenApplication.appliedAt).getTime() <
        threeMonthsAgo.getTime(),
    );
    assert.ok(
      new Date(hiddenApplication.appliedAt).getTime() >
        fiveMonthsAgo.getTime(),
    );
    assert.equal(demoFreelancer?.initialMeetingCompleted, true);
    assert.ok(
      state.meetingRequests.every(
        (meeting) => meeting.applicationId === currentApplication.id,
      ),
    );
    assert.deepEqual([...new Set(meetingYears)], [threeYearsLater]);
  });
});
