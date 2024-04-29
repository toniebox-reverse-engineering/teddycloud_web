import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, message, Modal, Badge } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { TonieboxModelSearch } from './TonieboxModelSearch';
import { TonieboxSettingsPage } from './TonieboxSettingsPage';

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

    const [boxImage, setBoxImage] = useState(<img src='https://cdn.tonies.de/thumbnails/03-0009-i.png' alt="" />);

    const boxModelImages = [
        { id: '03-0013', name: 'Green', img_src: 'https://cdn.tonies.de/thumbnails/03-0013-i.png' },
        { id: '03-0012', name: 'Light Blue', img_src: 'https://cdn.tonies.de/thumbnails/03-0012-i.png' },
        { id: '03-0011', name: 'Red', img_src: 'https://cdn.tonies.de/thumbnails/03-0011-i.png' },
        { id: '03-0014', name: 'Pink', img_src: 'https://cdn.tonies.de/thumbnails/03-0014-i.png' },
        { id: '03-0010', name: 'Purple', img_src: 'https://cdn.tonies.de/thumbnails/03-0010-i.png' },
        { id: '03-0009', name: 'Grey', img_src: 'https://cdn.tonies.de/thumbnails/03-0009-i.png' },
        { id: '99-0100', name: 'Red - Disney 100 Limited Edition', img_src: 'https://www.babyone.at/media/1e/e1/b0/1687489451/58525690_shop3.png' },
        { id: '03-0005', name: 'Dark Grey - Unter meinem Bett Limited Edition', img_src: 'https://cdn.tonies.de/thumbnails/03-0005-i.png' },
        { id: '99-0003', name: 'Black - 3 Fragezeichen Limited Edition', img_src: 'https://www.galaxus.ch/im/Files/3/8/3/5/4/8/6/0/10000490-50001308-sRGB-b.png' },
        { id: '03-0008', name: 'Turquoise - Limited Edition', img_src: 'https://cdn.tonies.de/thumbnails/03-0008-i.png' },
        { id: '99-0002', name: 'Gulli - Limited Edition', img_src: 'https://i.ebayimg.com/images/g/lHIAAOSwyLtjiQGt/s-l1600.jpg' },
    ];

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

    const showEditSettingsModal = () => {
        setIsEditSettingsModalOpen(true);
    };

    const handleEditOk = async () => {
        setIsEditSettingsModalOpen(false);
    };

    const handleEditCancel = () => {
        setIsEditSettingsModalOpen(false);
    };

    const handleEditClick = () => {
        showEditSettingsModal();
    }

    const showModelModal = () => {

        if (selectedModel === undefined) {
            setSelectedModel(activeModel);
        } else {
            setSelectedModel(selectedModel);
        }
        setIsModelModalOpen(true);
    };

    const handleModelOk = async () => {
        setSelectedModel(activeModel);
        setTonieBoxName(tonieboxName);
        setBoxName(tonieboxName);
        setIsModelModalOpen(false);
    }

    const handleModelCancel = () => {
        setSelectedModel(activeModel);
        setTonieBoxName(tonieboxName);
        setBoxName(tonieboxName);
        setIsModelModalOpen(false);
    };

    const handleModelClick = () => {
        showModelModal();
    }

    const handleModelClearClick = () => {
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
                message.error("Error while sending data to server.");
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
                message.error("Error while sending data to server.");
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
        setSelectedModel(newValue);
    }

    return (
        <>
            {contextHolder}
            <Card
                extra={<Button icon={<EditOutlined key="edit" onClick={handleModelClick} />} />}
                hoverable
                size="default"
                title={<div><Badge dot status={tonieboxStatus ? "success" : "error"} /> {tonieboxName}</div>}
                cover={boxImage}
                actions={[<SettingOutlined key="edit" onClick={handleEditClick} />]}
            >
                <Meta description={"MAC: " + tonieboxCard.ID.replace(/(.{2})(?=.)/g, "$1:")} />
            </Card >
            <Modal title={t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettings", { "name": tonieboxCard.boxName })} width='auto' open={isEditSettingsModalOpen} onOk={handleEditOk} onCancel={handleEditCancel}>
                <TonieboxSettingsPage overlay={tonieboxCard.ID} />
            </Modal>
            <Modal title={t("tonieboxes.editModelModal.editModel", { "name": tonieboxCard.boxName })} open={isModelModalOpen} onOk={handleModelOk} onCancel={handleModelCancel}>
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
                <p><TonieboxModelSearch placeholder={t("tonieboxes.editModelModal.placeholderSearchForAModel")} onChange={searchResultChanged} /></p>
            </Modal>
        </>
    );
};