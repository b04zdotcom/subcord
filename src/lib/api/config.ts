export const SUBSTACK_ENDPOINTS = {
  login: "https://substack.com/api/v1/login",

  // Returns publications with unread community activity — includes numeric pub IDs
  publications: [
    "https://substack.com/api/v1/activity/unread",
    "https://substack.com/api/v1/inbox",
    "https://substack.com/api/v1/subscriptions",
    "https://substack.com/api/v1/reader/following",
  ] as const,

  // {numericId} = numeric publication ID (e.g. 1476543)
  // {subdomain} = substack subdomain slug
  chatMessages: [
    "https://substack.com/api/v1/community/publications/{numericId}/posts",
    "https://substack.com/api/v1/community/publications/{numericId}/messages",
    "https://substack.com/api/v1/community/publications/{numericId}/activity",
    "https://{subdomain}.substack.com/api/v1/chat",
  ] as const,
} as const;

export function getChatCandidates(numericId: string, subdomain: string): string[] {
  const override = process.env.SUBSTACK_CHAT_ENDPOINT_OVERRIDE;
  const overrides = override
    ? [override.replace(/{numericId}/g, numericId).replace(/{subdomain}/g, subdomain)]
    : [];
  return [
    ...overrides,
    ...SUBSTACK_ENDPOINTS.chatMessages
      .map((t) => t.replace(/{numericId}/g, numericId).replace(/{subdomain}/g, subdomain)),
  ];
}

export function getPublicationCandidates(): string[] {
  const override = process.env.SUBSTACK_PUBLICATIONS_ENDPOINT_OVERRIDE;
  return override
    ? [override, ...SUBSTACK_ENDPOINTS.publications]
    : [...SUBSTACK_ENDPOINTS.publications];
}
