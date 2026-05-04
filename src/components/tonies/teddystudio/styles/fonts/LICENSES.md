# Bundled Fonts — License Notices

The fonts below are bundled locally in this directory so that TeddyStudio
labels render with the chosen typeface even when offline (e.g. when printing
without an internet connection). The web-safe families (`sans-serif`, `serif`,
`Comic Sans MS`, `Courier New`) are not bundled — they fall back to whatever
the operating system / browser provides.

All bundled families are licensed under the **SIL Open Font License v1.1**
(OFL-1.1, https://openfontlicense.org/). Full per-family license text is
distributed with the upstream font projects on Google Fonts:

| Font family | Subsets bundled | Upstream | License |
|---|---|---|---|
| Atkinson Hyperlegible | latin, latin-ext | Braille Institute of America | OFL-1.1 |
| Fredoka | latin, latin-ext | Milena Brandao / Hafontia | OFL-1.1 |
| Bubblegum Sans | latin, latin-ext | Angelina Maria Castro / Sudtipos | OFL-1.1 |
| Patrick Hand | latin, latin-ext | Patrick Wagesreiter | OFL-1.1 |
| Indie Flower | latin, latin-ext | Kimberly Geswein | OFL-1.1 |
| Schoolbell | latin | Font Diner / Sideshow | OFL-1.1 |

Files are weight 400, normal style, fetched from Google Fonts'
`fonts.gstatic.com` CDN as woff2. We did not modify the binaries.

## SIL Open Font License v1.1 — Permissions Summary

The OFL permits free use, modification, and redistribution of the fonts —
including bundling with applications — provided that:

1. The fonts are not sold by themselves.
2. Modified versions don't use the original Reserved Font Names.
3. The license and copyright notice are included with any redistribution.

The full license text is available at https://openfontlicense.org/ and is
embedded inside each upstream font binary's `name` table (entry 13).

## Removing or replacing a font

To remove a font, delete the corresponding `*.woff2` files from this
directory and remove its `@font-face` block in `../fonts.css` and its
option in `src/components/tonies/teddystudio/settingspanel/SettingsPanel.tsx`.
