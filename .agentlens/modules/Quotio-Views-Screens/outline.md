# Outline

[← Back to MODULE](MODULE.md) | [← Back to INDEX](../../INDEX.md)

Symbol maps for 5 large files in this module.

## Quotio/Views/Screens/DashboardScreen.swift (915 lines)

| Line | Kind | Name | Visibility |
| ---- | ---- | ---- | ---------- |
| 9 | struct | DashboardScreen | (internal) |
| 560 | fn | handleStepAction | (private) |
| 571 | fn | showProviderPicker | (private) |
| 595 | fn | showAgentPicker | (private) |
| 709 | struct | GettingStartedStep | (internal) |
| 718 | struct | GettingStartedStepRow | (internal) |
| 773 | struct | KPICard | (internal) |
| 801 | struct | ProviderChip | (internal) |
| 825 | struct | FlowLayout | (internal) |
| 839 | fn | layout | (private) |
| 867 | struct | QuotaProviderRow | (internal) |

## Quotio/Views/Screens/FallbackScreen.swift (531 lines)

| Line | Kind | Name | Visibility |
| ---- | ---- | ---- | ---------- |
| 8 | struct | FallbackScreen | (internal) |
| 103 | fn | loadModelsIfNeeded | (private) |
| 317 | struct | VirtualModelsEmptyState | (internal) |
| 359 | struct | VirtualModelRow | (internal) |
| 477 | struct | FallbackEntryRow | (internal) |

## Quotio/Views/Screens/ProvidersScreen.swift (916 lines)

| Line | Kind | Name | Visibility |
| ---- | ---- | ---- | ---------- |
| 16 | struct | ProvidersScreen | (internal) |
| 338 | fn | handleAddProvider | (private) |
| 353 | fn | deleteAccount | (private) |
| 374 | fn | handleEditGlmAccount | (private) |
| 382 | fn | syncCustomProvidersToConfig | (private) |
| 392 | struct | CustomProviderRow | (internal) |
| 493 | struct | MenuBarBadge | (internal) |
| 516 | class | TooltipWindow | (private) |
| 528 | method | init | (private) |
| 558 | fn | show | (internal) |
| 587 | fn | hide | (internal) |
| 593 | class | TooltipTrackingView | (private) |
| 595 | fn | updateTrackingAreas | (internal) |
| 606 | fn | mouseEntered | (internal) |
| 610 | fn | mouseExited | (internal) |
| 614 | fn | hitTest | (internal) |
| 620 | struct | NativeTooltipView | (private) |
| 622 | fn | makeNSView | (internal) |
| 628 | fn | updateNSView | (internal) |
| 634 | mod | extension View | (private) |
| 635 | fn | nativeTooltip | (internal) |
| 642 | struct | MenuBarHintView | (internal) |
| 657 | struct | OAuthSheet | (internal) |
| 783 | struct | OAuthStatusView | (private) |

## Quotio/Views/Screens/QuotaScreen.swift (1246 lines)

| Line | Kind | Name | Visibility |
| ---- | ---- | ---- | ---------- |
| 10 | struct | QuotaScreen | (internal) |
| 38 | fn | accountCount | (private) |
| 57 | fn | lowestQuotaPercent | (private) |
| 179 | struct | ProviderSegmentButton | (private) |
| 240 | struct | QuotaStatusDot | (private) |
| 259 | struct | ProviderQuotaView | (private) |
| 340 | struct | AccountInfo | (private) |
| 352 | struct | AccountQuotaCardV2 | (private) |
| 704 | struct | PlanBadgeV2Compact | (private) |
| 758 | struct | PlanBadgeV2 | (private) |
| 823 | struct | SubscriptionBadgeV2 | (private) |
| 864 | struct | AntigravityDisplayGroup | (private) |
| 874 | struct | AntigravityGroupRow | (private) |
| 971 | struct | AntigravityModelsDetailSheet | (private) |
| 1033 | struct | ModelDetailCard | (private) |
| 1103 | struct | UsageRowV2 | (private) |
| 1212 | struct | QuotaLoadingView | (private) |

## Quotio/Views/Screens/SettingsScreen.swift (2694 lines)

| Line | Kind | Name | Visibility |
| ---- | ---- | ---- | ---------- |
| 10 | struct | SettingsScreen | (internal) |
| 103 | struct | OperatingModeSection | (internal) |
| 168 | fn | handleModeSelection | (private) |
| 187 | fn | switchToMode | (private) |
| 202 | struct | RemoteServerSection | (internal) |
| 323 | fn | saveRemoteConfig | (private) |
| 331 | fn | reconnect | (private) |
| 346 | struct | UnifiedProxySettingsSection | (internal) |
| 557 | fn | loadConfig | (private) |
| 588 | fn | saveProxyURL | (private) |
| 601 | fn | saveRoutingStrategy | (private) |
| 610 | fn | saveSwitchProject | (private) |
| 619 | fn | saveSwitchPreviewModel | (private) |
| 628 | fn | saveRequestRetry | (private) |
| 637 | fn | saveMaxRetryInterval | (private) |
| 646 | fn | saveLoggingToFile | (private) |
| 655 | fn | saveRequestLog | (private) |
| 664 | fn | saveDebugMode | (private) |
| 677 | struct | LocalProxyServerSection | (internal) |
| 729 | struct | LocalPathsSection | (internal) |
| 753 | struct | PathLabel | (internal) |
| 777 | struct | NotificationSettingsSection | (internal) |
| 847 | struct | QuotaDisplaySettingsSection | (internal) |
| 875 | struct | RefreshCadenceSettingsSection | (internal) |
| 914 | struct | UpdateSettingsSection | (internal) |
| 956 | struct | ProxyUpdateSettingsSection | (internal) |
| 1086 | fn | checkForUpdate | (private) |
| 1096 | fn | performUpgrade | (private) |
| 1115 | struct | ProxyVersionManagerSheet | (internal) |
| 1274 | fn | sectionHeader | (private) |
| 1289 | fn | isVersionInstalled | (private) |
| 1293 | fn | refreshInstalledVersions | (private) |
| 1297 | fn | loadReleases | (private) |
| 1311 | fn | installVersion | (private) |
| 1329 | fn | performInstall | (private) |
| 1350 | fn | activateVersion | (private) |
| 1368 | fn | deleteVersion | (private) |
| 1381 | struct | InstalledVersionRow | (private) |
| 1439 | struct | AvailableVersionRow | (private) |
| 1525 | fn | formatDate | (private) |
| 1543 | struct | MenuBarSettingsSection | (internal) |
| 1625 | struct | AppearanceSettingsSection | (internal) |
| 1654 | struct | PrivacySettingsSection | (internal) |
| 1676 | struct | GeneralSettingsTab | (internal) |
| 1727 | struct | AboutTab | (internal) |
| 1754 | struct | AboutScreen | (internal) |
| 1969 | struct | AboutUpdateSection | (internal) |
| 2025 | struct | AboutProxyUpdateSection | (internal) |
| 2161 | fn | checkForUpdate | (private) |
| 2171 | fn | performUpgrade | (private) |
| 2190 | struct | VersionBadge | (internal) |
| 2242 | struct | AboutUpdateCard | (internal) |
| 2333 | struct | AboutProxyUpdateCard | (internal) |
| 2490 | fn | checkForUpdate | (private) |
| 2500 | fn | performUpgrade | (private) |
| 2519 | struct | LinkCard | (internal) |
| 2606 | struct | ManagementKeyRow | (internal) |

