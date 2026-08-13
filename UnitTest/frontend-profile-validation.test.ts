import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  firstProfileRegistrationErrorKey,
  hasProfileRegistrationValidationErrors,
  isValidProfileNameKana,
  isValidProfilePhoneNumber,
  normalizeProfilePhoneNumber,
  profileRegistrationErrorSteps,
  validateProfileRegistrationInput,
} from "../Frontend/composables/frichy/profileValidation";
import type { ProfileRegistrationInput } from "../Frontend/composables/frichy/types";

function registrationInput(
  overrides: Partial<ProfileRegistrationInput> = {},
): ProfileRegistrationInput {
  return {
    basic: {
      name: "山田 太郎",
      nameKana: "やまだ たろう",
      email: "freelancer@example.com",
      phone: "090-1111-2222",
      role: "フロントエンドエンジニア",
    },
    skills: {
      languages: "TypeScript",
      db: "PostgreSQL",
      frameworks: "React",
      cloud: "GCP",
      otherSkills: "",
      years: "5",
      skillExperiences: { TypeScript: "5" },
    },
    terms: {
      desiredRate: "80",
      startDate: "2026-09-01",
      workRate: "週5",
      remote: "フルリモート",
      availability: "即稼働可",
      resume: null,
    },
    meetingCandidates: ["2026-09-02T10:00"],
    pledgeAccepted: true,
    ...overrides,
  };
}

describe("プロフィール登録バリデーション", () => {
  /**
   * @testData 全必須項目を空欄にしたプロフィール登録入力と、登録済みレジュメなしの状態。
   * @expected 必須項目ごとのエラーメッセージが返り、最初のエラーは基本情報ステップに対応する。
   */
  it("必須項目の未入力を項目別エラーとして返す", () => {
    const errors = validateProfileRegistrationInput(
      registrationInput({
        basic: {
          name: "",
          nameKana: "",
          email: "",
          phone: "",
          role: "",
        },
        skills: {
          languages: "",
          db: "",
          frameworks: "",
          cloud: "",
          otherSkills: "",
          years: "",
          skillExperiences: {},
        },
        terms: {
          desiredRate: "",
          startDate: "",
          workRate: "",
          remote: "",
          availability: "",
          resume: null,
        },
        meetingCandidates: [""],
        pledgeAccepted: false,
      }),
    );

    assert.equal(hasProfileRegistrationValidationErrors(errors), true);
    assert.equal(errors.name, "お名前を入力してください。");
    assert.equal(errors.nameKana, "お名前（ふりがな）を入力してください。");
    assert.equal(errors.email, "メールアドレスを入力してください。");
    assert.equal(errors.phone, "電話番号を入力してください。");
    assert.equal(errors.skills, "スキルはチェックまたはその他を1つ以上入力してください。");
    assert.equal(firstProfileRegistrationErrorKey(errors), "name");
    assert.equal(
      profileRegistrationErrorSteps[firstProfileRegistrationErrorKey(errors)!],
      1,
    );
  });

  /**
   * @testData 新規ファイル選択なしだが、既にレジュメ登録済みとして扱うプロフィール登録入力。
   * @expected 既存レジュメがある場合はresumeエラーを出さず、その他の必須項目が揃っていればエラーなしになる。
   */
  it("登録済みレジュメがある場合はレジュメ未選択を許容する", () => {
    const errors = validateProfileRegistrationInput(registrationInput(), {
      hasExistingResume: true,
    });

    assert.equal(hasProfileRegistrationValidationErrors(errors), false);
    assert.equal(errors.resume, undefined);
  });

  /**
   * @testData 既存レジュメ削除予定だが、新しいレジュメファイルを選択していないプロフィール登録入力。
   * @expected 削除予定中は既存レジュメを有効扱いせず、レジュメ必須エラーが返る。
   */
  it("既存レジュメ削除予定では新しいレジュメ未選択を許容しない", () => {
    const errors = validateProfileRegistrationInput(
      registrationInput({
        terms: {
          desiredRate: "80",
          startDate: "2026-09-01",
          workRate: "週5",
          remote: "フルリモート",
          availability: "即稼働可",
          resume: null,
          deleteExistingResume: true,
          deleteExistingResumeId: "resume-old",
        },
      }),
      { hasExistingResume: false },
    );

    assert.equal(errors.resume, "レジュメを登録してください。");
  });

  /**
   * @testData 不正なemailと短い電話番号、ハイフンあり/なしの妥当な電話番号。
   * @expected email/電話番号の形式エラーが返り、妥当な電話番号はハイフン有無どちらも許容され正規化できる。
   */
  it("メールと電話番号の形式を検証し電話番号を正規化する", () => {
    const errors = validateProfileRegistrationInput(
      registrationInput({
        basic: {
          name: "山田 太郎",
          nameKana: "やまだ たろう",
          email: "invalid",
          phone: "090-111",
          role: "フロントエンドエンジニア",
        },
      }),
      { hasExistingResume: true },
    );

    assert.equal(errors.email, "メールアドレスの形式で入力してください。");
    assert.equal(
      errors.phone,
      "電話番号は10〜11桁の数字で入力してください（ハイフン可）。",
    );
    assert.equal(isValidProfilePhoneNumber("090-1111-2222"), true);
    assert.equal(isValidProfilePhoneNumber("09011112222"), true);
    assert.equal(normalizeProfilePhoneNumber("090-1111-2222"), "09011112222");
  });

  /**
   * @testData カタカナを含むふりがな、漢字を含むふりがな、ひらがなと空白だけのふりがな。
   * @expected ふりがなはひらがなだけ許可され、カタカナや漢字を含む場合は項目エラーになる。
   */
  it("ふりがなはひらがなだけ許可する", () => {
    const errors = validateProfileRegistrationInput(
      registrationInput({
        basic: {
          name: "山田 太郎",
          nameKana: "ヤマダ 太郎",
          email: "freelancer@example.com",
          phone: "090-1111-2222",
          role: "フロントエンドエンジニア",
        },
      }),
      { hasExistingResume: true },
    );

    assert.equal(
      errors.nameKana,
      "お名前（ふりがな）はひらがなで入力してください。",
    );
    assert.equal(isValidProfileNameKana("やまだ たろう"), true);
    assert.equal(isValidProfileNameKana("ヤマダ タロウ"), false);
    assert.equal(isValidProfileNameKana("山田 たろう"), false);
  });
});
