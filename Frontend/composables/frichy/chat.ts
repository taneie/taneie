import type { Message, Role } from "./types";

export type ChatScope = {
  role: Role | null;
  freelancerId?: string;
};

export function isIncomingMessageForRole(message: Message, role: Role | null) {
  return role === "sales"
    ? message.channel === "freelancer"
    : message.channel === "sales";
}

export function isMessageInChatScope(message: Message, scope: ChatScope) {
  if (scope.role === "freelancer") {
    return message.freelancerId === scope.freelancerId;
  }

  return scope.role === "sales";
}

export function isUnreadIncomingMessageForScope(
  message: Message,
  scope: ChatScope,
) {
  return (
    isMessageInChatScope(message, scope) &&
    isIncomingMessageForRole(message, scope.role) &&
    !message.readAt
  );
}
