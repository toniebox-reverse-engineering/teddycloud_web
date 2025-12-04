import { useEffect, useReducer } from "react";

export type LabelShape = "round" | "square";
export type PaperSize = "A4" | "A5" | "Letter" | "Custom";
export type PrintMode = "ImageAndText" | "OnlyImage" | "OnlyText";

export interface SettingsState {
    diameter: string;
    labelShape: LabelShape;
    printMode: PrintMode;
    width: string;
    height: string;
    labelSpacingX: string;
    labelSpacingY: string;
    labelBackgroundColor: string;

    paperSize: PaperSize;
    customPaperWidth: string;
    customPaperHeight: string;
    paperMarginTop: string;
    paperMarginLeft: string;
    paperLabelImageBleed: string;

    textFontSize: string;
    showLanguageFlag: boolean;
    showModelNo: boolean;
    printTrackListInsteadTitle: boolean;
    showLabelBorder: boolean;

    selectedPaper?: string;
}

interface PaperPreset {
    label: string;
    marginTop: string;
    marginLeft: string;
    imageBleed: string;
    spacingX: string;
    spacingY: string;
    paperFormat: PaperSize;
    labelForm: LabelShape;
    labelBorder: boolean;
}

const PAPER_PRESETS: Record<string, PaperPreset> = {
    avery5080: {
        label: "Avery 5080",
        marginTop: "5mm",
        marginLeft: "8mm",
        imageBleed: "1mm",
        spacingX: "10mm",
        spacingY: "7mm",
        paperFormat: "A4",
        labelForm: "round",
        labelBorder: false,
    },
    averyl3415: {
        label: "Avery L3415 / L7105 / L7780",
        marginTop: "13mm",
        marginLeft: "15mm",
        imageBleed: "1mm",
        spacingX: "6mm",
        spacingY: "6mm",
        paperFormat: "A4",
        labelForm: "round",
        labelBorder: false,
    },
    avery40rnd: {
        label: "Avery 40-RND",
        marginTop: "13mm",
        marginLeft: "15mm",
        imageBleed: "1mm",
        spacingX: "6mm",
        spacingY: "6mm",
        paperFormat: "A4",
        labelForm: "round",
        labelBorder: false,
    },
    avery5160: {
        label: "Avery 5160",
        marginTop: "5mm",
        marginLeft: "8mm",
        imageBleed: "1mm",
        spacingY: "8mm",
        spacingX: "12mm",
        paperFormat: "A4",
        labelForm: "square",
        labelBorder: false,
    },
};

const INITIAL_STATE: SettingsState = {
    diameter: "40mm",
    labelShape: "round",
    printMode: "ImageAndText",
    width: "50mm",
    height: "30mm",
    labelSpacingX: "5mm",
    labelSpacingY: "5mm",
    labelBackgroundColor: "#ffffff",

    paperSize: "A4",
    customPaperWidth: "210mm",
    customPaperHeight: "297mm",
    paperMarginTop: "10mm",
    paperMarginLeft: "10mm",
    paperLabelImageBleed: "0mm",

    textFontSize: "14px",
    showLanguageFlag: false,
    showModelNo: false,
    printTrackListInsteadTitle: false,
    showLabelBorder: true,

    selectedPaper: undefined,
};

type Action =
    | { type: "SET"; payload: Partial<SettingsState> }
    | { type: "LOAD"; payload: Partial<SettingsState> }
    | { type: "RESET" }
    | { type: "APPLY_PRESET"; payload: { presetId: string } };

function reducer(state: SettingsState, action: Action): SettingsState {
    switch (action.type) {
        case "SET":
            return { ...state, ...action.payload };
        case "LOAD":
            return {
                ...state,
                ...action.payload,
            };
        case "RESET":
            return { ...INITIAL_STATE };
        case "APPLY_PRESET": {
            const preset = PAPER_PRESETS[action.payload.presetId];
            if (!preset) return state;
            return {
                ...state,
                labelSpacingX: preset.spacingX,
                labelSpacingY: preset.spacingY,
                paperMarginTop: preset.marginTop,
                paperMarginLeft: preset.marginLeft,
                labelShape: preset.labelForm,
                paperSize: preset.paperFormat,
                paperLabelImageBleed: preset.imageBleed,
                showLabelBorder: preset.labelBorder,
                selectedPaper: action.payload.presetId,
            };
        }
        default:
            return state;
    }
}

