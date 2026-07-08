# Provider usage-tracking coverage

Honest verification matrix for `@hanzo/usage`. Every "native pipeline" row was
ported from the matching `Sources/CodexBarCore/Providers/<Id>` Swift source and the
`docs/<provider>.md` reference — endpoints, auth headers, and response shapes were
read from those sources, not guessed.

**Columns**
- **Native pipeline** — the built-in fetch strategy in `providerRegistry` (`apiToken`,
  `oauth`, `web`, `localProbe`). `—` = no native pipeline yet.
- **Connect-only** — requires a browser cookie, a local PTY/CLI session, an OAuth
  device flow, or a cloud SDK; cannot be tracked from a pasteable API key alone.
- **Cloud-routed** — when the provider's traffic is proxied through `api.hanzo.ai`,
  the Hanzo commerce ledger meters it natively (the `hanzo` pipeline), independent of
  whether the vendor exposes a usage API. `✓` for LLM inference lanes.

## Natively tracked (20)

`hanzo`, `codex`, `claude`, `openai`, `openrouter`, `deepseek`, `elevenlabs`,
`deepgram`, `groq`, `poe`, `venice`, `chutes`, `moonshot`, `kimi`, `kimik2`, `zai`,
`litellm`, `llmproxy`, `minimax`, `byo`.

## Matrix

