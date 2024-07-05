import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Typography, Button, message, Tooltip } from "antd";
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

    // show source information if alternative source is set
    const [informationFromSource, setInformationFromSource] = useState<boolean>(false);
    const [sourcePic, setSourcePic] = useState<string>("");
    const [sourceTracks, setSourceTracks] = useState<string[]>([]);

    useEffect(() => {
        if (
            "sourceInfo" in tonieCardOrTAFRecord &&
            ((tonieCardOrTAFRecord.sourceInfo.picture !== tonieCardOrTAFRecord.tonieInfo.picture &&
                modelTitle !== sourceTitle) ||
                (tonieCardOrTAFRecord.sourceInfo.picture === tonieCardOrTAFRecord.tonieInfo.picture &&
                    modelTitle !== sourceTitle) ||
                tonieCardOrTAFRecord.sourceInfo.series !== tonieCardOrTAFRecord.tonieInfo.series ||
                tonieCardOrTAFRecord.sourceInfo.episode !== tonieCardOrTAFRecord.tonieInfo.episode ||
                tonieCardOrTAFRecord.sourceInfo.tracks.join(".") !== tonieCardOrTAFRecord.tonieInfo.tracks.join("."))
        ) {
            setInformationFromSource(true);
            setSourcePic(tonieCardOrTAFRecord.sourceInfo.picture);
            setSourceTracks(tonieCardOrTAFRecord.sourceInfo.tracks);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tonieCardOrTAFRecord, isOpen]);

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

    const modelTitle =
        `${tonieCardOrTAFRecord.tonieInfo.series}` +
        (tonieCardOrTAFRecord.tonieInfo.episode ? ` - ${tonieCardOrTAFRecord.tonieInfo.episode}` : "");

    const sourceTitle =
        "sourceInfo" in tonieCardOrTAFRecord
            ? `${tonieCardOrTAFRecord.sourceInfo.series}` +
              (tonieCardOrTAFRecord.sourceInfo.episode ? ` - ${tonieCardOrTAFRecord.sourceInfo.episode}` : "")
            : "";

    const title = informationFromSource ? sourceTitle : modelTitle;

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
                <div style={{ position: "relative" }}>
                    {
                        <img
                            src={
                                tonieCardOrTAFRecord.tonieInfo.picture
                                    ? tonieCardOrTAFRecord.tonieInfo.picture
                                    : "/img_unknown.png"
                            }
                            alt=""
                            style={{ width: "100%" }}
                        />
                    }
                    {informationFromSource ? (
                        <Tooltip
                            title={t("tonies.alternativeSource", {
                                originalTonie: '"' + modelTitle + '"',
                                assignedContent: '"' + sourceTitle + '"',
                            }).replace(' "" ', " ")}
                            placement="bottom"
                        >
                            <img
                                src={sourcePic}
                                alt=""
                                style={{
                                    bottom: 0,
                                    padding: 8,
                                    position: "absolute",
                                    right: 20,
                                    height: "50%",
                                    width: "auto",
                                }}
                            />
                        </Tooltip>
                    ) : (
                        ""
                    )}
                </div>
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
                    {informationFromSource ? (
                        sourceTracks && sourceTracks.length > 0 ? (
                            <>
                                <strong>{t("tonies.infoModal.tracklist")}</strong>
                                <ol>
                                    {sourceTracks.map((track, index) => (
                                        <li key={index}>{track}</li>
                                    ))}
                                </ol>
                            </>
                        ) : (
                            <></>
                        )
                    ) : tonieCardOrTAFRecord.tonieInfo.tracks && tonieCardOrTAFRecord.tonieInfo.tracks.length > 0 ? (
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
