export type AuthRole = "freelancer" | "sales";

export interface AuthContext {
  userId: string;
  role: AuthRole;
  email: string;
}

export interface TokenPayload extends AuthContext {
  iat?: number;
  exp?: number;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const labelToRemoteType = {
  フルリモート: "full_remote",
  一部リモート: "hybrid",
  常駐: "onsite",
} as const;

export const labelToStreamType = {
  エンド直: "end_direct",
  "1次請け": "prime",
  "2次請け": "secondary",
  その他: "other",
} as const;

export const labelToAvailabilityStatus = {
  即稼働可: "ready",
  稼働可能開始日: "scheduled",
  "2026年7月から空き予定": "scheduled",
  営業停止中: "paused",
  現在は案件停止中: "paused",
} as const;

export const labelToApplicationStatus = {
  選考中: "screening",
  面談待ち: "meeting_pending",
  成約: "contracted",
  見送り: "rejected",
} as const;

export const labelToMeetingStatus = {
  候補: "candidate",
  確定: "confirmed",
  再調整: "reschedule",
} as const;

export function getKeyByValue<T extends Record<string, string>>(
  record: T,
  value: string,
) {
  return (
    Object.entries(record).find(([, item]) => item === value)?.[0] || value
  );
}
