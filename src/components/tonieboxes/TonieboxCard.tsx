import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Typography, Card, Button, Input, Modal, Divider, Select, theme, Tooltip } from "antd";
import {
    EditOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    WifiOutlined,
    SaveFilled,
    DeleteOutlined,
    LockOutlined,
    LinkOutlined,
    RollbackOutlined,
} from "@ant-design/icons";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { OptionsList, TeddyCloudApi } from "../../api";

import { tonieboxDefaultImageUrl } from "../../constants";

import { TonieCardProps } from "../../types/tonieTypes";
import { BoxVersionsEnum, TonieboxCardProps, TonieboxImage } from "../../types/tonieboxTypes";

import { TonieboxSettingsPage } from "./TonieboxSettingsPage";
import { CertificateDragNDrop } from "../form/CertificatesDragAndDrop";
import GetBoxModelImages from "../../utils/boxModels";
import ConfirmationDialog from "../utils/ConfirmationDialog";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph, Text } = Typography;
const { Meta } = Card;
const { useToken } = theme;

export const TonieboxCard: React.FC<{
    tonieboxCard: TonieboxCardProps;
    tonieboxImages: TonieboxImage[];
}> = ({ tonieboxCard, tonieboxImages }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            const tonieboxStatus = await api.apiGetTonieboxStatus(tonieboxCard.ID);
            setTonieboxStatus(tonieboxStatus);
        };
        fetchTonieboxStatus();

        const fetchTonieboxVersion = async () => {
            const tonieboxVersion = await api.apiGetTonieboxVersion(tonieboxCard.ID);
            const BoxVersions: { [key: string]: BoxVersionsEnum } = {
                "0": BoxVersionsEnum.unknown,
                "1": BoxVersionsEnum.cc3200,
                "2": BoxVersionsEnum.cc3235,
                "3": BoxVersionsEnum.esp32,
            };

            if (tonieboxVersion in BoxVersions) {
                const version = BoxVersions[tonieboxVersion as keyof typeof BoxVersions];
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
                const fetchTonies = async () => {
                    const tonieData = await api.apiGetTagIndex(tonieboxCard.ID);
                    setLastPlayedTonie(
                        tonieData.filter((tonieData) => tonieData.ruid === ruid),
                        ruidTime
                    );
                };
                fetchTonies();
            }
        };
        fetchTonieboxLastRUID();

        if (!tonieboxStatus) {
            const fetchTonieboxLastOnline = async () => {
                const lastOnline = await api.apiGetLastOnline(tonieboxCard.ID);
                setLastOnline(lastOnline);
            };
            fetchTonieboxLastOnline();
        }

        const fetchTonieboxLastIp = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("internal.ip", tonieboxCard.ID);
            const lastIp = await response.text();
            setLastIp(lastIp);
        };
        fetchTonieboxLastIp();

        selectBoxImage(tonieboxCard.boxModel);
        setSelectedModel(tonieboxCard.boxModel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tonieboxCard.ID, tonieboxCard.boxModel]);

    useEffect(() => {
        if (lastIp && tonieboxVersion === BoxVersionsEnum.cc3200) {
            // only if lastIp is set and box version is CC3200
            // we check for CFW using battery status API call
            try {
                fetch(`http://${lastIp}/api/ajax?cmd=box-battery&sub=stats`)
                    .then((response) => response.text())
                    .then((value) => {
                        console.log("Battery Stats fetched --> assume CFW active");
                        setCFWInstalled(true);
                    })
                    .catch((error) => {
                        console.log("No Battery Stats fetched --> assume CFW not active");
                        setCFWInstalled(false);
                    });
            } catch (error) {
                console.log("No Battery Stats fetched --> assume CFW not active");
                setCFWInstalled(false);
            }
        }
    }, [lastIp, tonieboxVersion]);

    const boxModelImages = GetBoxModelImages();

    const boxModelOptions = [{ label: t("tonieboxes.editModelModal.unsetBoxName"), value: "-1" }].concat(
        boxModelImages.boxModelImages.map((v) => {
            return { label: v.name, value: v.id };
        })
    );

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
                        top: "0",
                        left: "0",
                    }}
                />
            );
        } else {
            setBoxImage(
                <img
                    src={tonieboxDefaultImageUrl}
                    alt=""
                    style={{
                        filter: "opacity(0.20)",
                        width: "100%",
                        height: "auto",
                        position: "absolute",
                        top: "0",
                        left: "0",
                    }}
                />
            );
        }
    };

    const setLastPlayedTonie = (tonie: TonieCardProps[], time?: string) => {
        setLastPlayedTonieName(
            <>
                <Link to={"/tonies?tonieRUID=" + tonie[0].ruid + "&overlay=" + tonieboxCard.ID}>
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
            </>
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
        showUploadCertificatesModal();
    };
    const showUploadCertificatesModal = () => {
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
    const handleEditSettingsOk = async () => {
        setIsEditSettingsModalOpen(false);
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
        const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
        };

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

        const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
        };

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
                width: `100%`,
                height: `auto`,
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

    const editTonieboxModalFooter = (
        <>
            <Button
                type="primary"
                onClick={handleSaveChanges}
                disabled={boxName === tonieboxName && activeModel === selectedModel}
            >
                <SaveFilled key="saveClick" /> {t("tonies.editModal.save")}
            </Button>
        </>
    );

    const editTonieboxModal = (
        <Modal
            title={
                <>
                    <h3>
                        {t("tonieboxes.editModelModal.editModel", {
                            name: tonieboxCard.boxName,
                        })}
                        <br />
                        <Text type="secondary">
                            {(tonieboxVersion !== "UNKNOWN" ? tonieboxVersion : "MAC") +
                                ": " +
                                getTonieboxIdFormatted()}
                        </Text>
                    </h3>
                </>
            }
            open={isModelModalOpen}
            footer={editTonieboxModalFooter}
            onCancel={handleModelCancel}
        >
            <Divider orientation="left" orientationMargin="0">
                {t("tonieboxes.editModelModal.name")}
            </Divider>
            <Paragraph>
                <Input
                    name="boxName"
                    value={boxName}
                    onChange={(e) => setBoxName(e.target.value)}
                    addonBefore={
                        <RollbackOutlined
                            onClick={() => setBoxName(tonieboxName)}
                            style={{
                                color: boxName === tonieboxName ? token.colorTextDisabled : token.colorText,
                                cursor: boxName === tonieboxName ? "default" : "pointer",
                            }}
                        />
                    }
                />
            </Paragraph>
            <Divider orientation="left" orientationMargin="0">
                {t("tonieboxes.editModelModal.model")}
            </Divider>
            <Paragraph>
                <Select options={boxModelOptions} value={selectedModel} onChange={(value) => setSelectedModel(value)} />
            </Paragraph>
        </Modal>
    );

    const editTonieboxCertificateModal = (
        <Modal
            title={t("tonieboxes.uploadTonieboxCertificatesModal.uploadTonieboxCertificates", {
                name: tonieboxCard.boxName,
            })}
            open={isUploadCertificatesModalOpen}
            onOk={handleUploadCertificatesOk}
            onCancel={handleUploadCertificatesCancel}
        >
            <Paragraph>
                {t("tonieboxes.uploadTonieboxCertificatesModal.uploadPath")}{" "}
                <i>{options?.options?.find((option: { iD: string }) => option.iD === "core.certdir")?.value}</i>{" "}
                <small>
                    {options?.options?.find((option: { iD: string }) => option.iD === "core.certdir")?.overlayed
                        ? t("tonieboxes.uploadTonieboxCertificatesModal.boxSpecific")
                        : t("tonieboxes.uploadTonieboxCertificatesModal.AttentionGeneralPath")}
                </small>
            </Paragraph>
            <CertificateDragNDrop overlay={tonieboxCard.ID} />
        </Modal>
    );

    const editTonieboxOverlaySettingsModal = (
        <Modal
            title={t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettings", {
                name: tonieboxCard.boxName,
            })}
            width="auto"
            open={isEditSettingsModalOpen}
            onOk={handleEditSettingsOk}
            onCancel={handleEditSettingsCancel}
        >
            <TonieboxSettingsPage overlay={tonieboxCard.ID} key={modalKey} />
        </Modal>
    );

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

    const deleteTonieboxModal = (
        <ConfirmationDialog
            title={t("tonieboxes.confirmDeleteModal")}
            open={isConfirmDeleteModalOpen}
            okText={t("tonieboxes.delete")}
            cancelText={t("tonieboxes.cancel")}
            content={t("tonieboxes.confirmDeleteDialog", { tonieboxToDelete: tonieboxName })}
            handleOk={handleConfirmDelete}
            handleCancel={handleCancelDelete}
        />
    );

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.errorWhileSavingConfig"),
                t("settings.errorWhileSavingConfigDetails") + error,
                t("tonieboxes.navigationTitle")
            );
        }
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

    return (
        <>
            <Card
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
                        {/* we need this "hidden image" of the grey toniebox to span the card cover to the right size. not beautiful, but unique */}
                        <img
                            src={tonieboxDefaultImageUrl}
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
                actions={[
                    <>
                        {!tonieboxAccessApi ? (
                            <Tooltip title={t("tonieboxes.accessApiDisabled")}>
                                <LockOutlined
                                    style={{ color: "red", cursor: "pointer" }}
                                    onClick={handleApiAccessClick}
                                />
                            </Tooltip>
                        ) : tonieboxStatus ? (
                            <Tooltip title={t("tonieboxes.online")}>
                                <WifiOutlined style={{ color: "green", cursor: "default" }} />
                            </Tooltip>
                        ) : (
                            <Tooltip
                                title={
                                    t("tonieboxes.offline") +
                                    (lastOnline ? " - " + t("tonieboxes.lastOnline") + ": " + lastOnline : "")
                                }
                            >
                                <WifiOutlined
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
                    <SettingOutlined key="edit" style={{ marginRight: 8 }} onClick={handleEditSettingsClick} />,
                    <DeleteOutlined key="delete" style={{ marginRight: 8 }} onClick={showDeleteConfirmDialog} />,
                ]}
            >
                <Meta
                    description={[
                        (tonieboxVersion !== "UNKNOWN" && tonieboxVersion !== undefined && tonieboxVersion !== null
                            ? tonieboxVersion
                            : "MAC") + " ",
                        cfwInstalled ? (
                            <Tooltip title={t("tonieboxes.linkToBoxCFW")}>
                                <Link to={"http://" + lastIp} target="_blank">
                                    {getTonieboxIdFormatted()} <LinkOutlined />
                                </Link>
                            </Tooltip>
                        ) : (
                            getTonieboxIdFormatted()
                        ),
                    ]}
                />
            </Card>
            {editTonieboxOverlaySettingsModal}
            {editTonieboxCertificateModal}
            {editTonieboxModal}
            {deleteTonieboxModal}
        </>
    );
};
