# Quotio/Services/Proxy/CLIProxyManager.swift

[← Back to Module](../modules/root/MODULE.md) | [← Back to INDEX](../INDEX.md)

## Overview

- **Lines:** 2308
- **Language:** Swift
- **Symbols:** 79
- **Public symbols:** 0

## Symbol Table

| Line | Kind | Name | Visibility | Signature |
| ---- | ---- | ---- | ---------- | --------- |
| 9 | class | CLIProxyManager | (internal) | `class CLIProxyManager` |
| 213 | method | init | (internal) | `init()` |
| 256 | fn | restartProxyIfRunning | (private) | `private func restartProxyIfRunning()` |
| 274 | fn | updateConfigValue | (private) | `private func updateConfigValue(pattern: String,...` |
| 294 | fn | updateConfigPort | (private) | `private func updateConfigPort(_ newPort: UInt16)` |
| 298 | fn | updateConfigHost | (private) | `private func updateConfigHost(_ host: String)` |
| 302 | fn | ensureApiKeyExistsInConfig | (private) | `private func ensureApiKeyExistsInConfig()` |
| 351 | fn | updateConfigAllowRemote | (internal) | `func updateConfigAllowRemote(_ enabled: Bool)` |
| 355 | fn | updateConfigLogging | (internal) | `func updateConfigLogging(enabled: Bool)` |
| 363 | fn | updateConfigRoutingStrategy | (internal) | `func updateConfigRoutingStrategy(_ strategy: St...` |
| 368 | fn | updateConfigProxyURL | (internal) | `func updateConfigProxyURL(_ url: String?)` |
| 396 | fn | applyBaseURLWorkaround | (internal) | `func applyBaseURLWorkaround()` |
| 425 | fn | removeBaseURLWorkaround | (internal) | `func removeBaseURLWorkaround()` |
| 467 | fn | ensureConfigExists | (private) | `private func ensureConfigExists()` |
| 501 | fn | syncSecretKeyInConfig | (private) | `private func syncSecretKeyInConfig()` |
| 517 | fn | regenerateManagementKey | (internal) | `func regenerateManagementKey() async throws` |
| 559 | fn | syncProxyURLInConfig | (private) | `private func syncProxyURLInConfig()` |
| 576 | fn | syncCustomProvidersToConfig | (private) | `private func syncCustomProvidersToConfig()` |
| 589 | fn | downloadAndInstallBinary | (internal) | `func downloadAndInstallBinary() async throws` |
| 647 | fn | fetchLatestRelease | (private) | `private func fetchLatestRelease(source: ProxyBi...` |
| 672 | fn | findCompatibleAsset | (private) | `private func findCompatibleAsset(in release: Re...` |
| 694 | fn | downloadAsset | (private) | `private func downloadAsset(url: String) async t...` |
| 713 | fn | extractAndInstall | (private) | `private func extractAndInstall(data: Data, asse...` |
| 775 | fn | findBinaryInDirectory | (private) | `private func findBinaryInDirectory(_ directory:...` |
| 808 | fn | start | (internal) | `func start(resetCrashRecoveryState: Bool = true...` |
| 957 | fn | stop | (internal) | `func stop()` |
| 1011 | fn | startHealthMonitor | (private) | `private func startHealthMonitor()` |
| 1025 | fn | stopHealthMonitor | (private) | `private func stopHealthMonitor()` |
| 1030 | fn | markExpectedTermination | (private) | `private func markExpectedTermination(_ process:...` |
| 1035 | fn | cancelCrashRestart | (private) | `private func cancelCrashRestart()` |
| 1040 | fn | scheduleCrashRestart | (private) | `private func scheduleCrashRestart(exitCode: Int32)` |
| 1088 | fn | performHealthCheck | (private) | `private func performHealthCheck() async` |
| 1155 | fn | cleanupOrphanProcesses | (private) | `private func cleanupOrphanProcesses() async` |
| 1218 | fn | terminateAuthProcess | (internal) | `func terminateAuthProcess()` |
| 1224 | fn | toggle | (internal) | `func toggle() async throws` |
| 1232 | fn | copyEndpointToClipboard | (internal) | `func copyEndpointToClipboard()` |
| 1237 | fn | revealInFinder | (internal) | `func revealInFinder()` |
| 1244 | enum | ProxyError | (internal) | `enum ProxyError` |
| 1277 | enum | AuthCommand | (internal) | `enum AuthCommand` |
| 1315 | struct | AuthCommandResult | (internal) | `struct AuthCommandResult` |
| 1321 | mod | extension CLIProxyManager | (internal) | - |
| 1322 | fn | runAuthCommand | (internal) | `func runAuthCommand(_ command: AuthCommand) asy...` |
| 1354 | fn | appendOutput | (internal) | `func appendOutput(_ str: String)` |
| 1358 | fn | tryResume | (internal) | `func tryResume() -> Bool` |
| 1369 | fn | safeResume | (internal) | `@Sendable func safeResume(_ result: AuthCommand...` |
| 1469 | mod | extension CLIProxyManager | (internal) | - |
| 1502 | fn | isLegacyAuthWarningNeeded | (internal) | `func isLegacyAuthWarningNeeded(for provider: AI...` |
| 1507 | fn | sourceInstallHint | (internal) | `func sourceInstallHint(for source: ProxyBinaryS...` |
| 1511 | fn | confirmBinarySourceSelection | (internal) | `func confirmBinarySourceSelection(_ source: Pro...` |
| 1521 | fn | isSourceInstalled | (internal) | `func isSourceInstalled(_ source: ProxyBinarySou...` |
| 1565 | fn | checkForUpgrade | (internal) | `func checkForUpgrade() async` |
| 1622 | fn | saveInstalledVersion | (private) | `private func saveInstalledVersion(_ version: St...` |
| 1627 | fn | fetchAvailableVersions | (internal) | `func fetchAvailableVersions(limit: Int = 10) as...` |
| 1639 | fn | fetchAvailableUpstreamVersions | (private) | `private func fetchAvailableUpstreamVersions(lim...` |
| 1666 | fn | versionInfo | (internal) | `func versionInfo(from release: GitHubRelease) -...` |
| 1672 | fn | fetchGitHubRelease | (private) | `private func fetchGitHubRelease(tag: String, so...` |
| 1698 | fn | findCompatibleAsset | (private) | `private func findCompatibleAsset(from release: ...` |
| 1728 | fn | performManagedUpgrade | (internal) | `func performManagedUpgrade(to version: ProxyVer...` |
| 1790 | fn | downloadAndInstallVersion | (private) | `private func downloadAndInstallVersion(_ versio...` |
| 1846 | fn | startDryRun | (private) | `private func startDryRun(version: String, sourc...` |
| 1920 | fn | promote | (private) | `private func promote(version: String, source: P...` |
| 1956 | fn | rollback | (internal) | `func rollback() async throws` |
| 1989 | fn | stopTestProxy | (private) | `private func stopTestProxy() async` |
| 2020 | fn | stopTestProxySync | (private) | `private func stopTestProxySync()` |
| 2048 | fn | findUnusedPort | (private) | `private func findUnusedPort() throws -> UInt16` |
| 2058 | fn | isPortInUse | (private) | `private func isPortInUse(_ port: UInt16) -> Bool` |
| 2077 | fn | createTestConfig | (private) | `private func createTestConfig(port: UInt16, man...` |
| 2105 | fn | cleanupTestConfig | (private) | `private func cleanupTestConfig(_ configPath: St...` |
| 2113 | fn | isNewerVersion | (private) | `private func isNewerVersion(_ newer: String, th...` |
| 2116 | fn | parseVersion | (internal) | `func parseVersion(_ version: String) -> [Int]` |
| 2148 | fn | plusLocalVersionInfo | (private) | `private func plusLocalVersionInfo() -> ProxyVer...` |
| 2162 | fn | installLocalPlusBinary | (private) | `private func installLocalPlusBinary() async thr...` |
| 2169 | fn | findPreviousVersion | (private) | `private func findPreviousVersion() -> String?` |
| 2182 | fn | migrateToVersionedStorage | (internal) | `func migrateToVersionedStorage() async throws` |
| 2208 | fn | initializeSelectedBinarySourceIfNeeded | (private) | `private func initializeSelectedBinarySourceIfNe...` |
| 2218 | fn | defaultBinarySource | (private) | `private func defaultBinarySource() -> ProxyBina...` |
| 2225 | fn | migrateLegacyVersionedStorageIfNeeded | (private) | `private func migrateLegacyVersionedStorageIfNee...` |
| 2253 | fn | resolveBundledPlusBinaryPath | (private) | `private func resolveBundledPlusBinaryPath() -> ...` |
| 2258 | fn | firstExistingRegularFile | (internal) | `func firstExistingRegularFile(in candidates: [U...` |

## Memory Markers

### 🟢 `NOTE` (line 244)

> Bridge mode default is registered in AppDelegate.applicationDidFinishLaunching()

### 🟢 `NOTE` (line 362)

> Changes take effect after proxy restart (CLIProxyAPI does not support live routing API)

### 🟢 `NOTE` (line 1605)

> Notification is handled by AtomFeedUpdateService polling

