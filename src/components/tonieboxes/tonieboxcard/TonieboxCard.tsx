import React, { JSX, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import i18n from "../../../i18n";
import { useTranslation } from "react-i18next";
import { Card, theme, Tooltip } from "antd";
import {
    EditOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    WifiOutlined,
    DeleteOutlined,
    LockOutlined,
    LinkOutlined,
} from "@ant-design/icons";

import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import { OptionsList, TeddyCloudApi } from "../../../api";

import { TonieCardProps } from "../../../types/tonieTypes";
import { BoxVersionsEnum, TonieboxCardProps, TonieboxImage } from "../../../types/tonieboxTypes";

import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";

import defaultBoxImage from "../../../assets/unknown_box.png";

import { EditModal } from "./modals/EditModal";
import { CertificatesModal } from "../common/modals/CertificatesModal";
import { SettingsModal } from "./modals/SettingsModal";
import { DeleteModal } from "./modals/DeleteModal";
import { useTriggerWriteConfig } from "./hooks/useTriggerWriteConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Meta } = Card;
const { useToken } = theme;

export const TonieboxCard: React.FC<{
    tonieboxCard: TonieboxCardProps;
    tonieboxImages: TonieboxImage[];
    readOnly?: boolean;
    checkCC3200CFW?: boolean;
}> = ({ tonieboxCard, tonieboxImages, readOnly = false, checkCC3200CFW = false }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const triggerWriteConfig = useTriggerWriteConfig();

    const currentLanguage = i18n.language;

    const [tonieboxStatus, setTonieboxStatus] = useState<boolean>(false);
    const [tonieboxVersion, setTonieboxVersion] = useState<string>("");
    const [lastOnline, setLastOnline] = useState<string>("");
    const [lastIp, setLastIp] = useState<string>("");
    const [cfwInstalled, setCFWInstalled] = useState<boolean>(false);
    const [lastPlayedTonieName, setLastPlayedTonieName] = useState<React.ReactNode>(null);
    const [options, setOptions] = useState<OptionsList | undefined>();
    const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);
    const [isUploadCertificatesModalOpen, setIsUploadCertificatesModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [activeModel, setActiveModel] = useState<string>(tonieboxCard.boxModel);
    const [selectedModel, setSelectedModel] = useState<string>(tonieboxCard.boxModel);
    const [boxName, setBoxName] = useState(tonieboxCard.boxName);
    const [tonieboxName, setTonieBoxName] = useState(tonieboxCard.boxName);
    const [boxImage, setBoxImage] = useState<JSX.Element | null>(null);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [tonieboxAccessApi, setTonieboxAccessApi] = useState<boolean>(true);
    const [modalKey, setModalKey] = useState(0);

    useEffect(() => {
        const fetchTonieboxApiAccess = async () => {
            const tonieboxApiAccess = await api.apiGetTonieboxApiAccess(tonieboxCard.ID);
            setTonieboxAccessApi(tonieboxApiAccess);
        };
        fetchTonieboxApiAccess();
    }, [tonieboxCard.ID, isEditSettingsModalOpen]);

    useEffect(() => {
        const fetchTonieboxStatus = async () => {
            const status = await api.apiGetTonieboxStatus(tonieboxCard.ID);
            setTonieboxStatus(status);
        };
        fetchTonieboxStatus();

        const fetchTonieboxVersion = async () => {
            const versionRaw = await api.apiGetTonieboxVersion(tonieboxCard.ID);
            const BoxVersions: { [key: string]: BoxVersionsEnum } = {
                "0": BoxVersionsEnum.unknown,
                "1": BoxVersionsEnum.cc3200,
                "2": BoxVersionsEnum.cc3235,
                "3": BoxVersionsEnum.esp32,
            };

            if (versionRaw in BoxVersions) {
                const version = BoxVersions[versionRaw as keyof typeof BoxVersions];
                setTonieboxVersion(version);
            } else {
                setTonieboxVersion(BoxVersionsEnum.unknown);
            }
        };
        fetchTonieboxVersion();

        const fetchTonieboxLastRUID = async () => {
            const ruid = await api.apiGetTonieboxLastRUID(tonieboxCard.ID);
            if (ruid !== "ffffffffffffffff" && ruid !== "") {
                const ruidTime = await api.apiGetTonieboxLastRUIDTime(tonieboxCard.ID);
                const tonieData = await api.apiGetTagIndex(tonieboxCard.ID);
                setLastPlayedTonie(
                    tonieData.filter((tonie) => tonie.ruid === ruid),
                    ruidTime
                );
            }
        };
        fetchTonieboxLastRUID();

        if (!tonieboxStatus) {
            const fetchTonieboxLastOnline = async () => {
                const last = await api.apiGetLastOnline(tonieboxCard.ID);
                setLastOnline(last);
            };
            fetchTonieboxLastOnline();
        }

        const fetchTonieboxLastIp = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("internal.ip", tonieboxCard.ID);
            const ip = await response.text();
            setLastIp(ip);
        };
        checkCC3200CFW && fetchTonieboxLastIp();

        selectBoxImage(tonieboxCard.boxModel);
        setSelectedModel(tonieboxCard.boxModel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tonieboxCard.ID, tonieboxCard.boxModel, currentLanguage]);

    useEffect(() => {
        if (checkCC3200CFW && lastIp && tonieboxVersion === BoxVersionsEnum.cc3200) {
            try {
                fetch(`http://${lastIp}/api/ajax?cmd=box-battery&sub=stats`)
                    .then((response) => response.text())
                    .then(() => {
                        console.log("Battery Stats fetched --> assume CFW active");
                        setCFWInstalled(true);
                    })
                    .catch(() => {
                        console.log("No Battery Stats fetched --> assume CFW not active");
                        setCFWInstalled(false);
                    });
            } catch (error) {
                console.log("No Battery Stats fetched --> assume CFW not active");
                setCFWInstalled(false);
            }
        }
    }, [lastIp, tonieboxVersion, checkCC3200CFW]);

    const selectBoxImage = (id: string) => {
        const selectedImage = tonieboxImages.find((item: { id: string }) => item.id === id);

        if (selectedImage) {
            setBoxImage(
                <img
                    src={selectedImage.img_src}
                    alt=""
                    style={{
                        ...getCroppedImageStyle(id),
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                />
            );
        } else {
            setBoxImage(
                <Tooltip
                    title={
                        <>
                            {t("tonieboxes.modelHint.text")}{" "}
                            <EditOutlined key="edit" onClick={() => showModelModal()} />{" "}
                            {t("tonieboxes.modelHint.action")}!
                        </>
                    }
                    placement="bottom"
                >
                    <img
                        src={defaultBoxImage}
                        alt=""
                        style={{
                            width: "100%",
                            height: "auto",
                            position: "absolute",
                            top: 0,
                            left: 0,
                        }}
                    />
                </Tooltip>
            );
        }
    };

    const setLastPlayedTonie = (tonie: TonieCardProps[], time?: string) => {
        if (!tonie || tonie.length === 0) return;

        setLastPlayedTonieName(
            <Link to={`/tonies?tonieRUID=${tonie[0].ruid}&overlay=${tonieboxCard.ID}`}>
                <Tooltip
                    placement="top"
                    zIndex={2}
                    title={
                        t("tonieboxes.lastPlayedTonie") +
                        tonie[0].tonieInfo.series +
                        (tonie[0].tonieInfo.episode ? " - " + tonie[0].tonieInfo.episode : "") +
                        (time ? " (" + time + ")" : "")
                    }
                >
                    <img
                        src={tonie[0].tonieInfo.picture}
                        alt="Tonie"
                        style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            zIndex: 1,
                            padding: 8,
                            borderRadius: 4,
                            height: "60%",
                        }}
                    />
                </Tooltip>
            </Link>
        );
    };

    // certificates
    const handleUploadCertificatesClick = () => {
        const fetchOptions = async () => {
            const optionsRequest = (await api.apiGetIndexGet(tonieboxCard.ID)) as OptionsList;
            if (optionsRequest?.options?.length && optionsRequest?.options?.length > 0) {
                setOptions(optionsRequest);
            }
        };

        fetchOptions();
        setIsUploadCertificatesModalOpen(true);
    };
    const handleUploadCertificatesOk = async () => {
        setIsUploadCertificatesModalOpen(false);
    };
    const handleUploadCertificatesCancel = () => {
        setIsUploadCertificatesModalOpen(false);
    };

    // Settings
    const showEditSettingsModal = () => {
        setIsEditSettingsModalOpen(true);
    };
    const handleEditSettingsCancel = () => {
        setIsEditSettingsModalOpen(false);
    };
    const handleEditSettingsClick = () => {
        setModalKey((prevKey) => prevKey + 1);
        showEditSettingsModal();
    };

    // Model (name + box Model)
    const showModelModal = () => {
        if (selectedModel === undefined) {
            setSelectedModel(activeModel);
        } else {
            setSelectedModel(selectedModel);
        }
        setIsModelModalOpen(true);
    };

    const handleModelCancel = () => {
        setSelectedModel(activeModel);
        setTonieBoxName(tonieboxName);
        setBoxName(tonieboxName);
        setIsModelModalOpen(false);
    };

    const handleModelSave = async () => {
        selectBoxImage(selectedModel);
        setActiveModel(selectedModel);

        try {
            api.apiPostTeddyCloudSetting("boxModel", selectedModel, tonieboxCard.ID)
                .then(() => {
                    triggerWriteConfig();
                })
                .then(() => {
                    addNotification(
                        NotificationTypeEnum.Success,
                        t("tonieboxes.editModelModal.successOnModelChange"),
                        t("tonieboxes.editModelModal.successOnModelChangeDetails", {
                            model: selectedModel,
                            mac: tonieboxCard.ID,
                        }),
                        t("tonieboxes.navigationTitle")
                    );
                })
                .catch((e) => {
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("settings.errorWhileSavingConfig"),
                        t("settings.errorWhileSavingConfigDetails") + e,
                        t("tonieboxes.navigationTitle")
                    );
                });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonieboxes.editModelModal.errorOnModelChange"),
                t("tonieboxes.editModelModal.errorOnModelChangeDetails", { mac: tonieboxCard.ID, error: error }),
                t("tonieboxes.navigationTitle")
            );
        }
    };

    const handleBoxNameSave = async () => {
        setTonieBoxName(boxName);

        try {
            api.apiPostTeddyCloudSetting("boxName", boxName.toString(), tonieboxCard.ID)
                .then(() => {
                    triggerWriteConfig();
                })
                .then(() => {
                    addNotification(
                        NotificationTypeEnum.Success,
                        t("tonieboxes.editModelModal.successOnNameChange"),
                        t("tonieboxes.editModelModal.successOnNameChangeDetails", {
                            name: boxName,
                            mac: tonieboxCard.ID,
                        }),
                        t("tonieboxes.navigationTitle")
                    );
                })
                .catch((e) => {
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("settings.errorWhileSavingConfig"),
                        t("settings.errorWhileSavingConfigDetails") + e,
                        t("tonieboxes.navigationTitle")
                    );
                });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonieboxes.editModelModal.errorOnNameChange"),
                t("tonieboxes.editModelModal.errorOnNameChangeDetails", { mac: tonieboxCard.ID, error: error }),
                t("tonieboxes.navigationTitle")
            );
        }
    };

    const getCroppedImageStyle = (boxModel: string) => {
        const tonieboxImage = tonieboxImages.find((image) => image.id === boxModel);
        if (tonieboxImage && tonieboxImage.crop) {
            const [x, y, scale] = tonieboxImage.crop;
            return {
                width: "100%",
                height: "auto",
                transform: `scale(${scale}) translateX(${x}px) translateY(${y}px)`,
            };
        } else {
            return { width: "100%", height: "auto" };
        }
    };

    const getTonieboxIdFormatted = () => {
        return tonieboxCard.ID.replace(/(.{2})(?=.)/g, "$1:");
    };

    const handleSaveChanges = async () => {
        setIsModelModalOpen(false);
        if (boxName !== tonieboxName) await handleBoxNameSave();
        if (activeModel !== selectedModel) await handleModelSave();
    };

    const deleteToniebox = () => {
        const key = "loading" + tonieboxCard.ID;

        try {
            addLoadingNotification(
                key,
                t("tonieboxes.messages.deleting"),
                t("tonieboxes.messages.deletingDetails", { mac: tonieboxCard.ID })
            );

            api.apiPostTeddyCloudRaw("/api/settings/removeOverlay?overlay=" + tonieboxCard.ID)
                .then((response) => response.text())
                .then((data) => {
                    closeLoadingNotification(key);
                    if (data === "OK") {
                        addNotification(
                            NotificationTypeEnum.Success,
                            t("tonieboxes.messages.deleteSuccessful"),
                            t("tonieboxes.messages.deleteSuccessfulDetails", {
                                mac: tonieboxCard.ID,
                            }),
                            t("tonieboxes.navigationTitle")
                        );
                        window.location.reload();
                    } else {
                        addNotification(
                            NotificationTypeEnum.Error,
                            t("tonieboxes.messages.deleteFailed"),
                            t("tonieboxes.messages.deleteFailedDetails", {
                                mac: tonieboxCard.ID,
                            }),
                            t("tonieboxes.navigationTitle")
                        );
                    }
                })
                .catch((error) => {
                    closeLoadingNotification(key);
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("tonieboxes.messages.deleteFailed"),
                        t("tonieboxes.messages.deleteFailedDetails", {
                            mac: tonieboxCard.ID,
                        }) +
                            ": " +
                            error,
                        t("tonieboxes.navigationTitle")
                    );
                });
        } catch (error) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("tonieboxes.messages.deleteFailed"),
                t("tonieboxes.messages.deleteFailedDetails", {
                    mac: tonieboxCard.ID,
                }) +
                    ": " +
                    error,
                t("tonieboxes.navigationTitle")
            );
        }
    };

    const showDeleteConfirmDialog = () => {
        setIsConfirmDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteToniebox();
        setIsConfirmDeleteModalOpen(false);
    };

    const handleCancelDelete = () => {
        setIsConfirmDeleteModalOpen(false);
    };

    const handleApiAccessClick = async () => {
        try {
            api.apiPostTeddyCloudSetting("toniebox.api_access", !tonieboxAccessApi, tonieboxCard.ID)
                .then(() => {
                    triggerWriteConfig();
                    setTonieboxAccessApi(!tonieboxAccessApi);
                    if (tonieboxAccessApi) {
                        addNotification(
                            NotificationTypeEnum.Success,
                            t("tonieboxes.messages.apiAccessDisabled"),
                            t("tonieboxes.messages.apiAccessDisabledDetails", {
                                mac: tonieboxCard.ID,
                            }),
                            t("tonieboxes.navigationTitle")
                        );
                    } else {
                        addNotification(
                            NotificationTypeEnum.Success,
                            t("tonieboxes.messages.apiAccessEnabled"),
                            t("tonieboxes.messages.apiAccessEnabledDetails", {
                                mac: tonieboxCard.ID,
                            }),
                            t("tonieboxes.navigationTitle")
                        );
                    }
                })
                .catch((error) => {
                    throw new Error(error.status + " " + error.statusText);
                });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonieboxes.messages.apiAccessNotChangedError"),
                t("tonieboxes.messages.apiAccessNotChangedErrorDetails", {
                    mac: tonieboxCard.ID,
                }) + error,
                t("tonieboxes.navigationTitle")
            );
        }
    };

    const isSaveDisabled = boxName === tonieboxName && activeModel === selectedModel;

    return (
        <>
            <Card
                key={tonieboxCard.ID}
                hoverable={false}
                size="default"
                style={{ background: token.colorBgContainerDisabled, cursor: "default" }}
                title={<span>{tonieboxName}</span>}
                cover={
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                        }}
                    >
                        {lastPlayedTonieName}
                        <img
                            src={defaultBoxImage}
                            alt=""
                            style={{
                                position: "relative",
                                filter: "opacity(0)",
                                width: "100%",
                                height: "auto",
                            }}
                        />
                        {boxImage}
                    </div>
                }
                actions={
                    !readOnly
                        ? [
                              <>
                                  {!tonieboxAccessApi ? (
                                      <Tooltip title={t("tonieboxes.accessApiDisabled")}>
                                          <LockOutlined
                                              className="access-disabled"
                                              style={{ color: token.colorError, cursor: "pointer" }}
                                              onClick={handleApiAccessClick}
                                          />
                                      </Tooltip>
                                  ) : tonieboxStatus ? (
                                      <Tooltip title={t("tonieboxes.online")}>
                                          <WifiOutlined
                                              className="online"
                                              style={{ color: token.colorSuccess, cursor: "default" }}
                                          />
                                      </Tooltip>
                                  ) : (
                                      <Tooltip
                                          title={
                                              t("tonieboxes.offline") +
                                              (lastOnline ? " - " + t("tonieboxes.lastOnline") + ": " + lastOnline : "")
                                          }
                                      >
                                          <WifiOutlined
                                              className="offline"
                                              style={{
                                                  color: token.colorTextDescription,
                                                  cursor: "default",
                                              }}
                                          />
                                      </Tooltip>
                                  )}
                              </>,
                              <EditOutlined key="edit" onClick={() => showModelModal()} />,
                              <SafetyCertificateOutlined
                                  key="certificate"
                                  style={{ marginRight: 8 }}
                                  onClick={handleUploadCertificatesClick}
                              />,
                              <SettingOutlined
                                  key="settings"
                                  style={{ marginRight: 8 }}
                                  onClick={handleEditSettingsClick}
                              />,
                              <DeleteOutlined
                                  key="delete"
                                  style={{ marginRight: 8 }}
                                  onClick={showDeleteConfirmDialog}
                              />,
                          ]
                        : []
                }
            >
                <Meta
                    description={[
                        readOnly ? (
                            tonieboxStatus ? (
                                <Tooltip key="box-status-online" title={t("tonieboxes.online")}>
                                    <WifiOutlined
                                        className="online"
                                        style={{ color: token.colorSuccess, cursor: "default" }}
                                    />{" "}
                                </Tooltip>
                            ) : (
                                <Tooltip
                                    key="box-status-offline"
                                    title={
                                        t("tonieboxes.offline") +
                                        (lastOnline ? " - " + t("tonieboxes.lastOnline") + ": " + lastOnline : "")
                                    }
                                >
                                    <WifiOutlined
                                        className="offline"
                                        style={{
                                            color: token.colorTextDescription,
                                            cursor: "default",
                                        }}
                                    />{" "}
                                </Tooltip>
                            )
                        ) : null,
                        <span key="box-version">
                            {" "}
                            {(tonieboxVersion !== "UNKNOWN" && tonieboxVersion !== undefined && tonieboxVersion !== null
                                ? tonieboxVersion
                                : "MAC") + " "}
                        </span>,
                        cfwInstalled ? (
                            <Tooltip key="box-mac-cfw-link" title={t("tonieboxes.linkToBoxCFW")}>
                                <Link to={"http://" + lastIp} target="_blank">
                                    {getTonieboxIdFormatted()} <LinkOutlined />
                                </Link>
                            </Tooltip>
                        ) : (
                            <span key="box-mac">{getTonieboxIdFormatted()}</span>
                        ),
                    ]}
                />
            </Card>

            <EditModal
                open={isModelModalOpen}
                tonieboxName={tonieboxCard.boxName}
                tonieboxVersion={tonieboxVersion}
                tonieboxIdFormatted={getTonieboxIdFormatted()}
                boxName={boxName}
                originalBoxName={tonieboxName}
                selectedModel={selectedModel}
                onBoxNameChange={setBoxName}
                onSelectedModelChange={setSelectedModel}
                isSaveDisabled={isSaveDisabled}
                onCancel={handleModelCancel}
                onSave={handleSaveChanges}
            />

            <SettingsModal
                open={isEditSettingsModalOpen}
                overlayId={tonieboxCard.ID}
                tonieboxName={tonieboxCard.boxName}
                modalKey={modalKey}
                onClose={handleEditSettingsCancel}
            />

            <CertificatesModal
                open={isUploadCertificatesModalOpen}
                tonieboxName={tonieboxCard.boxName}
                overlayId={tonieboxCard.ID}
                options={options}
                onOk={handleUploadCertificatesOk}
                onCancel={handleUploadCertificatesCancel}
            />

            <DeleteModal
                open={isConfirmDeleteModalOpen}
                tonieboxName={tonieboxName}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
};
