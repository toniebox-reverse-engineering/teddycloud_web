import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Card, Button, Input, message, Modal, Badge } from 'antd';
import { EditOutlined, SafetyCertificateOutlined, SaveOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { OptionsList, TeddyCloudApi } from "../../api";
import { TonieboxModelSearch } from './TonieboxModelSearch';
import { TonieboxSettingsPage } from './TonieboxSettingsPage';
import { TonieCardProps } from '../../components/tonies/TonieCard';
import { CertificateDragNDrop } from '../form/CertificatesDragAndDrop';

const api = new TeddyCloudApi(defaultAPIConfig());
const { Paragraph } = Typography;
const { Meta } = Card;

export type TonieboxCardList = {
    boxes: TonieboxCardProps[];
}

export type TonieboxCardProps = {
    ID: string;
    commonName: string;
    boxName: string;
    boxModel: string;
}

interface TonieboxImage {
    id: string;
    name: string;
    img_src: string;
    crop?: number[];
}

export const TonieboxCard: React.FC<{ tonieboxCard: TonieboxCardProps, tonieboxImages: TonieboxImage[] }> = ({ tonieboxCard, tonieboxImages }) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [tonieboxStatus, setTonieboxStatus] = useState<boolean>(false);
    const [tonieboxVersion, setTonieboxVersion] = useState<string>("");
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
    const [searchFieldValue, setSearchFieldValue] = useState<string | undefined>(undefined);

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
                "3": "ESP32"
            };

            if (tonieboxVersion in BoxVersions) {
                const version = BoxVersions[tonieboxVersion as keyof typeof BoxVersions];
                setTonieboxVersion(version);
            } else {
                setTonieboxVersion("UNKNOWN");
            };

        };
        fetchTonieboxVersion();

        const fetchTonieboxLastRUID = async () => {
            const ruid = await api.apiGetTonieboxLastRUID(tonieboxCard.ID);

            if (ruid !== "ffffffffffffffff" && ruid !== "") {
                const fetchTonies = async () => {
                    const tonieData = await api.apiGetTagIndex();
                    setLastPlayedTonie(tonieData.filter(tonieData => tonieData.ruid === ruid));

                };
                fetchTonies();
            }
        };
        fetchTonieboxLastRUID();

        selectBoxImage(tonieboxCard.boxModel);
        setSelectedModel(tonieboxCard.boxModel);

    }, [tonieboxCard.ID, tonieboxCard.boxModel]);

    const selectBoxImage = (id: string) => {
        const selectedImage = tonieboxImages.find((item: { id: string }) => item.id === id);
        if (selectedImage) {
            setBoxImage(<img src={selectedImage.img_src} alt="" style={{ ...getCroppedImageStyle(id), 'position': 'absolute', 'top': '0', 'left': '0' }} />);
        } else {
            setBoxImage(<img src='https://cdn.tonies.de/thumbnails/03-0009-i.png' alt="" style={{ filter: "opacity(0.20)", width: '100%', height: 'auto', 'position': 'absolute', 'top': '0', 'left': '0' }} />);
            console.error('Selected image not found.');
        }
    };

    const setLastPlayedTonie = (tonie: TonieCardProps[]) => {
        setLastPlayedTonieName(
            <>
                <Link to={"/tonies?tonieRUID=" + tonie[0].ruid}><img src={tonie[0].tonieInfo.picture}
                    alt="Tonie"
                    title={t("tonieboxes.lastPlayedTonie") + tonie[0].tonieInfo.series + " - " + tonie[0].tonieInfo.episode}
                    style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 1, padding: 8, borderRadius: 4, height: "60%" }}
                /></Link>
            </>
        );
    }

    // certificates
    const handleUploadCertificatesClick = () => {
        const fetchOptions = async () => {
            const optionsRequest = (await api.apiGetIndexGet(tonieboxCard.ID)) as OptionsList;
            if (
                optionsRequest?.options?.length &&
                optionsRequest?.options?.length > 0
            ) {
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
    const handleModelClick = () => {
        showModelModal();
    }
    const showModelModal = () => {
        setSearchFieldValue(undefined);
        if (selectedModel === undefined) {
            setSelectedModel(activeModel);
        } else {
            setSelectedModel(selectedModel);
        }
        setIsModelModalOpen(true);
    };
    const handleModelOk = async () => {
        setSearchFieldValue(undefined)
        setSelectedModel(activeModel);
        setTonieBoxName(tonieboxName);
        setBoxName(tonieboxName);
        setIsModelModalOpen(false);
    };
    const handleModelCancel = () => {
        setSearchFieldValue(undefined)
        setSelectedModel(activeModel);
        setTonieBoxName(tonieboxName);
        setBoxName(tonieboxName);
        setIsModelModalOpen(false);
    };
    const handleModelClearClick = () => {
        setSearchFieldValue(undefined)
        setSelectedModel(activeModel);
    };
    const handleBoxNameClearClick = () => {
        setTonieBoxName(tonieboxName);
        setBoxName(tonieboxName);
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
            }).then(() => {
                triggerWriteConfig();
            }).catch((e) => {
                message.error("Error while saving config to file.");
            });
            message.success("Model saved successfully");
        } catch (error) {
            message.error(`Error saving model: ${error}`);
        }
    }
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
            }).then(() => {
                triggerWriteConfig();
            }).catch((e) => {
                message.error("Error while saving config to file.");
            });
            message.success("Name saved successfully");
        } catch (error) {
            message.error(`Error saving name: ${error}`);
        }
    }
    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };
    const searchResultChanged = (newValue: string) => {
        setSearchFieldValue(newValue);
        setSelectedModel(newValue);
    }

    const getCroppedImageStyle = (boxModel: string) => {
        const tonieboxImage = tonieboxImages.find(image => image.id === boxModel);
        if (tonieboxImage && tonieboxImage.crop) {
            const [x, y, scale] = tonieboxImage.crop;
            return {
                width: `100%`,
                height: `auto`,
                transform: `scale(${scale}) translateX(${x}px) translateY(${y}px)`,
            };
        } else {
            return { width: '100%', height: 'auto' };
        }
    };

    return (
        <>
            {contextHolder}
            <Card
                extra={<Button icon={<EditOutlined key="edit" onClick={handleModelClick} />} />}
                hoverable
                size="default"
                style={{ cursor: 'default' }}
                title={<span><Badge dot status={tonieboxStatus ? "success" : "error"} /> {tonieboxName}</span>}
                cover={<div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                    {lastPlayedTonieName}
                    { /* we need this "hidden image" of the grey toniebox to span the card cover to the right size. not beautiful, but unique */}
                    <img src={tonieboxImages.find((item: { id: string }) => item.id === '03-0009')?.img_src} alt="" style={{ position: 'relative', filter: "opacity(0)", width: '100%', height: 'auto' }} />
                    {boxImage}
                </div>}
                actions={[
                    <span key="settings" onClick={handleUploadCertificatesClick} >
                        <SafetyCertificateOutlined key="certificate" style={{ marginRight: 8 }} />{t("tonieboxes.uploadTonieboxCertificatesModal.Label")}
                    </span>,
                    <span key="settings" onClick={handleEditSettingsClick} >
                        <SettingOutlined key="edit" style={{ marginRight: 8 }} />{t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettingsLabel")}
                    </span>
                ]}
            >
                <Meta description={<div>{(tonieboxVersion !== 'UNKNOWN' ? tonieboxVersion : 'MAC') + ': ' + tonieboxCard.ID.replace(/(.{2})(?=.)/g, '$1:')}</div>} />
            </Card >
            <Modal title={t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettings", { "name": tonieboxCard.boxName })} width='auto' open={isEditSettingsModalOpen} onOk={handleEditSettingsOk} onCancel={handleEditSettingsCancel}>
                <TonieboxSettingsPage overlay={tonieboxCard.ID} />
            </Modal>
            <Modal title={t("tonieboxes.uploadTonieboxCertificatesModal.uploadTonieboxCertificates", { "name": tonieboxCard.boxName })} width='auto' open={isUploadCertificatesModalOpen} onOk={handleUploadCertificatesOk} onCancel={handleUploadCertificatesCancel}>
                <Paragraph>{t("tonieboxes.uploadTonieboxCertificatesModal.uploadPath")} : <i>{options?.options?.find((option: { iD: string; }) => option.iD === "core.certdir")?.value}</i> <small>{options?.options?.find((option: { iD: string; }) => option.iD === "core.certdir")?.overlayed ? t("tonieboxes.uploadTonieboxCertificatesModal.boxSpecific") : t("tonieboxes.uploadTonieboxCertificatesModal.AttentionGeneralPath")}</small></Paragraph>
                <CertificateDragNDrop overlay={tonieboxCard.ID} />
            </Modal>
            <Modal title={t("tonieboxes.editModelModal.editModel", { "name": tonieboxCard.boxName })} open={isModelModalOpen} onOk={handleModelOk} onCancel={handleModelCancel} afterClose={() => setSearchFieldValue('')}>
                <Paragraph><Input name="boxName" value={boxName} onChange={(e) => setBoxName(e.target.value)}
                    addonBefore={
                        [
                            boxName === tonieboxName ?
                                (<CloseOutlined style={{ color: 'lightgray', marginRight: 16 }} />) :
                                (<CloseOutlined style={{ marginRight: 16 }} onClick={handleBoxNameClearClick} />),
                            t("tonieboxes.editModelModal.name")
                        ]
                    }
                    addonAfter={boxName === tonieboxName ?
                        (<SaveOutlined key="saveboxNameNoClick" style={{ color: 'lightgray' }} />) :
                        (<SaveOutlined key="saveboxName" onClick={handleBoxNameSave} />)} /></Paragraph>
                <Paragraph><Input name="boxModel" readOnly value={selectedModel} width='auto' onChange={handleModelInputChange}
                    addonBefore={
                        [
                            activeModel === selectedModel ?
                                (<CloseOutlined style={{ color: 'lightgray', marginRight: 16 }} />) :
                                (<CloseOutlined style={{ marginRight: 16 }} onClick={handleModelClearClick} />),
                            t("tonieboxes.editModelModal.model")
                        ]
                    }
                    addonAfter={activeModel === selectedModel ?
                        (<SaveOutlined key="saveModelNoClick" style={{ color: 'lightgray' }} />) :
                        (<SaveOutlined key="saveModel" onClick={handleModelSave} />)} /></Paragraph>
                <Paragraph><TonieboxModelSearch placeholder={t("tonieboxes.editModelModal.placeholderSearchForAModel")} onChange={searchResultChanged} value={searchFieldValue} /></Paragraph>
            </Modal>
        </>
    );
};