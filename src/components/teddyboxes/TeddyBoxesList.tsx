import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Card, Flex, Grid, Tooltip, Typography, theme } from "antd";
import {
    DeleteOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    QrcodeOutlined,
    SettingOutlined,
} from "@ant-design/icons";

import {
    TEDDYBOX_BOX_COLORS,
    TEDDYBOX_ROUTE,
    TEDDYBOXES_GUIDE_ROUTE,
    TEDDYBOXES_ROUTE,
} from "../../constants/teddybox";
import { TeddyBoxConfig } from "../../types/teddyboxTypes";
import { canHover } from "../../utils/browser/browserUtils";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { useTeddyCloud } from "../../provider/TeddyCloudProvider";
import { createTeddyBox } from "../../utils/teddybox/teddyboxConfig";
import { setActiveTeddyBox } from "../../utils/teddybox/deviceStorage";
import ConfirmationDialog from "../common/modals/ConfirmationModal";
import LoadingSpinner from "../common/elements/LoadingSpinner";
import { TeddyBoxGraphic } from "../teddybox/graphics/TeddyBoxGraphic";
import { useTeddyBoxes } from "../teddybox/hooks/useTeddyBoxes";
import { TeddyBoxQrModal } from "./modals/TeddyBoxQrModal";

const { Paragraph, Text } = Typography;
const { useToken } = theme;

interface TeddyBoxesListProps {
    /** Start page: cards can only be opened, without editing. */
    readOnly?: boolean;
    limit?: number;
}

