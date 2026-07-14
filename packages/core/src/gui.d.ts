// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// Registers the @hanzo/gui v5 config (`gui.config.ts`) with the type system so
// shorthand style props (bg/p/px/py/items/justify/rounded/minW/…) and tokens
// ($color11/$4/…) type-check in `panel.tsx` EXACTLY as they do in the consuming app
// (console) — same source of truth as console's / @hanzo/ui's `gui.d.ts`.
import type { Conf } from './gui.config'

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
