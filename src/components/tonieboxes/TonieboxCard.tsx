import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Typography, Card, Button, Input, message, Modal, Divider, Select, theme } from "antd";
import {
    EditOutlined,
    SafetyCertificateOutlined,
    CloseOutlined,
    SettingOutlined,
    WifiOutlined,
    SaveFilled,
} from "@ant-design/icons";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { OptionsList, TeddyCloudApi } from "../../api";
import { TonieboxSettingsPage } from "./TonieboxSettingsPage";
import { TonieCardProps } from "../../components/tonies/TonieCard";
import { CertificateDragNDrop } from "../form/CertificatesDragAndDrop";
import GetBoxModelImages from "../../util/boxModels";

const api = new TeddyCloudApi(defaultAPIConfig());
const { Paragraph, Text } = Typography;
const { Meta } = Card;
const { useToken } = theme;

export type TonieboxCardList = {
    boxes: TonieboxCardProps[];
};

export type TonieboxCardProps = {
    ID: string;
    commonName: string;
    boxName: string;
    boxModel: string;
};

interface TonieboxImage {
    id: string;
    name: string;
    img_src: string;
    crop?: number[];
}

export const TonieboxCard: React.FC<{
    tonieboxCard: TonieboxCardProps;
    tonieboxImages: TonieboxImage[];
}> = ({ tonieboxCard, tonieboxImages }) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const [messageApi, contextHolder] = message.useMessage();
    const [tonieboxStatus, setTonieboxStatus] = useState<boolean>(false);
    const [tonieboxVersion, setTonieboxVersion] = useState<string>("");
    const [lastOnline, setLastOnline] = useState<string>("");
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

    const boxModelImages = GetBoxModelImages();
    const boxModelOptions = [{ label: t("tonieboxes.editModelModal.unsetBoxName"), value: "-1" }].concat(
        boxModelImages.map((v) => {
            return { label: v.name, value: v.id };
        })
    );

    useEffect(() => {
        const fetchTonieboxStatus = async () => {
            const tonieboxStatus = await api.apiGetTonieboxStatus(tonieboxCard.ID);
            setTonieboxStatus(tonieboxStatus);
        };
        fetchTonieboxStatus();

        const fetchTonieboxVersion = async () => {
            const tonieboxVersion = await api.apiGetTonieboxVersion(tonieboxCard.ID);
            const BoxVersions: { [key: string]: string } = {
                "0": "UNKNOWN",
                "1": "CC3200",
                "2": "CC3235",
                "3": "ESP32",
            };

            if (tonieboxVersion in BoxVersions) {
                const version = BoxVersions[tonieboxVersion as keyof typeof BoxVersions];
                setTonieboxVersion(version);
            } else {
                setTonieboxVersion("UNKNOWN");
            }
        };
        fetchTonieboxVersion();

        const fetchTonieboxLastRUID = async () => {
            const ruid = await api.apiGetTonieboxLastRUID(tonieboxCard.ID);

            if (ruid !== "ffffffffffffffff" && ruid !== "") {
                const fetchTonies = async () => {
                    const tonieData = await api.apiGetTagIndex(tonieboxCard.ID);
                    setLastPlayedTonie(tonieData.filter((tonieData) => tonieData.ruid === ruid));
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

        selectBoxImage(tonieboxCard.boxModel);
        setSelectedModel(tonieboxCard.boxModel);
    }, [tonieboxCard.ID, tonieboxCard.boxModel]);

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
                    src="https://cdn.tonies.de/thumbnails/03-0009-i.png"
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

    const setLastPlayedTonie = (tonie: TonieCardProps[]) => {
        setLastPlayedTonieName(
            <>
                <Link to={"/tonies?tonieRUID=" + tonie[0].ruid + "&overlay=" + tonieboxCard.ID}>
                    <img
                        src={tonie[0].tonieInfo.picture}
                        alt="Tonie"
                        title={
                            t("tonieboxes.lastPlayedTonie") +
                            tonie[0].tonieInfo.series +
                            (tonie[0].tonieInfo.episode ? " - " + tonie[0].tonieInfo.episode : "")
                        }
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
    const handleEditSettingsClick = () => {
        showEditSettingsModal();
    };
    const showEditSettingsModal = () => {
        setIsEditSettingsModalOpen(true);
    };
    const handleEditSettingsOk = async () => {
        setIsEditSettingsModalOpen(false);
    };
    const handleEditSettingsCancel = () => {
        setIsEditSettingsModalOpen(false);
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
            const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/boxModel?overlay=${tonieboxCard.ID}`;
            await fetch(url, {
                method: "POST",
                body: selectedModel.toString(),
                headers: {
                    "Content-Type": "text/plain",
                },
            })
                .then(() => {
                    triggerWriteConfig();
                })
                .catch((e) => {
                    message.error(t("tonieboxes.editModelModal.errorWhileSavingConfig"));
                });
            message.success(t("tonieboxes.editModelModal.successOnModelChange"));
        } catch (error) {
            message.error(
                t("tonieboxes.editModelModal.errorOnModelChange", {
                    error: error,
                })
            );
        }
    };
    const handleBoxNameSave = async () => {
        setTonieBoxName(boxName);
        const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
        };
        try {
            const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/boxName?overlay=${tonieboxCard.ID}`;
            await fetch(url, {
                method: "POST",
                body: boxName.toString(),
                headers: {
                    "Content-Type": "text/plain",
                },
            })
                .then(() => {
                    triggerWriteConfig();
                })
                .catch((e) => {
                    message.error(t("tonieboxes.editModelModal.errorWhileSavingConfig"));
                });
            message.success(t("tonieboxes.editModelModal.successOnNameChange"));
        } catch (error) {
            message.error(
                t("tonieboxes.editModelModal.errorOnNameChange", {
                    error: error,
                })
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
        if (boxName !== tonieboxName) handleBoxNameSave();

        if (activeModel !== selectedModel) handleModelSave();
    };

    const editModalFooter = (
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
            footer={editModalFooter}
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
                        <CloseOutlined
                            onClick={() => setBoxName(tonieboxName)}
                            style={{
                                color: boxName === tonieboxName ? token.colorTextDisabled : "",
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
            width="auto"
            open={isUploadCertificatesModalOpen}
            onOk={handleUploadCertificatesOk}
            onCancel={handleUploadCertificatesCancel}
        >
            <Paragraph>
                {t("tonieboxes.uploadTonieboxCertificatesModal.uploadPath")} :{" "}
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
            <TonieboxSettingsPage overlay={tonieboxCard.ID} />
        </Modal>
    );

    return (
        <>
            {contextHolder}
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
                            src={tonieboxImages.find((item: { id: string }) => item.id === "03-0009")?.img_src}
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
                        {tonieboxStatus ? (
                            <WifiOutlined
                                style={{ color: "green", cursor: "default" }}
                                title={t("tonieboxes.online")}
                            />
                        ) : (
                            <WifiOutlined
                                style={{
                                    color: token.colorTextDescription,
                                    cursor: "default",
                                }}
                                title={
                                    t("tonieboxes.offline") +
                                    (lastOnline ? " - " + t("tonieboxes.lastOnline") + ": " + lastOnline : "")
                                }
                            />
                        )}
                    </>,
                    <EditOutlined key="edit" onClick={() => showModelModal()} />,
                    <span key="settings" onClick={handleUploadCertificatesClick}>
                        <SafetyCertificateOutlined key="certificate" style={{ marginRight: 8 }} />
                    </span>,
                    <span key="settings" onClick={handleEditSettingsClick}>
                        <SettingOutlined key="edit" style={{ marginRight: 8 }} />
                    </span>,
                ]}
            >
                <Meta
                    description={
                        <div>
                            {(tonieboxVersion !== "UNKNOWN" ? tonieboxVersion : "MAC") +
                                ": " +
                                getTonieboxIdFormatted()}
                        </div>
                    }
                />
            </Card>
            {editTonieboxOverlaySettingsModal}
            {editTonieboxCertificateModal}
            {editTonieboxModal}
        </>
    );
};
