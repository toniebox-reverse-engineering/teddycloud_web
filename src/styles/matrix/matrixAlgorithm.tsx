import { theme } from "antd";
import { SeedToken } from "antd/es/theme/internal";

const { defaultAlgorithm } = theme;

export const matrixAlgorithm = (seedToken: SeedToken) => {
    const base = defaultAlgorithm(seedToken);

    return {
        ...base,
        // Matrix color scheme
        colorPrimary: "#00ff00",
        colorSuccess: "#00cc66",
        colorWarning: "#ccff00",
        colorError: "#ff0033",
        colorInfo: "#00e6e6",

        // Backgrounds
        colorBgBase: "#000000",
        colorBgContainer: "#0d0d0d",
        colorBgElevated: "#1a1a1a",
        colorBgLayout: "#000000",
        colorFillSecondary: "#003300",

        // Text colors
        colorTextBase: "#00ff00",
        colorText: "#00ff00",
        colorTextSecondary: "#66ff66",
        colorTextPlaceholder: "#339966",
        colorTextDisabled: "#339933",
        colorTextDescription: "#009900",

        // Borders & outlines
        colorBorder: "#009900",
        colorBorderSecondary: "#006600",
        controlOutline: "#00ff99",

        // Interactive states
        colorPrimaryHover: "#33ff33",
        colorPrimaryActive: "#00cc00",
        controlItemBgActive: "#003300",
        colorIcon: "#00ff00 !important",
        colorIconHover: "#66ff66 !important",

        colorSuccessBg: "#003300",
        colorSuccessBorder: "#00ff00",
        colorSuccessText: "#00ff00",

        colorErrorBg: "#330000",
        colorErrorBorder: "#ff0033",
        colorErrorText: "#ff0033",

        colorWarningBg: "#333300",
        colorWarningBorder: "#ccff00",
        colorWarningText: "#ccff00",

        colorInfoBg: "#002b2b",
        colorInfoBorder: "#00e6e6",
        colorInfoText: "#00e6e6",

        colorStepIcon: "#00ff00",
        colorStepIconFinish: "#00cc00",
        colorStepIconHover: "#66ff66",
        colorStepIconInactive: "#004400",
        colorStepTitleActive: "#00ff00",
        colorStepTitleFinish: "#00cc00",
        colorStepTitleInactive: "#004400",
        colorSplit: "#006600",

        colorLink: "#00cc99",
        colorLinkHover: "#00d4bf",
        colorLinkActive: "#009988",

        colorTextLightSolid: "#00ff00",

        controlItemBgHover: "#004400",
        controlItemColorActive: "#00ff00",

        colorFillAlter: "#002200",

        fontFamily: `'Courier New', Courier, monospace`,
        fontSize: 12,
        fontSizeSM: 10,
        fontSizeLG: 14,
        fontSizeXL: 16,
        fontSizeHeading1: 36,
        fontSizeHeading2: 28,
        fontSizeHeading3: 22,
        fontSizeHeading4: 18,
        fontSizeHeading5: 14,

        lineHeight: 1.4,
    };
};
