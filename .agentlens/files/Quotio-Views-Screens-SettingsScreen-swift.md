# Quotio/Views/Screens/SettingsScreen.swift

[← Back to Module](../modules/Quotio-Views-Screens/MODULE.md) | [← Back to INDEX](../INDEX.md)

## Overview

- **Lines:** 2694
- **Language:** Swift
- **Symbols:** 57
- **Public symbols:** 0

## Symbol Table

| Line | Kind | Name | Visibility | Signature |
| ---- | ---- | ---- | ---------- | --------- |
| 10 | struct | SettingsScreen | (internal) | `struct SettingsScreen` |
| 103 | struct | OperatingModeSection | (internal) | `struct OperatingModeSection` |
| 168 | fn | handleModeSelection | (private) | `private func handleModeSelection(_ mode: Operat...` |
| 187 | fn | switchToMode | (private) | `private func switchToMode(_ mode: OperatingMode)` |
| 202 | struct | RemoteServerSection | (internal) | `struct RemoteServerSection` |
| 323 | fn | saveRemoteConfig | (private) | `private func saveRemoteConfig(_ config: RemoteC...` |
| 331 | fn | reconnect | (private) | `private func reconnect()` |
| 346 | struct | UnifiedProxySettingsSection | (internal) | `struct UnifiedProxySettingsSection` |
| 557 | fn | loadConfig | (private) | `private func loadConfig() async` |
| 588 | fn | saveProxyURL | (private) | `private func saveProxyURL() async` |
| 601 | fn | saveRoutingStrategy | (private) | `private func saveRoutingStrategy(_ strategy: St...` |
| 610 | fn | saveSwitchProject | (private) | `private func saveSwitchProject(_ enabled: Bool)...` |
| 619 | fn | saveSwitchPreviewModel | (private) | `private func saveSwitchPreviewModel(_ enabled: ...` |
| 628 | fn | saveRequestRetry | (private) | `private func saveRequestRetry(_ count: Int) async` |
| 637 | fn | saveMaxRetryInterval | (private) | `private func saveMaxRetryInterval(_ seconds: In...` |
| 646 | fn | saveLoggingToFile | (private) | `private func saveLoggingToFile(_ enabled: Bool)...` |
| 655 | fn | saveRequestLog | (private) | `private func saveRequestLog(_ enabled: Bool) async` |
| 664 | fn | saveDebugMode | (private) | `private func saveDebugMode(_ enabled: Bool) async` |
| 677 | struct | LocalProxyServerSection | (internal) | `struct LocalProxyServerSection` |
| 729 | struct | LocalPathsSection | (internal) | `struct LocalPathsSection` |
| 753 | struct | PathLabel | (internal) | `struct PathLabel` |
| 777 | struct | NotificationSettingsSection | (internal) | `struct NotificationSettingsSection` |
| 847 | struct | QuotaDisplaySettingsSection | (internal) | `struct QuotaDisplaySettingsSection` |
| 875 | struct | RefreshCadenceSettingsSection | (internal) | `struct RefreshCadenceSettingsSection` |
| 914 | struct | UpdateSettingsSection | (internal) | `struct UpdateSettingsSection` |
| 956 | struct | ProxyUpdateSettingsSection | (internal) | `struct ProxyUpdateSettingsSection` |
| 1086 | fn | checkForUpdate | (private) | `private func checkForUpdate()` |
| 1096 | fn | performUpgrade | (private) | `private func performUpgrade(to version: ProxyVe...` |
| 1115 | struct | ProxyVersionManagerSheet | (internal) | `struct ProxyVersionManagerSheet` |
| 1274 | fn | sectionHeader | (private) | `@ViewBuilder   private func sectionHeader(_ tit...` |
| 1289 | fn | isVersionInstalled | (private) | `private func isVersionInstalled(_ version: Stri...` |
| 1293 | fn | refreshInstalledVersions | (private) | `private func refreshInstalledVersions()` |
| 1297 | fn | loadReleases | (private) | `private func loadReleases() async` |
| 1311 | fn | installVersion | (private) | `private func installVersion(_ release: GitHubRe...` |
| 1329 | fn | performInstall | (private) | `private func performInstall(_ release: GitHubRe...` |
| 1350 | fn | activateVersion | (private) | `private func activateVersion(_ version: String)` |
| 1368 | fn | deleteVersion | (private) | `private func deleteVersion(_ version: String)` |
| 1381 | struct | InstalledVersionRow | (private) | `struct InstalledVersionRow` |
| 1439 | struct | AvailableVersionRow | (private) | `struct AvailableVersionRow` |
| 1525 | fn | formatDate | (private) | `private func formatDate(_ isoString: String) ->...` |
| 1543 | struct | MenuBarSettingsSection | (internal) | `struct MenuBarSettingsSection` |
| 1625 | struct | AppearanceSettingsSection | (internal) | `struct AppearanceSettingsSection` |
| 1654 | struct | PrivacySettingsSection | (internal) | `struct PrivacySettingsSection` |
| 1676 | struct | GeneralSettingsTab | (internal) | `struct GeneralSettingsTab` |
| 1727 | struct | AboutTab | (internal) | `struct AboutTab` |
| 1754 | struct | AboutScreen | (internal) | `struct AboutScreen` |
| 1969 | struct | AboutUpdateSection | (internal) | `struct AboutUpdateSection` |
| 2025 | struct | AboutProxyUpdateSection | (internal) | `struct AboutProxyUpdateSection` |
| 2161 | fn | checkForUpdate | (private) | `private func checkForUpdate()` |
| 2171 | fn | performUpgrade | (private) | `private func performUpgrade(to version: ProxyVe...` |
| 2190 | struct | VersionBadge | (internal) | `struct VersionBadge` |
| 2242 | struct | AboutUpdateCard | (internal) | `struct AboutUpdateCard` |
| 2333 | struct | AboutProxyUpdateCard | (internal) | `struct AboutProxyUpdateCard` |
| 2490 | fn | checkForUpdate | (private) | `private func checkForUpdate()` |
| 2500 | fn | performUpgrade | (private) | `private func performUpgrade(to version: ProxyVe...` |
| 2519 | struct | LinkCard | (internal) | `struct LinkCard` |
| 2606 | struct | ManagementKeyRow | (internal) | `struct ManagementKeyRow` |

