/**
 * Curated font catalog for TeddyStudio labels.
 *
 * The `value` is the literal CSS font-family string used in style rules
 * (so it can be applied directly without a lookup). System web-safe values
 * resolve via the OS; bundled families are declared in
 * `../styles/fonts.css` as `@font-face` rules pointing at woff2 assets in
 * `../styles/fonts/` — see `../styles/fonts/LICENSES.md` for attribution.
 *
 * Defaults to "sans-serif" so that users who never open the picker get
 * exactly the same rendering as before this feature landed.
 */
export interface LabelFontOption {
    value: string;
    label: string;
    bundled: boolean;
}

export const DEFAULT_LABEL_FONT_FAMILY = "sans-serif";

export const LABEL_FONT_OPTIONS: LabelFontOption[] = [
    // System web-safe (no bundled assets)
    { value: "sans-serif", label: "Sans-serif (system default)", bundled: false },
    { value: "serif", label: "Serif (system default)", bundled: false },
    { value: '"Comic Sans MS", "Comic Sans", cursive', label: "Comic Sans MS", bundled: false },
    { value: '"Courier New", Courier, monospace', label: "Courier New", bundled: false },

    // Bundled OFL Google Fonts
    { value: '"Atkinson Hyperlegible", sans-serif', label: "Atkinson Hyperlegible", bundled: true },
    { value: '"Fredoka", sans-serif', label: "Fredoka", bundled: true },
    { value: '"Bubblegum Sans", cursive', label: "Bubblegum Sans", bundled: true },
    { value: '"Patrick Hand", cursive', label: "Patrick Hand", bundled: true },
    { value: '"Indie Flower", cursive', label: "Indie Flower", bundled: true },
    { value: '"Schoolbell", cursive', label: "Schoolbell", bundled: true },
];
