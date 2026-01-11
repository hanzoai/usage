# Quotio/Services/Proxy/CLIProxyManager.swift

[← Back to Module](../modules/root/MODULE.md) | [← Back to INDEX](../INDEX.md)

## Overview

- **Lines:** 1784
- **Language:** Swift
- **Symbols:** 57
- **Public symbols:** 0

## Symbol Table

| Line | Kind | Name | Visibility | Signature |
| ---- | ---- | ---- | ---------- | --------- |
| 9 | class | CLIProxyManager | (internal) | `class CLIProxyManager` |
| 160 | method | init | (internal) | `init()` |
| 193 | fn | updateConfigPort | (private) | `private func updateConfigPort(_ newPort: UInt16)` |
| 203 | fn | updateConfigLogging | (internal) | `func updateConfigLogging(enabled: Bool)` |
| 216 | fn | updateConfigRoutingStrategy | (internal) | `func updateConfigRoutingStrategy(_ strategy: St...` |
| 226 | fn | updateConfigProxyURL | (internal) | `func updateConfigProxyURL(_ url: String?)` |
| 246 | fn | ensureConfigExists | (private) | `private func ensureConfigExists()` |
| 280 | fn | syncSecretKeyInConfig | (private) | `private func syncSecretKeyInConfig()` |
| 296 | fn | regenerateManagementKey | (internal) | `func regenerateManagementKey() async throws` |
| 327 | fn | syncProxyURLInConfig | (private) | `private func syncProxyURLInConfig()` |
| 340 | fn | syncCustomProvidersToConfig | (private) | `private func syncCustomProvidersToConfig()` |
| 357 | fn | downloadAndInstallBinary | (internal) | `func downloadAndInstallBinary() async throws` |
| 418 | fn | fetchLatestRelease | (private) | `private func fetchLatestRelease() async throws ...` |
| 439 | fn | findCompatibleAsset | (private) | `private func findCompatibleAsset(in release: Re...` |
| 464 | fn | downloadAsset | (private) | `private func downloadAsset(url: String) async t...` |
| 483 | fn | extractAndInstall | (private) | `private func extractAndInstall(data: Data, asse...` |
| 545 | fn | findBinaryInDirectory | (private) | `private func findBinaryInDirectory(_ directory:...` |
| 578 | fn | start | (internal) | `func start() async throws` |
| 710 | fn | stop | (internal) | `func stop()` |
| 766 | fn | startHealthMonitor | (private) | `private func startHealthMonitor()` |
| 780 | fn | stopHealthMonitor | (private) | `private func stopHealthMonitor()` |
| 785 | fn | performHealthCheck | (private) | `private func performHealthCheck() async` |
| 848 | fn | cleanupOrphanProcesses | (private) | `private func cleanupOrphanProcesses() async` |
| 902 | fn | terminateAuthProcess | (internal) | `func terminateAuthProcess()` |
| 908 | fn | toggle | (internal) | `func toggle() async throws` |
| 916 | fn | copyEndpointToClipboard | (internal) | `func copyEndpointToClipboard()` |
| 921 | fn | revealInFinder | (internal) | `func revealInFinder()` |
| 927 | enum | ProxyError | (internal) | `enum ProxyError` |
| 958 | enum | AuthCommand | (internal) | `enum AuthCommand` |
| 996 | struct | AuthCommandResult | (internal) | `struct AuthCommandResult` |
| 1002 | mod | extension CLIProxyManager | (internal) | - |
| 1003 | fn | runAuthCommand | (internal) | `func runAuthCommand(_ command: AuthCommand) asy...` |
| 1035 | fn | appendOutput | (internal) | `func appendOutput(_ str: String)` |
| 1039 | fn | tryResume | (internal) | `func tryResume() -> Bool` |
| 1050 | fn | safeResume | (internal) | `@Sendable func safeResume(_ result: AuthCommand...` |
| 1150 | mod | extension CLIProxyManager | (internal) | - |
| 1179 | fn | checkForUpgrade | (internal) | `func checkForUpgrade() async` |
| 1260 | fn | saveInstalledVersion | (private) | `private func saveInstalledVersion(_ version: St...` |
| 1268 | fn | fetchAvailableReleases | (internal) | `func fetchAvailableReleases(limit: Int = 10) as...` |
| 1290 | fn | versionInfo | (internal) | `func versionInfo(from release: GitHubRelease) -...` |
| 1296 | fn | fetchGitHubRelease | (private) | `private func fetchGitHubRelease(tag: String) as...` |
| 1318 | fn | findCompatibleAsset | (private) | `private func findCompatibleAsset(from release: ...` |
| 1351 | fn | performManagedUpgrade | (internal) | `func performManagedUpgrade(to version: ProxyVer...` |
| 1405 | fn | downloadAndInstallVersion | (private) | `private func downloadAndInstallVersion(_ versio...` |
| 1452 | fn | startDryRun | (private) | `private func startDryRun(version: String) async...` |
| 1523 | fn | promote | (private) | `private func promote(version: String) async throws` |
| 1558 | fn | rollback | (internal) | `func rollback() async throws` |
| 1591 | fn | stopTestProxy | (private) | `private func stopTestProxy() async` |
| 1620 | fn | stopTestProxySync | (private) | `private func stopTestProxySync()` |
| 1646 | fn | findUnusedPort | (private) | `private func findUnusedPort() throws -> UInt16` |
| 1656 | fn | isPortInUse | (private) | `private func isPortInUse(_ port: UInt16) -> Bool` |
| 1675 | fn | createTestConfig | (private) | `private func createTestConfig(port: UInt16) -> ...` |
| 1703 | fn | cleanupTestConfig | (private) | `private func cleanupTestConfig(_ configPath: St...` |
| 1711 | fn | isNewerVersion | (private) | `private func isNewerVersion(_ newer: String, th...` |
| 1714 | fn | parseVersion | (internal) | `func parseVersion(_ version: String) -> [Int]` |
| 1746 | fn | findPreviousVersion | (private) | `private func findPreviousVersion() -> String?` |
| 1759 | fn | migrateToVersionedStorage | (internal) | `func migrateToVersionedStorage() async throws` |

## Memory Markers

### 🟢 `NOTE` (line 186)

> Bridge mode default is registered in AppDelegate.applicationDidFinishLaunching()

### 🟢 `NOTE` (line 215)

> Changes take effect after proxy restart (CLIProxyAPI does not support live routing API)

