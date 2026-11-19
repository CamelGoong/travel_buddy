# Design

Where design work starts. Decision contracts in `docs/decisions/` own every
rule; this file holds values and points at the contract that owns each element.

## Values

Source: `app/globals.css` (pastel glass theme, see [visual-theme](docs/decisions/visual-theme.md)). Update this section when that source changes.

| Token | Light |
| --- | --- |
| `--background` | `oklch(0.96 0.03 305)` under a pink to lilac to sky gradient with two blurred colour blobs |
| `--foreground` | `oklch(0.27 0.06 295)` |
| `--card` | `oklch(1 0 0 / 0.58)` with `backdrop-blur-xl` and a white border |
| `--primary` | `oklch(0.5 0.22 285)`; buttons use the gradient `--primary-from` `#6d4fe8` to `--primary-to` `#2f6be0` |
| `--primary-foreground` | `oklch(0.99 0.005 295)` |
| `--muted` | `oklch(0.96 0.02 295 / 0.7)` |
| `--muted-foreground` | `oklch(0.44 0.05 295)` |
| `--border` | `oklch(0.75 0.06 295 / 0.35)` |
| `--destructive` | `oklch(0.52 0.22 27)` |

No dark palette is in use. Text role: one Korean sans (`--font-korean`, Noto Sans KR) for body and headings, headings in weight 800.
Radius and spacing: `--radius` `0.75rem`; cards use the largest radius; Tailwind default spacing scale.

## Components

Source: `components/ui/`. Update this section when it changes.

- `Alert`
- `Badge`
- `Button`
- `Card`
- `Checkbox`
- `Field`
- `Input`
- `Label`
- `Separator`

## Rejected patterns

- Custom markup for UI that shadcn already provides → [ui-composition](docs/decisions/ui-composition.md)
- Per-screen arbitrary colors instead of semantic tokens → [ui-composition](docs/decisions/ui-composition.md)
- Opaque white or dark single-color backgrounds, or text on a glass surface below 4.5:1 contrast → [visual-theme](docs/decisions/visual-theme.md)
- Bottom floating pill as the only progress indicator → [route-line](docs/decisions/route-line.md)
- Progress shown only as a scrolling vertical rail in the list → [route-line](docs/decisions/route-line.md)
- Proactive suggestion shown first as a full card that takes over the screen → [suggestion-nudge](docs/decisions/suggestion-nudge.md)
- Bottom speech bubble that collapses into a dot for proactive suggestions → [suggestion-nudge](docs/decisions/suggestion-nudge.md)

## Map

- General controls, page shell, loading/empty/error states → [ui-composition](docs/decisions/ui-composition.md)
- App-wide look: background, glass surfaces, colors, shapes, fonts → [visual-theme](docs/decisions/visual-theme.md)
- Trip progress line at the top of the app → [route-line](docs/decisions/route-line.md)
- Proactive suggestion island under the route line → [suggestion-nudge](docs/decisions/suggestion-nudge.md)
