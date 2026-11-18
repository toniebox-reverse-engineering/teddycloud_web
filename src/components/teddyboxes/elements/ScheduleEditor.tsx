import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Input, Select, theme } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import { TeddyBoxScheduleEntry } from "../../../utils/teddybox/schedule";

const { useToken } = theme;

interface ScheduleEditorProps {
    value: TeddyBoxScheduleEntry[];
    shelves: { id: string; label: string }[];
    onChange: (value: TeddyBoxScheduleEntry[]) => void;
}

/** Times of day with the collection the TeddyBox switches to by itself ("from 18:00: Evening"). */
export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ value, shelves, onChange }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const change = (index: number, patch: Partial<TeddyBoxScheduleEntry>) =>
        onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));

    return (
        <Flex vertical gap={8}>
            {value.map((entry, index) => (
                <Flex key={index} gap={8} align="center">
                    <span style={{ color: token.colorTextSecondary, flex: "none" }}>
                        {t("teddybox.schedule.from")}
                    </span>
                    {/* the native time field gives phones their own time picker */}
                    <Input
                        type="time"
                        value={entry.time}
                        aria-label={t("teddybox.schedule.time")}
                        style={{ width: "auto", flex: "none" }}
                        onChange={(e) => change(index, { time: e.target.value })}
                    />
                    <Select
                        style={{ flex: 1, minWidth: 0 }}
                        value={entry.shelf}
                        aria-label={t("teddybox.schedule.shelf")}
                        options={shelves.map((shelf) => ({ value: shelf.id, label: shelf.label }))}
                        onChange={(shelf) => change(index, { shelf })}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={t("teddybox.schedule.remove")}
                        onClick={() => onChange(value.filter((_, i) => i !== index))}
                    />
                </Flex>
            ))}
            <Button
                icon={<PlusOutlined />}
                style={{ alignSelf: "flex-start" }}
                onClick={() =>
                    onChange([
                        ...value,
                        {
                            // a second entry is usually the evening
                            time: value.length ? "18:00" : "07:00",
                            shelf: shelves[Math.min(value.length, shelves.length - 1)]?.id ?? "",
                        },
                    ])
                }
            >
                {t("teddybox.schedule.add")}
            </Button>
        </Flex>
    );
};
