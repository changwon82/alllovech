// 푸시 알림 메시지 빌더

const REACTION_LABEL: Record<string, string> = {
  heart: "❤️", like: "👍", pray: "🙏", fire: "🔥", cry: "😢",
};

export function commentPushPayload(actorName: string, day?: number, commentSnippet?: string, groupName?: string) {
  const prefix = groupName ? `${groupName} · ` : "";
  const dayStr = day ? `Day ${day} ` : "";
  const snippet = commentSnippet
    ? (commentSnippet.length > 30 ? commentSnippet.slice(0, 30) + "…" : commentSnippet)
    : "";
  return {
    title: `${prefix}${dayStr}댓글`,
    body: `${actorName} ${snippet}`,
    url: day ? `/365bible?day=${day}` : "/notifications",
    tag: "comment",
  };
}

export function amenPushPayload(actorName: string, day?: number, reactionType?: string, groupName?: string) {
  const prefix = groupName ? `${groupName} · ` : "";
  const dayStr = day ? `Day ${day} ` : "";
  const emoji = reactionType ? REACTION_LABEL[reactionType] ?? reactionType : "🙏";
  return {
    title: `${prefix}${dayStr}공감`,
    body: `${actorName}님이 ${emoji} 공감했습니다`,
    url: day ? `/365bible?day=${day}` : "/notifications",
    tag: "amen",
  };
}

export function contactPushPayload(senderName: string) {
  return {
    title: "새 문의",
    body: `${senderName}님이 문의를 보냈습니다`,
    url: "/notifications",
    tag: "contact",
  };
}
