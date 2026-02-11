# 春节红包活动实时看板

一个轻量网页 APP，用于聚合和展示微信、腾讯混元、通义千问及更多主流 AI 平台红包活动相关资讯。

## 功能

- 实时聚合多个新闻 RSS 数据源
- 平台筛选（含主流 AI 大模型平台）
- 关键词搜索过滤
- 手动刷新 + 每 60 秒自动刷新
- 数据源异常时自动降级提示
- AI 分析当前活动（支持接入你自己的大模型 API）

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

## AI API 配置（Vercel/本地）

在环境变量中配置以下字段（OpenAI 兼容协议）：

- `AI_API_KEY`：你的 API Key
- `AI_API_BASE_URL`：例如 `https://api.openai.com/v1` 或你自建网关地址
- `AI_API_MODEL`：例如 `gpt-4o-mini`、`qwen-plus`、`hunyuan-turbo` 等
- `AI_API_CHAT_PATH`：可选，默认 `/chat/completions`
