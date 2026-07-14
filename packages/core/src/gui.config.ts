// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// The @hanzo/gui v5 config `panel.tsx` is authored against. `createGui` with the
// shared `@hanzogui/config/v5` default enables the shorthand style props
// (bg/p/px/py/items/justify/rounded/minW/…) and tokens ($color11/$4/…) the panel
// uses; `Conf` feeds the type augmentation in `gui.d.ts` so `tsc` type-checks them
// EXACTLY as the consuming app (console) does. Build/type-check only — no entry
// point imports it, so it is never loaded at runtime.
import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

export const config = createGui(defaultConfig)

export type Conf = typeof config
