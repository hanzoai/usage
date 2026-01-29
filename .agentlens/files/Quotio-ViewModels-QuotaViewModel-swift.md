# Quotio/ViewModels/QuotaViewModel.swift

[← Back to Module](../modules/root/MODULE.md) | [← Back to INDEX](../INDEX.md)

## Overview

- **Lines:** 1806
- **Language:** Swift
- **Symbols:** 87
- **Public symbols:** 0

## Symbol Table

| Line | Kind | Name | Visibility | Signature |
| ---- | ---- | ---- | ---------- | --------- |
| 11 | class | QuotaViewModel | (internal) | `class QuotaViewModel` |
| 121 | method | init | (internal) | `init()` |
| 131 | fn | setupProxyURLObserver | (private) | `private func setupProxyURLObserver()` |
| 147 | fn | normalizedProxyURL | (private) | `private func normalizedProxyURL(_ rawValue: Str...` |
| 159 | fn | updateProxyConfiguration | (internal) | `func updateProxyConfiguration() async` |
| 172 | fn | setupRefreshCadenceCallback | (private) | `private func setupRefreshCadenceCallback()` |
| 180 | fn | setupWarmupCallback | (private) | `private func setupWarmupCallback()` |
| 198 | fn | restartAutoRefresh | (private) | `private func restartAutoRefresh()` |
| 210 | fn | initialize | (internal) | `func initialize() async` |
| 220 | fn | initializeFullMode | (private) | `private func initializeFullMode() async` |
| 236 | fn | checkForProxyUpgrade | (private) | `private func checkForProxyUpgrade() async` |
| 241 | fn | initializeQuotaOnlyMode | (private) | `private func initializeQuotaOnlyMode() async` |
| 251 | fn | initializeRemoteMode | (private) | `private func initializeRemoteMode() async` |
| 279 | fn | setupRemoteAPIClient | (private) | `private func setupRemoteAPIClient(config: Remot...` |
| 287 | fn | reconnectRemote | (internal) | `func reconnectRemote() async` |
| 296 | fn | loadDirectAuthFiles | (internal) | `func loadDirectAuthFiles() async` |
| 302 | fn | refreshQuotasDirectly | (internal) | `func refreshQuotasDirectly() async` |
| 328 | fn | autoSelectMenuBarItems | (private) | `private func autoSelectMenuBarItems()` |
| 362 | fn | syncMenuBarSelection | (internal) | `func syncMenuBarSelection()` |
| 369 | fn | refreshClaudeCodeQuotasInternal | (private) | `private func refreshClaudeCodeQuotasInternal() ...` |
| 390 | fn | refreshCursorQuotasInternal | (private) | `private func refreshCursorQuotasInternal() async` |
| 401 | fn | refreshCodexCLIQuotasInternal | (private) | `private func refreshCodexCLIQuotasInternal() async` |
| 421 | fn | refreshGeminiCLIQuotasInternal | (private) | `private func refreshGeminiCLIQuotasInternal() a...` |
| 439 | fn | refreshGlmQuotasInternal | (private) | `private func refreshGlmQuotasInternal() async` |
| 449 | fn | refreshWarpQuotasInternal | (private) | `private func refreshWarpQuotasInternal() async` |
| 473 | fn | refreshTraeQuotasInternal | (private) | `private func refreshTraeQuotasInternal() async` |
| 483 | fn | refreshKiroQuotasInternal | (private) | `private func refreshKiroQuotasInternal() async` |
| 489 | fn | cleanName | (internal) | `func cleanName(_ name: String) -> String` |
| 539 | fn | startQuotaOnlyAutoRefresh | (private) | `private func startQuotaOnlyAutoRefresh()` |
| 557 | fn | startQuotaAutoRefreshWithoutProxy | (private) | `private func startQuotaAutoRefreshWithoutProxy()` |
| 576 | fn | isWarmupEnabled | (internal) | `func isWarmupEnabled(for provider: AIProvider, ...` |
| 580 | fn | warmupStatus | (internal) | `func warmupStatus(provider: AIProvider, account...` |
| 585 | fn | warmupNextRunDate | (internal) | `func warmupNextRunDate(provider: AIProvider, ac...` |
| 590 | fn | toggleWarmup | (internal) | `func toggleWarmup(for provider: AIProvider, acc...` |
| 599 | fn | setWarmupEnabled | (internal) | `func setWarmupEnabled(_ enabled: Bool, provider...` |
| 611 | fn | nextDailyRunDate | (private) | `private func nextDailyRunDate(minutes: Int, now...` |
| 622 | fn | restartWarmupScheduler | (private) | `private func restartWarmupScheduler()` |
| 655 | fn | runWarmupCycle | (private) | `private func runWarmupCycle() async` |
| 718 | fn | warmupAccount | (private) | `private func warmupAccount(provider: AIProvider...` |
| 763 | fn | warmupAccount | (private) | `private func warmupAccount(     provider: AIPro...` |
| 824 | fn | fetchWarmupModels | (private) | `private func fetchWarmupModels(     provider: A...` |
| 848 | fn | warmupAvailableModels | (internal) | `func warmupAvailableModels(provider: AIProvider...` |
| 861 | fn | warmupAuthInfo | (private) | `private func warmupAuthInfo(provider: AIProvide...` |
| 883 | fn | warmupTargets | (private) | `private func warmupTargets() -> [WarmupAccountKey]` |
| 897 | fn | updateWarmupStatus | (private) | `private func updateWarmupStatus(for key: Warmup...` |
| 926 | fn | startProxy | (internal) | `func startProxy() async` |
| 958 | fn | stopProxy | (internal) | `func stopProxy()` |
| 986 | fn | toggleProxy | (internal) | `func toggleProxy() async` |
| 994 | fn | setupAPIClient | (private) | `private func setupAPIClient()` |
| 1001 | fn | startAutoRefresh | (private) | `private func startAutoRefresh()` |
| 1038 | fn | attemptProxyRecovery | (private) | `private func attemptProxyRecovery() async` |
| 1054 | fn | refreshData | (internal) | `func refreshData() async` |
| 1097 | fn | manualRefresh | (internal) | `func manualRefresh() async` |
| 1108 | fn | refreshAllQuotas | (internal) | `func refreshAllQuotas() async` |
| 1137 | fn | refreshQuotasUnified | (internal) | `func refreshQuotasUnified() async` |
| 1168 | fn | refreshAntigravityQuotasInternal | (private) | `private func refreshAntigravityQuotasInternal()...` |
| 1188 | fn | refreshAntigravityQuotasWithoutDetect | (private) | `private func refreshAntigravityQuotasWithoutDet...` |
| 1205 | fn | isAntigravityAccountActive | (internal) | `func isAntigravityAccountActive(email: String) ...` |
| 1210 | fn | switchAntigravityAccount | (internal) | `func switchAntigravityAccount(email: String) async` |
| 1222 | fn | beginAntigravitySwitch | (internal) | `func beginAntigravitySwitch(accountId: String, ...` |
| 1227 | fn | cancelAntigravitySwitch | (internal) | `func cancelAntigravitySwitch()` |
| 1232 | fn | dismissAntigravitySwitchResult | (internal) | `func dismissAntigravitySwitchResult()` |
| 1235 | fn | refreshOpenAIQuotasInternal | (private) | `private func refreshOpenAIQuotasInternal() async` |
| 1240 | fn | refreshCopilotQuotasInternal | (private) | `private func refreshCopilotQuotasInternal() async` |
| 1245 | fn | refreshQuotaForProvider | (internal) | `func refreshQuotaForProvider(_ provider: AIProv...` |
| 1278 | fn | refreshAutoDetectedProviders | (internal) | `func refreshAutoDetectedProviders() async` |
| 1285 | fn | startOAuth | (internal) | `func startOAuth(for provider: AIProvider, proje...` |
| 1327 | fn | startCopilotAuth | (private) | `private func startCopilotAuth() async` |
| 1344 | fn | startKiroAuth | (private) | `private func startKiroAuth(method: AuthCommand)...` |
| 1378 | fn | pollCopilotAuthCompletion | (private) | `private func pollCopilotAuthCompletion() async` |
| 1395 | fn | pollKiroAuthCompletion | (private) | `private func pollKiroAuthCompletion() async` |
| 1413 | fn | pollOAuthStatus | (private) | `private func pollOAuthStatus(state: String, pro...` |
| 1441 | fn | cancelOAuth | (internal) | `func cancelOAuth()` |
| 1445 | fn | deleteAuthFile | (internal) | `func deleteAuthFile(_ file: AuthFile) async` |
| 1473 | fn | pruneMenuBarItems | (private) | `private func pruneMenuBarItems()` |
| 1509 | fn | importVertexServiceAccount | (internal) | `func importVertexServiceAccount(url: URL) async` |
| 1533 | fn | fetchAPIKeys | (internal) | `func fetchAPIKeys() async` |
| 1543 | fn | addAPIKey | (internal) | `func addAPIKey(_ key: String) async` |
| 1555 | fn | updateAPIKey | (internal) | `func updateAPIKey(old: String, new: String) async` |
| 1567 | fn | deleteAPIKey | (internal) | `func deleteAPIKey(_ key: String) async` |
| 1580 | fn | checkAccountStatusChanges | (private) | `private func checkAccountStatusChanges()` |
| 1601 | fn | checkQuotaNotifications | (internal) | `func checkQuotaNotifications()` |
| 1633 | fn | scanIDEsWithConsent | (internal) | `func scanIDEsWithConsent(options: IDEScanOption...` |
| 1700 | fn | savePersistedIDEQuotas | (private) | `private func savePersistedIDEQuotas()` |
| 1723 | fn | loadPersistedIDEQuotas | (private) | `private func loadPersistedIDEQuotas()` |
| 1785 | fn | shortenAccountKey | (private) | `private func shortenAccountKey(_ key: String) -...` |
| 1797 | struct | OAuthState | (internal) | `struct OAuthState` |

## Memory Markers

### 🟢 `NOTE` (line 228)

> checkForProxyUpgrade() is now called inside startProxy()

### 🟢 `NOTE` (line 301)

> Cursor and Trae are NOT auto-refreshed - user must use "Scan for IDEs" (issue #29)

### 🟢 `NOTE` (line 309)

> Cursor and Trae removed from auto-refresh to address privacy concerns (issue #29)

### 🟢 `NOTE` (line 1115)

> Cursor and Trae removed from auto-refresh (issue #29)

### 🟢 `NOTE` (line 1136)

> Cursor and Trae require explicit user scan (issue #29)

### 🟢 `NOTE` (line 1145)

> Cursor and Trae removed - require explicit scan (issue #29)

### 🟢 `NOTE` (line 1198)

> Don't call detectActiveAccount() here - already set by switch operation

