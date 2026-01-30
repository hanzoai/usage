# Memory

[← Back to MODULE](MODULE.md) | [← Back to INDEX](../../INDEX.md)

## Summary

| High 🔴 | Medium 🟡 | Low 🟢 |
| 0 | 0 | 11 |

## 🟢 Low Priority

### `NOTE` (Quotio/Services/Proxy/CLIProxyManager.swift:207)

> Bridge mode default is registered in AppDelegate.applicationDidFinishLaunching()

### `NOTE` (Quotio/Services/Proxy/CLIProxyManager.swift:297)

> Changes take effect after proxy restart (CLIProxyAPI does not support live routing API)

### `NOTE` (Quotio/Services/Proxy/CLIProxyManager.swift:1287)

> Notification is handled by AtomFeedUpdateService polling

### `NOTE` (Quotio/ViewModels/AgentSetupViewModel.swift:495)

> Actual fallback resolution happens at request time in ProxyBridge

### `NOTE` (Quotio/ViewModels/QuotaViewModel.swift:236)

> checkForProxyUpgrade() is now called inside startProxy()

### `NOTE` (Quotio/ViewModels/QuotaViewModel.swift:309)

> Cursor and Trae are NOT auto-refreshed - user must use "Scan for IDEs" (issue #29)

### `NOTE` (Quotio/ViewModels/QuotaViewModel.swift:317)

> Cursor and Trae removed from auto-refresh to address privacy concerns (issue #29)

### `NOTE` (Quotio/ViewModels/QuotaViewModel.swift:1124)

> Cursor and Trae removed from auto-refresh (issue #29)

### `NOTE` (Quotio/ViewModels/QuotaViewModel.swift:1146)

> Cursor and Trae require explicit user scan (issue #29)

### `NOTE` (Quotio/ViewModels/QuotaViewModel.swift:1155)

> Cursor and Trae removed - require explicit scan (issue #29)

### `NOTE` (Quotio/ViewModels/QuotaViewModel.swift:1209)

> Don't call detectActiveAccount() here - already set by switch operation

