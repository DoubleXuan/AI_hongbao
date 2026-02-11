function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return 'https://api.openai.com/v1';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function extractMessageContent(message) {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function buildAnalysisPrompt(events, note = '') {
  const items = events.slice(0, 15).map((item, index) => {
    const time = item.publishedAt || '未知时间';
    return `${index + 1}. [${item.platform}] ${item.title} | ${time}\n摘要: ${item.summary}\n链接: ${item.sourceUrl}`;
  });

  const noteLine = note ? `用户附加关注点: ${note}` : '用户附加关注点: 无';
  return [
    '你是红包活动分析助手。请基于以下活动信息给出简明分析。',
    noteLine,
    '输出格式必须包含以下4段：',
    '1) 今日重点活动（最多5条）',
    '2) 参与优先级建议（高/中/低）',
    '3) 风险提醒（例如钓鱼链接、过期活动、门槛过高）',
    '4) 行动清单（下一步怎么做）',
    '',
    '活动列表：',
    items.join('\n\n') || '暂无活动'
  ].join('\n');
}

async function analyzeEvents({ events, note }) {
  const apiKey = process.env.AI_API_KEY || '';
  const apiBaseUrl = normalizeBaseUrl(process.env.AI_API_BASE_URL);
  const chatPath = process.env.AI_API_CHAT_PATH || '/chat/completions';
  const model = process.env.AI_API_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return {
      enabled: false,
      model: null,
      generatedAt: new Date().toISOString(),
      analysis:
        '未配置 AI API。请在 Vercel 环境变量中设置 AI_API_KEY、AI_API_BASE_URL、AI_API_MODEL 后重试。'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(`${apiBaseUrl}${chatPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: '你是严谨的活动分析助手，结论要可执行并避免夸张。'
          },
          {
            role: 'user',
            content: buildAnalysisPrompt(events, note)
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API HTTP ${response.status}: ${errorText.slice(0, 240)}`);
    }

    const data = await response.json();
    const content = extractMessageContent(data?.choices?.[0]?.message);

    return {
      enabled: true,
      model: data?.model || model,
      generatedAt: new Date().toISOString(),
      analysis: content || 'AI 返回为空，请稍后重试。'
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  analyzeEvents
};