function getContrastTextColor(bgColor: string): string {
    let r: number, g: number, b: number;
    if (bgColor.startsWith("#")) {
        const hex = bgColor.slice(1);
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (bgColor.startsWith("rgb")) {
        const values = bgColor.match(/\d+/g)?.map(Number);
        if (!values) return "black";
        [r, g, b] = values;
    } else {
        return "black";
    }

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "black" : "white";
}

export interface SettingsActions {
    setDiameter: (v: string) => void;
    setLabelShape: (v: LabelShape) => void;
    setPrintMode: (v: PrintMode) => void;
    setWidth: (v: string) => void;
    setHeight: (v: string) => void;
    setLabelSpacingX: (v: string) => void;
    setLabelSpacingY: (v: string) => void;
    setLabelBackgroundColor: (v: string) => void;
    setPaperSize: (v: PaperSize) => void;
    setCustomPaperWidth: (v: string) => void;
    setCustomPaperHeight: (v: string) => void;
    setPaperMarginTop: (v: string) => void;
    setPaperMarginLeft: (v: string) => void;
    setPaperLabelImageBleed: (v: string) => void;
    setTextFontSize: (v: string) => void;
    setShowLanguageFlag: (v: boolean) => void;
    setShowModelNo: (v: boolean) => void;
    setPrintTrackListInsteadTitle: (v: boolean) => void;
    setShowLabelBorder: (v: boolean) => void;
    setSelectedPaper: (v: string | undefined) => void;
    save: () => void;
    clear: () => void;
    applyPaperPreset: (presetId: string) => void;
}

export interface SettingsHook {
    state: SettingsState;
    textColor: string;
    paperOptions: { label: string; value: string }[];
    actions: SettingsActions;
}

export const useSettings = (): SettingsHook => {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    useEffect(() => {
        const saved = localStorage.getItem("labelSettings");
        if (saved) {
            try {
                const data = JSON.parse(saved);
                dispatch({ type: "LOAD", payload: data });
            } catch {
                // ignore invalid JSON
            }
        }
    }, []);

    const save = () => {
        const toStore = {
            diameter: state.diameter,
            width: state.width,
            height: state.height,
            textFontSize: state.textFontSize,
            labelShape: state.labelShape,
            showLanguageFlag: state.showLanguageFlag,
            showModelNo: state.showModelNo,
            printTrackListInsteadTitle: state.printTrackListInsteadTitle,
            labelSpacingX: state.labelSpacingX,
            labelSpacingY: state.labelSpacingY,
            labelBackgroundColor: state.labelBackgroundColor,
            printMode: state.printMode,
            paperSize: state.paperSize,
            customPaperWidth: state.customPaperWidth,
            customPaperHeight: state.customPaperHeight,
            paperMarginVertical: state.paperMarginTop,
            paperMarginHorizontal: state.paperMarginLeft,
            showLabelBorder: state.showLabelBorder,
            paperLabelImageBleed: state.paperLabelImageBleed,
        };
        localStorage.setItem("labelSettings", JSON.stringify(toStore));
    };

    const clear = () => {
        localStorage.removeItem("labelSettings");
        dispatch({ type: "RESET" });
    };

    const applyPaperPreset = (presetId: string) => {
        dispatch({ type: "APPLY_PRESET", payload: { presetId } });
    };

    const paperOptions = Object.entries(PAPER_PRESETS).map(([value, preset]) => ({
        label: preset.label,
        value,
    }));

    const textColor = getContrastTextColor(state.labelBackgroundColor);

    const actions: SettingsActions = {
        setDiameter: (v) => dispatch({ type: "SET", payload: { diameter: v } }),
        setLabelShape: (v) => dispatch({ type: "SET", payload: { labelShape: v } }),
        setPrintMode: (v) => dispatch({ type: "SET", payload: { printMode: v } }),
        setWidth: (v) => dispatch({ type: "SET", payload: { width: v } }),
        setHeight: (v) => dispatch({ type: "SET", payload: { height: v } }),
        setLabelSpacingX: (v) => dispatch({ type: "SET", payload: { labelSpacingX: v } }),
        setLabelSpacingY: (v) => dispatch({ type: "SET", payload: { labelSpacingY: v } }),
        setLabelBackgroundColor: (v) => dispatch({ type: "SET", payload: { labelBackgroundColor: v } }),
        setPaperSize: (v) => dispatch({ type: "SET", payload: { paperSize: v } }),
        setCustomPaperWidth: (v) => dispatch({ type: "SET", payload: { customPaperWidth: v } }),
        setCustomPaperHeight: (v) => dispatch({ type: "SET", payload: { customPaperHeight: v } }),
        setPaperMarginTop: (v) => dispatch({ type: "SET", payload: { paperMarginTop: v } }),
        setPaperMarginLeft: (v) => dispatch({ type: "SET", payload: { paperMarginLeft: v } }),
        setPaperLabelImageBleed: (v) => dispatch({ type: "SET", payload: { paperLabelImageBleed: v } }),
        setTextFontSize: (v) => dispatch({ type: "SET", payload: { textFontSize: v } }),
        setShowLanguageFlag: (v) => dispatch({ type: "SET", payload: { showLanguageFlag: v } }),
        setShowModelNo: (v) => dispatch({ type: "SET", payload: { showModelNo: v } }),
        setPrintTrackListInsteadTitle: (v) => dispatch({ type: "SET", payload: { printTrackListInsteadTitle: v } }),
        setShowLabelBorder: (v) => dispatch({ type: "SET", payload: { showLabelBorder: v } }),
        setSelectedPaper: (v) => dispatch({ type: "SET", payload: { selectedPaper: v } }),
        save,
        clear,
        applyPaperPreset,
    };

    return { state, textColor, paperOptions, actions };
};