/** Virtual TeddyBoxes: kids players that run on a phone or tablet. */
export const TeddyBoxesList: React.FC<TeddyBoxesListProps> = ({ readOnly = false, limit }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const { addNotification } = useTeddyCloud();
    const { teddyboxes, loading, error, saveTeddyBox, deleteTeddyBox } = useTeddyBoxes();

    const [qrBox, setQrBox] = useState<TeddyBoxConfig | null>(null);
    const [deleteBox, setDeleteBox] = useState<TeddyBoxConfig | null>(null);
    const [creating, setCreating] = useState(false);

    const columns = screens.xxl ? 4 : screens.lg ? 3 : screens.sm ? 2 : 1;

    const notifyError = (title: string, err: unknown) =>
        addNotification(
            NotificationTypeEnum.Error,
            title,
            err instanceof Error ? err.message : String(err),
            t("teddybox.title"),
        );

    const remove = async (box: TeddyBoxConfig) => {
        setDeleteBox(null);
        try {
            await deleteTeddyBox(box.id);
        } catch (err) {
            notifyError(t("teddybox.deleteFailed"), err);
        }
    };

    /**
     * Opens the TeddyBox: as kids mode of this device, or with its settings and live preview
     * (which does not turn this device into the TeddyBox).
     */
    const open = (box: TeddyBoxConfig, setup = false, isNew = false) => {
        // The admin player must not keep playing below the TeddyBox.
        (document.getElementById("globalAudioPlayer") as HTMLAudioElement | null)?.pause();
        if (!setup) setActiveTeddyBox(box.id);
        const query = setup ? `?setup=1${isNew ? "&new=1" : ""}` : "";
        navigate(`${TEDDYBOX_ROUTE}/${encodeURIComponent(box.id)}${query}`);
    };

    const tonieCount = (box: TeddyBoxConfig) =>
        new Set(box.shelves.flatMap((shelf) => shelf.tonies)).size;

    // icons only, so every action explains itself on hover (no tooltips on touch)
    const action = (key: string, label: string, icon: React.ReactElement) => (
        <Tooltip key={key} open={!canHover ? false : undefined} title={label}>
            {icon}
        </Tooltip>
    );

    const cardActions = (box: TeddyBoxConfig) => [
        action(
            "open",
            t("teddybox.open"),
            <PlayCircleOutlined aria-label={t("teddybox.open")} onClick={() => open(box)} />,
        ),
        action(
            "setup",
            t("teddybox.setupOpen"),
            <SettingOutlined
                aria-label={t("teddybox.setupOpen")}
                onClick={() => open(box, true)}
            />,
        ),
        action(
            "qr",
            t("teddybox.qr.title", { name: box.name }),
            <QrcodeOutlined
                aria-label={t("teddybox.qr.title", { name: box.name })}
                onClick={() => setQrBox(box)}
            />,
        ),
        action(
            "delete",
            t("teddybox.delete"),
            <DeleteOutlined aria-label={t("teddybox.delete")} onClick={() => setDeleteBox(box)} />,
        ),
    ];

    /** A new TeddyBox is stored right away and opened in its settings with the live preview. */
    const createNew = async () => {
        const box = createTeddyBox(
            t("teddybox.newName", { number: teddyboxes.length + 1 }),
            t("teddybox.edit.shelfDefaultName", { number: 1 }),
        );
        setCreating(true);
        try {
            await saveTeddyBox(box);
            open(box, true, true);
        } catch (err) {
            notifyError(t("teddybox.saveFailed"), err);
            setCreating(false);
        }
    };

    const shown = limit ? teddyboxes.slice(0, limit) : teddyboxes;

    const emptyState = (
        <Flex vertical align="center" gap={12} style={{ padding: token.paddingLG }}>
            <TeddyBoxGraphic color={TEDDYBOX_BOX_COLORS[0]} style={{ width: 140 }} />
            <Paragraph style={{ textAlign: "center", maxWidth: 520, marginBottom: 0 }}>
                {t("teddybox.empty")}
            </Paragraph>
            <Flex gap={8} wrap justify="center">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    loading={creating}
                    onClick={readOnly ? () => navigate(TEDDYBOXES_ROUTE) : () => void createNew()}
                >
                    {t("teddybox.add")}
                </Button>
                <Button onClick={() => navigate(TEDDYBOXES_GUIDE_ROUTE)}>
                    {t("teddybox.guide.navigationTitle")}
                </Button>
            </Flex>
        </Flex>
    );

    return (
        <section>
            {!readOnly && teddyboxes.length > 0 && (
                <Flex justify="flex-end" style={{ marginBottom: 16 }}>
                    <Button
                        icon={<PlusOutlined />}
                        loading={creating}
                        onClick={() => void createNew()}
                    >
                        {t("teddybox.add")}
                    </Button>
                </Flex>
            )}

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <Text type="danger">{t("teddybox.loadError")}</Text>
            ) : teddyboxes.length === 0 ? (
                emptyState
            ) : (
                <Flex wrap gap={16}>
                    {shown.map((box) => (
                        <div
                            key={box.id}
                            style={{
                                flex: `0 0 calc(${100 / columns}% - 16px)`,
                                maxWidth: `calc(${100 / columns}% - 16px)`,
                            }}
                        >
                            <Card
                                size="small"
                                title={box.name}
                                // double click opens the Teddybox, but not on the action icons
                                onDoubleClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest(".ant-card-actions")) open(box);
                                }}
                                cover={
                                    <div
                                        style={{
                                            padding: token.paddingMD,
                                            background: token.colorFillQuaternary,
                                        }}
                                    >
                                        <TeddyBoxGraphic
                                            color={box.color}
                                            style={{
                                                width: "60%",
                                                margin: "0 auto",
                                                display: "block",
                                            }}
                                        />
                                    </div>
                                }
                                actions={readOnly ? cardActions(box).slice(0, 2) : cardActions(box)}
                            >
                                <Text type="secondary">
                                    {t("teddybox.summary", {
                                        shelves: box.shelves.length,
                                        tonies: tonieCount(box),
                                    })}
                                </Text>
                            </Card>
                        </div>
                    ))}
                </Flex>
            )}

            {qrBox && <TeddyBoxQrModal box={qrBox} onClose={() => setQrBox(null)} />}
            {deleteBox && (
                <ConfirmationDialog
                    open
                    title={t("teddybox.deleteTitle")}
                    content={t("teddybox.deleteText", { name: deleteBox.name })}
                    okText={t("teddybox.delete")}
                    cancelText={t("teddybox.edit.cancel")}
                    handleOk={() => void remove(deleteBox)}
                    handleCancel={() => setDeleteBox(null)}
                />
            )}
        </section>
    );
};
