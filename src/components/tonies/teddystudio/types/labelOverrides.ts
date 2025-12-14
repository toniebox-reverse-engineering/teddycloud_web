import type { SettingsState } from "../hooks/useSettings";

export type LocalLabelSettings = Pick<
    SettingsState,
    | "labelBackgroundColor"
    | "textFontSize"
    | "imagePosition"
    | "showLanguageFlag"
    | "showModelNo"
    | "showSeriesOnImageLabel"
    | "seriesOnImageLabelRotationDeg"
    | "seriesOnImageLabelFontSize"
    | "printTrackListInsteadTitle"
    | "contentPadding"
>;

export type LabelOverrides = Partial<LocalLabelSettings>;
export type LabelOverridesById = Record<string, LabelOverrides>;

export const buildEffectiveSettings = (global: SettingsState, override?: LabelOverrides): SettingsState => {
    if (!override) return global;
    return { ...global, ...override };
};