| Provider | Native pipeline (strategy) | Connect-only | Cloud-routed | Notes |
|---|---|---|---|---|
| hanzo | apiToken (cloud billing) + localProbe (dev CLI) | | ✓ | `GET api.hanzo.ai/v1/billing/usage`; dev rollout `token_count` probe. |
| codex | oauth | | ✓ | ChatGPT `backend-api/wham/usage` via `~/.codex/auth.json`. |
| claude | oauth + web | | ✓ | Anthropic `oauth/usage`; claude.ai session fallback. |
| openai | apiToken | | ✓ | `GET api.openai.com/v1/dashboard/billing/credit_grants` (Bearer) → granted/used/available. |
| openrouter | apiToken | | ✓ | `GET openrouter.ai/api/v1/credits` (Bearer) → `total_credits`/`total_usage`. |
| deepseek | apiToken | | ✓ | `GET api.deepseek.com/user/balance` (Bearer) → `balance_infos[].total_balance` (string). |
| elevenlabs | apiToken | | | `GET api.elevenlabs.io/v1/user/subscription` (`xi-api-key`) → `character_count`/`character_limit`/reset. |
| deepgram | apiToken (projects→usage) | | | `GET /v1/projects` then `/projects/{id}/usage/breakdown` (`Authorization: Token`). Usage metrics only. |
| groq | apiToken (prometheus) | | ✓ | 3× `GET /v1/metrics/prometheus/api/v1/query` (Bearer). Throughput req/min + tokens/min (no balance API). |
| poe | apiToken | | ✓ | `GET api.poe.com/usage/current_balance` (Bearer) → `current_point_balance`. |
| venice | apiToken | | ✓ | `GET api.venice.ai/api/v1/billing/balance` (Bearer) → `balances.usd`/`diem`, `diemEpochAllocation`. |
| chutes | apiToken | | ✓ | `GET /users/me/subscription_usage` (Bearer). Key-tolerant rolling(4h)+monthly windows. |
| moonshot | apiToken (regioned) | | ✓ | `GET {intl\|cn}/v1/users/me/balance` (Bearer) → `data.available_balance`. |
| kimi | apiToken (coding key) | web cookie also | ✓ | `GET api.kimi.com/coding/v1/usages` (Bearer). Consumer web path is cookie-based (connect-only). |
| kimik2 | apiToken | | ✓ | `GET kimi-k2.ai/api/user/credits` (Bearer). Key-tolerant credits balance. |
| zai | apiToken (regioned) | | ✓ | `GET {z.ai\|bigmodel.cn}/api/monitor/usage/quota/limit` (Bearer) → token/time limit windows. |
| litellm | apiToken (self-hosted) | | ✓ | `GET {base}/key/info` (Bearer, `/v1` stripped) → `info.spend`/`expires`. BYO-gateway lane. |
| llmproxy | apiToken (self-hosted) | | ✓ | `GET {base}/v1/quota-stats` (Bearer) → per-provider remaining% + summary. BYO-gateway lane. |
| minimax | apiToken (coding key) | web cookie for standard keys | ✓ | `GET {api}/v1/api/openplatform/coding_plan/remains` (Bearer). `sk-cp-*` keys only; `sk-api-*`/none → cookie. |
| byo | apiToken (`/key/info`→`/v1/models`) | | ✓ | Generic OpenAI-compatible `{baseUrl, apiKey}`: LiteLLM `/key/info` for spend, else `/v1/models` liveness (`dataConfidence: unknown`). Self-hosted / BYO-GPU lane. |
| abacus | — | ✓ (cookie) | ✓ | Web dashboard session; no pasteable-key usage API. |
| alibaba | — | ✓ (cookie/token) | ✓ | Qwen coding-plan web session. |
| alibabatokenplan | — | ✓ (cookie/token) | ✓ | Qwen token-plan web session. |
| amp | — | ✓ (cookie) | ✓ | Amp web session. |
| antigravity | — | ✓ (cookie) | ✓ | Web session. |
| augment | — | ✓ (cookie) | ✓ | Web session. |
| azureopenai | — | ✓ (endpoint+key, not ported) | ✓ | API-key portable; deployment-scoped endpoint not yet native. |
| bedrock | — | ✓ (AWS SDK) | ✓ | Skipped — AWS SigV4/SDK-weight; use BYO/gateway metering or CloudWatch. |
| clawrouter | — | ✓ (cookie/CLI) | ✓ | Router session. |
| codebuff | — | ✓ (cookie) | ✓ | Web session. |
| commandcode | — | ✓ (cookie/CLI) | ✓ | CLI session. |
| copilot | — | ✓ (device-flow) | ✓ | GitHub Copilot device auth; connect-only per scope. |
| crof | — | ✓ (cookie) | ✓ | Web session. |
| crossmodel | — | ✓ (cookie) | ✓ | Web session. |
| cursor | — | ✓ (cookie) | ✓ | Cursor web session; connect-only per scope. |
| devin | — | ✓ (cookie) | ✓ | Web session. |
| doubao | — | ✓ (cookie) | ✓ | Web session. |
| factory | — | ✓ (cookie) | ✓ | Droid web session. |
| gemini | — | ✓ (OAuth) | ✓ | Gemini OAuth device flow; connect-only per scope. |
| grok | — | ✓ (cookie/OAuth, gRPC-web) | ✓ | `grok.com` gRPC-web billing needs a browser cookie or `~/.grok/auth.json`; no pasteable-key balance path. |
| jetbrains | — | ✓ (cookie) | ✓ | JetBrains AI web session. |
| kilo | — | ✓ (cookie/CLI) | ✓ | Kilo session. |
| kiro | — | ✓ (cookie) | ✓ | Kiro session. |
| manus | — | ✓ (cookie) | ✓ | Web session. |
| mimo | — | ✓ (cookie) | ✓ | Xiaomi MiMo web session. |
| mistral | — | ✓ (cookie + CSRF) | ✓ | `admin.mistral.ai` needs `ory_session_*` + `csrftoken`; no pasteable-key usage API. |
| ollama | — | ✓ (local) | | Local runtime; track via a BYO endpoint pointed at the local Ollama server. |
| opencode | — | ✓ (CLI) | ✓ | Local CLI session. |
| opencodego | — | ✓ (CLI) | ✓ | Local CLI session. |
| perplexity | — | ✓ (cookie) | ✓ | Web session. |
| qoder | — | ✓ (cookie) | ✓ | Web session. |
| sakana | — | ✓ (cookie) | ✓ | Web session. |
| stepfun | — | ✓ (cookie) | ✓ | Web session. |
| synthetic | — | ✓ (key, not ported) | ✓ | API-key portable; not yet native. |
| t3chat | — | ✓ (cookie) | ✓ | Web session. |
| vertexai | — | ✓ (GCP SDK) | ✓ | Skipped — GCP service-account/SDK-weight; use BYO/gateway metering. |
| warp | — | ✓ (cookie) | ✓ | Warp web session. |
| windsurf | — | ✓ (cookie) | ✓ | Web session. |
| zed | — | ✓ (cookie) | ✓ | Zed web session. |

## Notes

- **Cloud-routing is the universal lane.** Any model call proxied through
  `api.hanzo.ai` is metered natively by the Hanzo commerce ledger (`hanzo` pipeline),
  regardless of the vendor. A connect-only provider still has full spend visibility
  when its traffic is routed through Hanzo Cloud.
- **BYO devices in Hanzo Cloud are metered natively.** A BYO GPU / self-hosted node
  registered into Hanzo Cloud is billed run-for-pay by the cloud ledger — the `byo`
  provider here is the *local* probe for endpoints Hanzo does not itself operate.
- **Connect-only is honest, not lazy.** Every `—`/connect-only row genuinely lacks a
  pasteable-key usage endpoint in its upstream source; porting a fake one would
  fabricate data. `bedrock`/`vertexai` are deliberately deferred (cloud-SDK weight).
