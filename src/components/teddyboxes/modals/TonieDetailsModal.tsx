import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Descriptions, Flex, Modal, Typography } from "antd";

import { TonieCardProps } from "../../../types/tonieTypes";
import { toImageSrc } from "../../tonies/common/utils/imagePathUtils";
import { tonieLabel } from "../../../utils/teddybox/tonieNames";

const { Text } = Typography;

const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/**
 * Which content a tonie on a shelf stands for. A small read-only view, because the full
 * tonie information dialog depends on the player of the admin UI.
 */
export const TonieDetailsModal: React.FC<{ tonie: TonieCardProps; onClose: () => void }> = ({
    tonie,
    onClose,
}) => {
    const { t } = useTranslation();
    const info = tonie.sourceInfo?.series ? tonie.sourceInfo : tonie.tonieInfo;
    const tracks = info?.tracks?.length ? info.tracks : (tonie.tonieInfo?.tracks ?? []);
    const starts = tonie.trackSeconds ?? [];
    const yesNo = (value: boolean) =>
        value ? t("tonies.infoModal.yes") : t("tonies.infoModal.no");

    return (
        <Modal
            open
            destroyOnHidden
            title={tonieLabel(tonie)}
            onCancel={onClose}
            footer={
                <Button type="primary" onClick={onClose}>
                    {t("tonies.informationModal.ok")}
                </Button>
            }
        >
            <Flex gap={16} align="flex-start" wrap>
                {tonie.tonieInfo?.picture && (
                    <img
                        src={toImageSrc(tonie.tonieInfo.picture)}
                        alt=""
                        style={{ width: 96, height: 96, objectFit: "contain" }}
                    />
                )}
                <Descriptions
                    size="small"
                    column={1}
                    style={{ flex: "1 1 240px", minWidth: 0 }}
                    items={[
                        {
                            key: "model",
                            label: t("tonies.infoModal.model"),
                            children: info?.model || "-",
                        },
                        {
                            key: "content",
                            label: t("teddybox.details.content"),
                            children: (
                                <Text style={{ wordBreak: "break-all" }}>
                                    {tonie.source || "-"}
                                </Text>
                            ),
                        },
                        { key: "tag", label: t("teddybox.details.tag"), children: tonie.ruid },
                        {
                            key: "valid",
                            label: t("tonies.infoModal.valid"),
                            children: yesNo(tonie.valid),
                        },
                    ]}
                />
            </Flex>
            {tracks.length > 0 && (
                <>
                    <h4>{t("tonies.infoModal.tracklist")}</h4>
                    <ol style={{ paddingLeft: 24, margin: 0 }}>
                        {tracks.map((track, index) => (
                            <li key={`${index}-${track}`}>
                                {track}
                                {starts[index] !== undefined && (
                                    <Text type="secondary"> ({formatTime(starts[index])})</Text>
                                )}
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </Modal>
    );
};
