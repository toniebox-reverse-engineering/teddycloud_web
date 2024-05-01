import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, message, Modal, Badge } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { TonieboxModelSearch } from './TonieboxModelSearch';
import { TonieboxSettingsPage } from './TonieboxSettingsPage';
import { boxModelImages } from '../../util/boxModels';

const api = new TeddyCloudApi(defaultAPIConfig());

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

export const TonieboxCard: React.FC<{ tonieboxCard: TonieboxCardProps }> = ({ tonieboxCard }) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [tonieboxStatus, setTonieboxStatus] = useState<boolean>(false);
    const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [activeModel, setActiveModel] = useState<string>(tonieboxCard.boxModel);
    const [selectedModel, setSelectedModel] = useState<string>(tonieboxCard.boxModel);
    const [boxName, setBoxName] = useState(tonieboxCard.boxName);
    const [tonieboxName, setTonieBoxName] = useState(tonieboxCard.boxName);
    const [boxImage, setBoxImage] = useState(<img src='https://cdn.tonies.de/thumbnails/03-0009-i.png' alt="" style={{ filter: "opacity(0.20)" }} />);
    const [searchFieldValue, setSearchFieldValue] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchTonieboxStatus = async () => {
            const tonieboxStatus = await api.apiGetTonieboxStatus(tonieboxCard.commonName);
            setTonieboxStatus(tonieboxStatus);
        };

        fetchTonieboxStatus();

        selectBoxImage(tonieboxCard.boxModel);

        setSelectedModel(tonieboxCard.boxModel);

    }, [tonieboxCard.commonName, tonieboxCard.boxModel]);

    const selectBoxImage = (id: string) => {
        const selectedImage = boxModelImages.find(item => item.id === id);
        if (selectedImage) {
            setBoxImage(<img src={selectedImage.img_src} alt="" />);
        }
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

    return (
        <>
            {contextHolder}
            <Card
                extra={<Button icon={<EditOutlined key="edit" onClick={handleModelClick} />} />}
                hoverable
                size="default"
                style={{ cursor: 'default' }}
                title={<span><Badge dot status={tonieboxStatus ? "success" : "error"} /> {tonieboxName}</span>}
                cover={boxImage}
                actions={[<span key="settings" onClick={handleEditSettingsClick} >
                    <SettingOutlined key="edit" style={{ marginRight: 8 }} />{t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettingsLabel")}
                </span>]}
            >
                <Meta description={"MAC: " + tonieboxCard.ID.replace(/(.{2})(?=.)/g, "$1:")} />
            </Card >
            <Modal title={t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettings", { "name": tonieboxCard.boxName })} width='auto' open={isEditSettingsModalOpen} onOk={handleEditSettingsOk} onCancel={handleEditSettingsCancel}>
                <TonieboxSettingsPage overlay={tonieboxCard.ID} />
            </Modal>
            <Modal title={t("tonieboxes.editModelModal.editModel", { "name": tonieboxCard.boxName })} open={isModelModalOpen} onOk={handleModelOk} onCancel={handleModelCancel} afterClose={() => setSearchFieldValue('')}>
                <p><Input name="boxName" value={boxName} onChange={(e) => setBoxName(e.target.value)}
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
                        (<SaveOutlined key="saveboxName" onClick={handleBoxNameSave} />)} /></p>
                <p><Input name="boxModel" readOnly value={selectedModel} width='auto' onChange={handleModelInputChange}
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
                        (<SaveOutlined key="saveModel" onClick={handleModelSave} />)} /></p>
                <p><TonieboxModelSearch placeholder={t("tonieboxes.editModelModal.placeholderSearchForAModel")} onChange={searchResultChanged} value={searchFieldValue} /></p>
            </Modal>
        </>
    );
};