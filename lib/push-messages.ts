// 푸시 알림 메시지 빌더

export function commentPushPayload(actorName: string, day?: number) {
  return {
    title: "새 댓글",
    body: `${actorName}님이 댓글을 남겼습니다`,
    url: day ? `/365bible?day=${day}` : "/notifications",
    tag: "comment",
  };
}

export function amenPushPayload(actorName: string, day?: number) {
  return {
    title: "아멘",
    body: `${actorName}님이 아멘했습니다`,
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
