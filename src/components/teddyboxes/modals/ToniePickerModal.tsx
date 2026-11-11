import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Empty, Flex, Input, Modal, Typography, theme } from "antd";
import { CheckCircleFilled, SearchOutlined } from "@ant-design/icons";

import { TonieCardProps } from "../../../types/tonieTypes";
import { compareTonies, tonieLabel } from "../../../utils/teddybox/tonieNames";
import { TonieFigure } from "../../teddybox/graphics/TonieFigure";

const { Text } = Typography;
const { useToken } = theme;

interface ToniePickerModalProps {
    /** Tonies that can be played. */
    tonies: TonieCardProps[];
    /** Tonies already in the collection; shown, but cannot be picked again. */
    taken: string[];
    /** How many more fit the display of the collection. */
    room: number;
    onAdd: (ruids: string[]) => void;
    onClose: () => void;
}

/**
 * Picks tonies for a collection by tapping their pictures: large tiles instead of a dropdown,
 * named tonies first, with a search for long lists. Tonies are added in the order they are
 * tapped.
 */
export const ToniePickerModal: React.FC<ToniePickerModalProps> = ({
    tonies,
    taken,
    room,
    onAdd,
    onClose,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [query, setQuery] = useState("");
    const [picked, setPicked] = useState<string[]>([]);

    const shown = useMemo(() => {
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        return [...tonies].sort(compareTonies).filter((tonie) => {
            const text = `${tonieLabel(tonie)} ${tonie.ruid}`.toLowerCase();
            return words.every((word) => text.includes(word));
        });
    }, [tonies, query]);

    // tonies with the same name (e.g. several tags with one figure) get their id below it
    const sameName = useMemo(() => {
        const counts = new Map<string, number>();
        tonies.forEach((tonie) => {
            const label = tonieLabel(tonie);
            counts.set(label, (counts.get(label) ?? 0) + 1);
        });
        return counts;
    }, [tonies]);

    const full = picked.length >= room;
    const toggle = (ruid: string) =>
        setPicked((list) =>
            list.includes(ruid) ? list.filter((r) => r !== ruid) : full ? list : [...list, ruid],
        );

    return (
        <Modal
            open
            zIndex={1300}
            width={760}
            title={t("teddybox.picker.title")}
            onCancel={onClose}
            styles={{ body: { paddingTop: 8 } }}
            footer={
                <Flex justify="space-between" align="center" gap={8} wrap>
                    <Text type={full ? "warning" : "secondary"}>
                        {full
                            ? t("teddybox.picker.full", { count: room })
                            : t("teddybox.picker.picked", { count: picked.length, max: room })}
                    </Text>
                    <Flex gap={8}>
                        <Button onClick={onClose}>{t("teddybox.edit.cancel")}</Button>
                        <Button
                            type="primary"
                            disabled={!picked.length}
                            onClick={() => onAdd(picked)}
                        >
                            {t("teddybox.picker.add", { count: picked.length })}
                        </Button>
                    </Flex>
                </Flex>
            }
        >
            <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t("teddybox.picker.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ marginBottom: token.marginSM }}
            />
            {shown.length === 0 ? (
                <Empty description={t("teddybox.picker.none")} />
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
                        gap: token.marginSM,
                        maxHeight: "60vh",
                        overflowY: "auto",
                        overflowX: "hidden",
                        padding: 2,
                    }}
                >
                    {shown.map((tonie) => {
                        const inCollection = taken.includes(tonie.ruid);
                        const order = picked.indexOf(tonie.ruid);
                        const selected = order >= 0;
                        const blocked = inCollection || (full && !selected);
                        return (
                            <button
                                key={tonie.ruid}
                                type="button"
                                aria-pressed={selected}
                                disabled={inCollection}
                                onClick={() => toggle(tonie.ruid)}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: token.paddingXS,
                                    borderRadius: token.borderRadiusLG,
                                    border: `2px solid ${selected ? token.colorPrimary : token.colorBorderSecondary}`,
                                    background: selected
                                        ? token.colorPrimaryBg
                                        : token.colorFillQuaternary,
                                    color: token.colorText,
                                    cursor: inCollection ? "default" : "pointer",
                                    opacity: blocked ? 0.45 : 1,
                                    textAlign: "center",
                                    font: "inherit",
                                    minWidth: 0,
                                }}
                            >
                                <TonieFigure tonie={tonie} size="80%" />
                                <span
                                    style={{
                                        fontSize: token.fontSizeSM,
                                        lineHeight: 1.3,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {tonieLabel(tonie)}
                                </span>
                                {(sameName.get(tonieLabel(tonie)) ?? 0) > 1 && (
                                    <span
                                        style={{
                                            fontSize: token.fontSizeSM,
                                            color: token.colorTextTertiary,
                                            fontFamily: "monospace",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        {tonie.ruid}
                                    </span>
                                )}
                                {(selected || inCollection) && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: 4,
                                            right: 4,
                                            minWidth: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            display: "grid",
                                            placeItems: "center",
                                            background: inCollection
                                                ? token.colorTextQuaternary
                                                : token.colorPrimary,
                                            color: token.colorWhite,
                                            fontSize: token.fontSizeSM,
                                        }}
                                    >
                                        {inCollection ? <CheckCircleFilled /> : order + 1}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
};
