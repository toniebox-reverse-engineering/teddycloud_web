import React from "react";
import { Select, Tooltip } from "antd";
import type { SelectProps } from "antd";
import { useTranslation } from "react-i18next";

const { Option } = Select;

type TonieBoxContentDir = [string, string[], string];

interface TonieboxOverlaySelectProps {
    tonieBoxContentDirs: TonieBoxContentDir[];
    overlay: string | null;
    onChange: (value: string) => void;

    selectId?: string;

    selectProps?: SelectProps<string>;
}

export const TonieboxOverlaySelect: React.FC<TonieboxOverlaySelectProps> = ({
    tonieBoxContentDirs,
    overlay,
    onChange,
    selectId = "contentDirectorySelect",
    selectProps,
}) => {
    const { t } = useTranslation();

    if (!tonieBoxContentDirs || tonieBoxContentDirs.length <= 1) {
        return null;
    }

    const select = (
        <Tooltip title={t("tonies.content.showToniesOfBoxes")}>
            <Select id={selectId} value={overlay ?? ""} defaultValue="" onChange={onChange} {...selectProps}>
                {tonieBoxContentDirs.map(([contentDir, boxNames, boxId]) => (
                    <Option key={boxId} value={boxId}>
                        {boxNames.join(", ")}
                    </Option>
                ))}
            </Select>
        </Tooltip>
    );

    return select;
};
