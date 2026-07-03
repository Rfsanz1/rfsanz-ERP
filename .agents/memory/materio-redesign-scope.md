---
name: Materio redesign scope
description: What "redesign to match Materio template" actually requires, and how to verify progress against the real template rather than assuming.
---

When a user asks to make an app "match" or "look like" a specific template (e.g. ThemeSelection Materio), there are two very different levels of work:

1. **Token-level reskin** (fast, global): swap primary/secondary/background/surface color hex values across the theme file + CSS variables + any hardcoded hex. This propagates everywhere immediately because most apps centralize colors in a theme object, but it only changes the palette — not the actual visual structure.
2. **Structural/component-level match** (slow, per-component): rebuilding the topbar (search bar with shortcut badge, dark mode toggle, avatar w/ status dot), stat/KPI cards (solid-color square icon avatars + trend chip, not soft pastel circles), sidebar (badges, grouping style), button gradients, etc. This requires touching each shared layout component individually.

**Why:** After doing only the token-level reskin, asking "does this match now?" and answering honestly required fetching the real live demo (via demos.themeselection.com or the GitHub README's screenshot embed, since Vercel deployment URLs frequently 404) and doing a side-by-side visual comparison — the color match alone was not sufficient to claim "matches Materio."

**How to apply:** When asked to redesign towards a specific template, do not declare success after a palette/token pass. Explicitly separate "colors migrated" from "layout/component structure migrated," fetch a real reference screenshot to compare against, and ask the user whether they want the deeper structural pass before claiming completion.
