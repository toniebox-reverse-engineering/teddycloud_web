import React from "react";
import { useTranslation } from "react-i18next";
import { Popover, theme } from "antd";
import { WarningOutlined } from "@ant-design/icons";

const { useToken } = theme;

interface HiddenWarningProps {
    title: string;
    text: string;
    style?: React.CSSProperties;
}

/**
 * Warning triangle for tonies the child does not see. A click (or tap) explains the problem;
 * a popover instead of a tooltip, because tooltips do not work on touch devices.
 */
export const HiddenWarning: React.FC<HiddenWarningProps> = ({ title, text, style }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    return (
        <Popover
            trigger="click"
            title={title}
            content={<div style={{ maxWidth: 320 }}>{text}</div>}
        >
            <WarningOutlined
                role="button"
                tabIndex={0}
                aria-label={t("teddybox.edit.hiddenShort")}
                // inside a collapse header the click must not open or close the collection
                onClick={(e) => e.stopPropagation()}
                style={{ color: token.colorWarning, cursor: "pointer", ...style }}
            />
        </Popover>
    );
};
