const CHATGPT_ORIGINS = [
  'https://chatgpt.com',
  'https://chat.openai.com',
  'https://www.chatgpt.com',
  'https://www.chat.openai.com',
];

const DEFAULT_ORIGIN = CHATGPT_ORIGINS[0];

export const isMcpEnabled = () => process.env.MCP_ENABLED === 'true';

export const ensureMcpEnabled = () => {
  if (!isMcpEnabled()) {
    return new Response('Not Found', { status: 404 });
  }
  return null;
};

export const resolveCorsOrigin = (origin?: string | null) => {
  if (origin && CHATGPT_ORIGINS.includes(origin)) {
    return origin;
  }

  return DEFAULT_ORIGIN;
};

export const getCorsHeaders = (origin?: string | null, methods = 'GET, POST, OPTIONS') => {
  const resolvedOrigin = resolveCorsOrigin(origin);

  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};
