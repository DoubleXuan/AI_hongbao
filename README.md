# 春节红包活动实时看板

一个轻量网页 APP，用于聚合和展示主流 AI 模型平台与信息平台（小红书、抖音、头条等）的红包活动资讯。

## 功能

- 实时聚合多来源 RSS（Bing News RSS + Google News RSS）
- 平台筛选（主流 AI 大模型 + 信息平台）
- 按平台分组展示（每个平台合并展示最近活动）
- 关键词搜索过滤
- 手动刷新 + 每 60 秒自动刷新
- 数据源异常时自动降级提示
- AI 分析当前活动（支持接入你自己的大模型 API）
- 仅展示最近 3 天活动新闻

## 运行方式

```bash
npm start
```

启动后访问：`http://127.0.0.1:3000`

## 技术说明

- 无第三方依赖，Node.js 原生 `http + fetch`
- 后端接口：
  - `GET /api/events`
  - `POST /api/analyze`
- 前端：原生 HTML/CSS/JS

## 活动来源覆盖

- AI 模型平台：微信 AI、腾讯混元、通义千问、豆包、文心、Kimi、GLM、OpenAI、Claude、Gemini、Grok、Llama、Mistral、DeepSeek、MiniMax、Yi
- 信息平台：小红书、抖音、今日头条、微博、知乎、B 站
- 说明：公开平台通常无稳定官方开放搜索 API，当前采用新闻聚合 RSS 的站点定向检索方式覆盖多平台信息

## AI API 配置（Vercel/本地）

在环境变量中配置以下字段（OpenAI 兼容协议）：

- `AI_API_KEY`：你的 API Key
- `AI_API_BASE_URL`：例如 `https://api.openai.com/v1` 或你自建网关地址
- `AI_API_MODEL`：例如 `gpt-4o-mini`、`qwen-plus`、`hunyuan-turbo` 等
- `AI_API_CHAT_PATH`：可选，默认 `/chat/completions`

Gemini（OpenAI 兼容）推荐配置：

- `AI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
- `AI_API_MODEL=gemini-2.5-flash`（或你已开通的 Gemini 3 型号）
- `AI_API_MODEL_FALLBACKS=gemini-2.5-flash,gemini-2.0-flash`（可选，主模型拥塞时自动降级）
- `AI_API_RETRY_TIMES=2`（可选，默认 2 次）

## 可选环境变量

- `EVENTS_CACHE_TTL_MS`：活动抓取缓存时间（毫秒），默认 `180000`
