import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Typography, Button, message } from "antd";
import { TonieCardProps } from "../tonies/TonieCard";
import { Record } from "./FileBrowser";
import ConfirmationDialog from "./ConfirmationDialog";

const { Text } = Typography;

export type TonieCardTAFRecord = TonieCardProps | Record;

export type InformationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    tonieCardOrTAFRecord: TonieCardTAFRecord;
    readOnly?: boolean;
    lastRUIDs?: Array<[string, string, string]>;
    overlay?: string;
    onHide?: (ruid: string) => void;
};

const TonieInformationModal: React.FC<InformationModalProps> = ({
    isOpen,
    onClose,
    tonieCardOrTAFRecord,
    readOnly,
    lastRUIDs,
    overlay,
    onHide,
}) => {
    const { t } = useTranslation();

    const [isConfirmHideModalVisible, setIsConfirmHideModalVisible] = useState(false);

    const toniePlayedOn =
        lastRUIDs && "ruid" in tonieCardOrTAFRecord
            ? lastRUIDs
                  .filter(([ruid]) => ruid === tonieCardOrTAFRecord.ruid)
                  .map(([, ruidTime, boxName]) => ({ ruidTime, boxName }))
            : null;

    const handleCancelHide = () => {
        setIsConfirmHideModalVisible(false);
    };

    const tonieInfoString =
        tonieCardOrTAFRecord.tonieInfo.series +
        (tonieCardOrTAFRecord?.tonieInfo.episode ? " - " + tonieCardOrTAFRecord.tonieInfo.episode : "") +
        (tonieCardOrTAFRecord.tonieInfo.model ? " (" + tonieCardOrTAFRecord.tonieInfo.model + ")" : "");

    const showHideConfirmDialog = () => {
        setIsConfirmHideModalVisible(true);
    };

    const handleConfirmHide = () => {
        hideTag();
        setIsConfirmHideModalVisible(false);
    };

    const title =
        `${tonieCardOrTAFRecord.tonieInfo.series}` +
        (tonieCardOrTAFRecord.tonieInfo.episode ? ` - ${tonieCardOrTAFRecord.tonieInfo.episode}` : "");

    const informationModalTitle = (
        <>
            <h3>
                {title ? title : t("tonies.informationModal.unknownModel")}
                <br />
                {"uid" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.uid ? (
                    <Text type="secondary">{tonieCardOrTAFRecord.uid}</Text>
                ) : (
                    ""
                )}
            </h3>
        </>
    );

    const informationModalFooter = (
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div>
                {"ruid" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.ruid ? (
                    !readOnly ? (
                        <Button onClick={showHideConfirmDialog}>{t("tonies.informationModal.hideTag")}</Button>
                    ) : (
                        ""
                    )
                ) : (
                    ""
                )}
            </div>
            <Button type="primary" onClick={onClose}>
                {t("tonies.informationModal.ok")}
            </Button>
        </div>
    );

    const hideTonieModal = (
        <ConfirmationDialog
            title={t("tonies.confirmHideModal.title")}
            isVisible={isConfirmHideModalVisible}
            okText={t("tonies.confirmHideModal.hide")}
            cancelText={t("tonies.confirmHideModal.cancel")}
            content={t("tonies.confirmHideModal.confirmHideDialog", {
                tonieToHide: tonieInfoString
                    ? tonieInfoString
                    : "uid" in tonieCardOrTAFRecord
                    ? tonieCardOrTAFRecord.uid
                    : "",
            })}
            handleOk={handleConfirmHide}
            handleCancel={handleCancelHide}
        />
    );

    const hideTag = async () => {
        if (onHide && "ruid" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.ruid) {
            const url =
                `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCardOrTAFRecord.ruid}` +
                (overlay ? `?overlay=${overlay}` : "");
            try {
                const response = await fetch(url, {
                    method: "POST",
                    body: "hide=true",
                });
                if (!response.ok) {
                    throw new Error(response.status + " " + response.statusText);
                }
                message.success(t("tonies.messages.hideTonieSuccessful"));
                onHide(tonieCardOrTAFRecord.ruid);
            } catch (error) {
                message.error(t("tonies.messages.hideTonieFailed") + error);
            }
        }
    };

    return (
        <>
            <Modal
                title={informationModalTitle}
                footer={informationModalFooter}
                open={isOpen}
                keyboard={true}
                closable={false}
                maskClosable={true}
                onCancel={onClose}
            >
                {tonieCardOrTAFRecord.tonieInfo.picture && (
                    <img src={tonieCardOrTAFRecord.tonieInfo.picture} alt="" style={{ width: "100%" }} />
                )}
                {toniePlayedOn && toniePlayedOn.length > 0 ? (
                    <>
                        <strong>{t("tonies.lastPlayedOnModal.lastPlayedOnMessage")}:</strong>
                        <ul>
                            {toniePlayedOn.map(({ ruidTime, boxName }, index) => (
                                <li key={index}>
                                    {boxName}
                                    {ruidTime ? " (" + ruidTime + ")" : ""}
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <></>
                )}
                <div>
                    {"valid" in tonieCardOrTAFRecord ? (
                        <p>
                            <strong>{t("tonies.infoModal.valid")}</strong>{" "}
                            {tonieCardOrTAFRecord.valid ? t("tonies.infoModal.yes") : t("tonies.infoModal.no")}
                        </p>
                    ) : (
                        ""
                    )}
                    {"exists" in tonieCardOrTAFRecord ? (
                        <p>
                            <strong>{t("tonies.infoModal.exists")}</strong>{" "}
                            {tonieCardOrTAFRecord.exists ? t("tonies.infoModal.yes") : t("tonies.infoModal.no")}
                        </p>
                    ) : (
                        ""
                    )}
                    {tonieCardOrTAFRecord.tonieInfo.tracks && tonieCardOrTAFRecord.tonieInfo.tracks.length > 0 ? (
                        <>
                            <strong>{t("tonies.infoModal.tracklist")}</strong>
                            <ol>
                                {tonieCardOrTAFRecord.tonieInfo.tracks.map((track, index) => (
                                    <li key={index}>{track}</li>
                                ))}
                            </ol>
                        </>
                    ) : (
                        <></>
                    )}
                </div>
            </Modal>
            {hideTonieModal}
        </>
    );
};

export default TonieInformationModal;
