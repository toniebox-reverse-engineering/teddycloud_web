import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, List, Modal, Typography } from "antd";

import { TonieCardProps } from "../../../../types/tonieTypes";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { useTeddyCloud } from "../../../../provider/TeddyCloudProvider";
import { useTonieboxContentOverlay } from "../../../../hooks/useTonieboxContentOverlay";
import { useTonies } from "../../../../hooks/useTonies";
import { useAssignSourceToTonie } from "../hooks/useAssignSourceToTonie";
import { toImageSrc } from "../utils/imagePathUtils";
import ThumbnailCell from "../elements/ThumbnailCell";
import LoadingSpinner from "../../../common/elements/LoadingSpinner";

const { Text } = Typography;

interface AssignTonieModalProps {
    open: boolean;
    onClose: () => void;
    /** The lib:// path (already prefixed) of the file being assigned. */
    sourcePath: string;
    onAssigned?: () => void;
}

/**
 * Lightweight, list-based Tonie tag picker used to assign a library file as a Tonie's
 * content directly from the Library file browser. Deliberately kept smaller than
 * ToniesList.tsx, which is built for the full Tonies overview page.
 */
export const AssignTonieModal: React.FC<AssignTonieModalProps> = ({
    open,
    onClose,
    sourcePath,
    onAssigned,
}) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const { overlay } = useTonieboxContentOverlay();
    const { assignSourceToTonie } = useAssignSourceToTonie();

    const [filterText, setFilterText] = useState("");
    const [assigningRuid, setAssigningRuid] = useState<string | null>(null);

    const sourceFolder = sourcePath.slice(0, sourcePath.lastIndexOf("/") + 1);

    const sortByFolderMatch = (a: TonieCardProps, b: TonieCardProps) => {
        const aMatches = (a.source || "").startsWith(sourceFolder) ? 1 : 0;
        const bMatches = (b.source || "").startsWith(sourceFolder) ? 1 : 0;
        return bMatches - aMatches;
    };

    const { tonies, loading } = useTonies({
        overlay: overlay ?? "",
        merged: false,
        filter: "tag",
        sort: sortByFolderMatch,
    });

    const filteredTonies = useMemo(() => {
        const text = filterText.trim().toLowerCase();
        if (!text) return tonies;
        return tonies.filter((tonie) => {
            const title = `${tonie.tonieInfo.series} ${tonie.tonieInfo.episode}`.toLowerCase();
            return title.includes(text);
        });
    }, [tonies, filterText]);

    const handleAssign = async (tonieCard: TonieCardProps) => {
        setAssigningRuid(tonieCard.ruid);
        try {
            await assignSourceToTonie(tonieCard, sourcePath, overlay ?? "");
            addNotification(
                NotificationTypeEnum.Success,
                t("fileBrowser.assignToTonie.successMessage"),
                t("fileBrowser.assignToTonie.successDetails", {
                    series: tonieCard.tonieInfo.series || tonieCard.uid,
                }),
                t("fileBrowser.title"),
            );
            onAssigned?.();
            onClose();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.assignToTonie.failedMessage"),
                t("fileBrowser.assignToTonie.failedDetails", {
                    series: tonieCard.tonieInfo.series || tonieCard.uid,
                }) + error,
                t("fileBrowser.title"),
            );
        } finally {
            setAssigningRuid(null);
        }
    };

    return (
        <Modal
            title={t("fileBrowser.assignToTonie.title")}
            open={open}
            onCancel={onClose}
            footer={null}
        >
            <Input
                placeholder={t("fileBrowser.assignToTonie.searchPlaceholder")}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                allowClear
                autoFocus
                style={{ marginBottom: 12 }}
            />
            {loading ? (
                <LoadingSpinner />
            ) : (
                <List
                    style={{ maxHeight: 420, overflowY: "auto" }}
                    dataSource={filteredTonies}
                    rowKey={(tonie) => tonie.ruid}
                    renderItem={(tonie) => (
                        <List.Item
                            style={{ cursor: "pointer", opacity: assigningRuid ? 0.6 : 1 }}
                            onClick={() => (assigningRuid ? undefined : handleAssign(tonie))}
                        >
                            <List.Item.Meta
                                avatar={
                                    <ThumbnailCell
                                        src={toImageSrc(tonie.tonieInfo.picture)}
                                        alt={tonie.tonieInfo.series}
                                    />
                                }
                                title={tonie.tonieInfo.series || t("tonies.unsetTonie")}
                                description={
                                    <Text type="secondary">{tonie.tonieInfo.episode || tonie.uid}</Text>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Modal>
    );
};

export default AssignTonieModal;
