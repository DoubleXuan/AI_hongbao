function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return 'https://api.openai.com/v1';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function isLikelyGeminiBase(baseUrl) {
  return baseUrl.includes('generativelanguage.googleapis.com');
}

function hasGeminiOpenAICompatPath(baseUrl) {
  return baseUrl.includes('/openai');
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

function parseFallbackModels(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueStrings(items) {
  return [...new Set(items.filter(Boolean))];
}

function buildModelCandidates(primaryModel, apiBaseUrl) {
  const manualFallbacks = parseFallbackModels(process.env.AI_API_MODEL_FALLBACKS);
  const defaults = [];

  if (isLikelyGeminiBase(apiBaseUrl)) {
    defaults.push('gemini-2.5-flash', 'gemini-2.0-flash');
  }

  return uniqueStrings([primaryModel, ...manualFallbacks, ...defaults]);
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

function extractErrorMessage(errorPayload, fallbackText) {
  const fromPayload = errorPayload?.error?.message || errorPayload?.message || '';
  const message = String(fromPayload || fallbackText || '').trim();
  return message || '未知错误';
}

function isRetryableStatus(status, errorPayload) {
  const retryStatus = [429, 500, 502, 503, 504];
  if (retryStatus.includes(status)) return true;
  const statusText = String(errorPayload?.error?.status || '').toUpperCase();
  return ['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'DEADLINE_EXCEEDED'].includes(statusText);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenAICompatible({ apiBaseUrl, chatPath, apiKey, model, prompt }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);

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
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: '你是严谨的活动分析助手，结论要可执行并避免夸张。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    });

    const rawText = await response.text();
    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (_err) {
      data = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        errorMessage: extractErrorMessage(data, rawText.slice(0, 320)),
        errorPayload: data
      };
    }

    const content = extractMessageContent(data?.choices?.[0]?.message);
    return {
      ok: true,
      status: 200,
      model: data?.model || model,
      content
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      errorMessage: err.message || '网络异常',
      errorPayload: null
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeEvents({ events, note }) {
  const apiKey = process.env.AI_API_KEY || '';
  const apiBaseUrl = normalizeBaseUrl(process.env.AI_API_BASE_URL);
  const chatPath = process.env.AI_API_CHAT_PATH || '/chat/completions';
  const primaryModel = process.env.AI_API_MODEL || 'gpt-4o-mini';
  const prompt = buildAnalysisPrompt(events, note);
  const retryLimit = Number(process.env.AI_API_RETRY_TIMES || 2);

  if (!apiKey) {
    return {
      enabled: false,
      model: null,
      generatedAt: new Date().toISOString(),
      analysis:
        '未配置 AI API。请在 Vercel 环境变量中设置 AI_API_KEY、AI_API_BASE_URL、AI_API_MODEL 后重试。'
    };
  }

  if (isLikelyGeminiBase(apiBaseUrl) && !hasGeminiOpenAICompatPath(apiBaseUrl)) {
    return {
      enabled: false,
      model: primaryModel,
      generatedAt: new Date().toISOString(),
      analysis:
        'Gemini 配置看起来不完整：AI_API_BASE_URL 需要包含 /openai，例如 https://generativelanguage.googleapis.com/v1beta/openai'
    };
  }

  const candidates = buildModelCandidates(primaryModel, apiBaseUrl);
  const failureLogs = [];

  for (const model of candidates) {
    for (let attempt = 1; attempt <= retryLimit; attempt += 1) {
      const result = await callOpenAICompatible({
        apiBaseUrl,
        chatPath,
        apiKey,
        model,
        prompt
      });

      if (result.ok) {
        const modelNote = model === primaryModel ? '' : `（已从 ${primaryModel} 自动降级到 ${model}）`;
        return {
          enabled: true,
          model: result.model || model,
          generatedAt: new Date().toISOString(),
          analysis: `${modelNote}\n${result.content || 'AI 返回为空，请稍后重试。'}`.trim()
        };
      }

      failureLogs.push(
        `模型 ${model} 第 ${attempt} 次失败: HTTP ${result.status || 'NETWORK'} - ${result.errorMessage}`
      );

      const retryable = isRetryableStatus(result.status, result.errorPayload);
      if (!retryable || attempt >= retryLimit) {
        break;
      }

      // Short exponential backoff to survive burst traffic.
      await wait(500 * Math.pow(2, attempt - 1));
    }
  }

  return {
    enabled: false,
    model: primaryModel,
    generatedAt: new Date().toISOString(),
    analysis: `AI 接口暂时不可用，已尝试重试和备选模型。\n${failureLogs.slice(-3).join('\n')}`
  };
}

module.exports = {
  analyzeEvents
};
