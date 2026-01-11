# Quotio/ViewModels/QuotaViewModel.swift

[← Back to Module](../modules/root/MODULE.md) | [← Back to INDEX](../INDEX.md)

## Overview

- **Lines:** 1736
- **Language:** Swift
- **Symbols:** 84
- **Public symbols:** 0

## Symbol Table

| Line | Kind | Name | Visibility | Signature |
| ---- | ---- | ---- | ---------- | --------- |
| 11 | class | QuotaViewModel | (internal) | `class QuotaViewModel` |
| 116 | method | init | (internal) | `init()` |
| 125 | fn | setupProxyURLObserver | (private) | `private func setupProxyURLObserver()` |
| 140 | fn | updateProxyConfiguration | (internal) | `func updateProxyConfiguration() async` |
| 152 | fn | setupRefreshCadenceCallback | (private) | `private func setupRefreshCadenceCallback()` |
| 160 | fn | setupWarmupCallback | (private) | `private func setupWarmupCallback()` |
| 178 | fn | restartAutoRefresh | (private) | `private func restartAutoRefresh()` |
| 190 | fn | initialize | (internal) | `func initialize() async` |
| 200 | fn | initializeFullMode | (private) | `private func initializeFullMode() async` |
| 218 | fn | checkForProxyUpgrade | (private) | `private func checkForProxyUpgrade() async` |
| 223 | fn | initializeQuotaOnlyMode | (private) | `private func initializeQuotaOnlyMode() async` |
| 233 | fn | initializeRemoteMode | (private) | `private func initializeRemoteMode() async` |
| 261 | fn | setupRemoteAPIClient | (private) | `private func setupRemoteAPIClient(config: Remot...` |
| 269 | fn | reconnectRemote | (internal) | `func reconnectRemote() async` |
| 278 | fn | loadDirectAuthFiles | (internal) | `func loadDirectAuthFiles() async` |
| 284 | fn | refreshQuotasDirectly | (internal) | `func refreshQuotasDirectly() async` |
| 309 | fn | autoSelectMenuBarItems | (private) | `private func autoSelectMenuBarItems()` |
| 346 | fn | refreshClaudeCodeQuotasInternal | (private) | `private func refreshClaudeCodeQuotasInternal() ...` |
| 367 | fn | refreshCursorQuotasInternal | (private) | `private func refreshCursorQuotasInternal() async` |
| 378 | fn | refreshCodexCLIQuotasInternal | (private) | `private func refreshCodexCLIQuotasInternal() async` |
| 398 | fn | refreshGeminiCLIQuotasInternal | (private) | `private func refreshGeminiCLIQuotasInternal() a...` |
| 416 | fn | refreshGlmQuotasInternal | (private) | `private func refreshGlmQuotasInternal() async` |
| 426 | fn | refreshTraeQuotasInternal | (private) | `private func refreshTraeQuotasInternal() async` |
| 436 | fn | refreshKiroQuotasInternal | (private) | `private func refreshKiroQuotasInternal() async` |
| 442 | fn | cleanName | (internal) | `func cleanName(_ name: String) -> String` |
| 492 | fn | startQuotaOnlyAutoRefresh | (private) | `private func startQuotaOnlyAutoRefresh()` |
| 509 | fn | startQuotaAutoRefreshWithoutProxy | (private) | `private func startQuotaAutoRefreshWithoutProxy()` |
| 527 | fn | isWarmupEnabled | (internal) | `func isWarmupEnabled(for provider: AIProvider, ...` |
| 531 | fn | warmupStatus | (internal) | `func warmupStatus(provider: AIProvider, account...` |
| 536 | fn | warmupNextRunDate | (internal) | `func warmupNextRunDate(provider: AIProvider, ac...` |
| 541 | fn | toggleWarmup | (internal) | `func toggleWarmup(for provider: AIProvider, acc...` |
| 550 | fn | setWarmupEnabled | (internal) | `func setWarmupEnabled(_ enabled: Bool, provider...` |
| 562 | fn | nextDailyRunDate | (private) | `private func nextDailyRunDate(minutes: Int, now...` |
| 573 | fn | restartWarmupScheduler | (private) | `private func restartWarmupScheduler()` |
| 606 | fn | runWarmupCycle | (private) | `private func runWarmupCycle() async` |
| 669 | fn | warmupAccount | (private) | `private func warmupAccount(provider: AIProvider...` |
| 714 | fn | warmupAccount | (private) | `private func warmupAccount(     provider: AIPro...` |
| 775 | fn | fetchWarmupModels | (private) | `private func fetchWarmupModels(     provider: A...` |
| 799 | fn | warmupAvailableModels | (internal) | `func warmupAvailableModels(provider: AIProvider...` |
| 812 | fn | warmupAuthInfo | (private) | `private func warmupAuthInfo(provider: AIProvide...` |
| 834 | fn | warmupTargets | (private) | `private func warmupTargets() -> [WarmupAccountKey]` |
| 848 | fn | updateWarmupStatus | (private) | `private func updateWarmupStatus(for key: Warmup...` |
| 877 | fn | startProxy | (internal) | `func startProxy() async` |
| 904 | fn | stopProxy | (internal) | `func stopProxy()` |
| 926 | fn | toggleProxy | (internal) | `func toggleProxy() async` |
| 934 | fn | setupAPIClient | (private) | `private func setupAPIClient()` |
| 941 | fn | startAutoRefresh | (private) | `private func startAutoRefresh()` |
| 978 | fn | attemptProxyRecovery | (private) | `private func attemptProxyRecovery() async` |
| 994 | fn | refreshData | (internal) | `func refreshData() async` |
| 1027 | fn | manualRefresh | (internal) | `func manualRefresh() async` |
| 1038 | fn | refreshAllQuotas | (internal) | `func refreshAllQuotas() async` |
| 1066 | fn | refreshQuotasUnified | (internal) | `func refreshQuotasUnified() async` |
| 1096 | fn | refreshAntigravityQuotasInternal | (private) | `private func refreshAntigravityQuotasInternal()...` |
| 1114 | fn | refreshAntigravityQuotasWithoutDetect | (private) | `private func refreshAntigravityQuotasWithoutDet...` |
| 1129 | fn | isAntigravityAccountActive | (internal) | `func isAntigravityAccountActive(email: String) ...` |
| 1134 | fn | switchAntigravityAccount | (internal) | `func switchAntigravityAccount(email: String) async` |
| 1146 | fn | beginAntigravitySwitch | (internal) | `func beginAntigravitySwitch(accountId: String, ...` |
| 1151 | fn | cancelAntigravitySwitch | (internal) | `func cancelAntigravitySwitch()` |
| 1156 | fn | dismissAntigravitySwitchResult | (internal) | `func dismissAntigravitySwitchResult()` |
| 1159 | fn | refreshOpenAIQuotasInternal | (private) | `private func refreshOpenAIQuotasInternal() async` |
| 1164 | fn | refreshCopilotQuotasInternal | (private) | `private func refreshCopilotQuotasInternal() async` |
| 1169 | fn | refreshQuotaForProvider | (internal) | `func refreshQuotaForProvider(_ provider: AIProv...` |
| 1200 | fn | refreshAutoDetectedProviders | (internal) | `func refreshAutoDetectedProviders() async` |
| 1207 | fn | startOAuth | (internal) | `func startOAuth(for provider: AIProvider, proje...` |
| 1249 | fn | startCopilotAuth | (private) | `private func startCopilotAuth() async` |
| 1266 | fn | startKiroAuth | (private) | `private func startKiroAuth(method: AuthCommand)...` |
| 1300 | fn | pollCopilotAuthCompletion | (private) | `private func pollCopilotAuthCompletion() async` |
| 1317 | fn | pollKiroAuthCompletion | (private) | `private func pollKiroAuthCompletion() async` |
| 1335 | fn | pollOAuthStatus | (private) | `private func pollOAuthStatus(state: String, pro...` |
| 1363 | fn | cancelOAuth | (internal) | `func cancelOAuth()` |
| 1367 | fn | deleteAuthFile | (internal) | `func deleteAuthFile(_ file: AuthFile) async` |
| 1395 | fn | pruneMenuBarItems | (private) | `private func pruneMenuBarItems()` |
| 1439 | fn | importVertexServiceAccount | (internal) | `func importVertexServiceAccount(url: URL) async` |
| 1463 | fn | fetchAPIKeys | (internal) | `func fetchAPIKeys() async` |
| 1473 | fn | addAPIKey | (internal) | `func addAPIKey(_ key: String) async` |
| 1485 | fn | updateAPIKey | (internal) | `func updateAPIKey(old: String, new: String) async` |
| 1497 | fn | deleteAPIKey | (internal) | `func deleteAPIKey(_ key: String) async` |
| 1510 | fn | checkAccountStatusChanges | (private) | `private func checkAccountStatusChanges()` |
| 1531 | fn | checkQuotaNotifications | (internal) | `func checkQuotaNotifications()` |
| 1563 | fn | scanIDEsWithConsent | (internal) | `func scanIDEsWithConsent(options: IDEScanOption...` |
| 1630 | fn | savePersistedIDEQuotas | (private) | `private func savePersistedIDEQuotas()` |
| 1653 | fn | loadPersistedIDEQuotas | (private) | `private func loadPersistedIDEQuotas()` |
| 1715 | fn | shortenAccountKey | (private) | `private func shortenAccountKey(_ key: String) -...` |
| 1727 | struct | OAuthState | (internal) | `struct OAuthState` |

## Memory Markers

### 🟢 `NOTE` (line 283)

> Cursor and Trae are NOT auto-refreshed - user must use "Scan for IDEs" (issue #29)

### 🟢 `NOTE` (line 291)

> Cursor and Trae removed from auto-refresh to address privacy concerns (issue #29)

### 🟢 `NOTE` (line 1045)

> Cursor and Trae removed from auto-refresh (issue #29)

### 🟢 `NOTE` (line 1065)

> Cursor and Trae require explicit user scan (issue #29)

### 🟢 `NOTE` (line 1074)

> Cursor and Trae removed - require explicit scan (issue #29)

### 🟢 `NOTE` (line 1122)

> Don't call detectActiveAccount() here - already set by switch operation

