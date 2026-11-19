# Design

Where design work starts. Decision contracts in `docs/decisions/` own every
rule; this file holds values and points at the contract that owns each element.

## Values

Source: `app/globals.css` (shadcn preset `b3L1ZiPY0W`). Update this section when that source changes.

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `oklch(1 0 0)` | `oklch(0.148 0.004 228.8)` |
| `--foreground` | `oklch(0.148 0.004 228.8)` | `oklch(0.987 0.002 197.1)` |
| `--primary` | `oklch(0.52 0.105 223.128)` | `oklch(0.45 0.085 224.283)` |
| `--primary-foreground` | `oklch(0.984 0.019 200.873)` | `oklch(0.984 0.019 200.873)` |
| `--muted` | `oklch(0.963 0.002 197.1)` | `oklch(0.275 0.011 216.9)` |
| `--muted-foreground` | `oklch(0.56 0.021 213.5)` | `oklch(0.723 0.014 214.4)` |
| `--border` | `oklch(0.925 0.005 214.3)` | `oklch(1 0 0 / 10%)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |

Text roles: body `--font-serif` (Noto Serif), headings `--font-heading` (JetBrains Mono).
Radius and spacing: `--radius` `0.625rem`; Tailwind default spacing scale.

## Components

Source: `components/ui/`. Update this section when it changes.

- `Button`

## Rejected patterns

- Custom markup for UI that shadcn already provides → [ui-composition](docs/decisions/ui-composition.md)
- Per-screen arbitrary colors instead of semantic tokens → [ui-composition](docs/decisions/ui-composition.md)
- Bottom floating pill as the only progress indicator → [route-line](docs/decisions/route-line.md)
- Progress shown only as a scrolling vertical rail in the list → [route-line](docs/decisions/route-line.md)

## Map

- General controls, page shell, loading/empty/error states → [ui-composition](docs/decisions/ui-composition.md)
- Trip progress line at the top of the app → [route-line](docs/decisions/route-line.md)
