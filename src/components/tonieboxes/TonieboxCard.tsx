import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, message, Slider, Select, Modal, Badge } from 'antd';
import { InfoCircleOutlined, EditOutlined, SaveOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
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
}

export const TonieboxCard: React.FC<{ tonieboxCard: TonieboxCardProps }> = ({ tonieboxCard }) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [tonieboxStatus, setTonieboxStatus] = useState<boolean>(false);

    // isEditSettingsModal... --> Name of Toniebox, Certificates
    // isModelModal... --> Color of Toniebox to display image

    const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const [activeModel, setActiveModel] = useState(""); // tonieboxCard.tonieboxInfo.model);
    const [selectedModel, setSelectedModel] = useState("");

    const [boxImage, setBoxImage] = useState(<img src='https://cdn.tonies.de/thumbnails/03-0009-i.png' />);

    useEffect(() => {
      const fetchTonieboxStatus = async () => {
        // Perform API call to fetch Toniebox status
        const tonieboxStatus = await api.apiGetTonieboxStatus(tonieboxCard.commonName);
        setTonieboxStatus(tonieboxStatus);
      };

      fetchTonieboxStatus();
    }, []);

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
        setSelectedModel(activeModel);
        setIsModelModalOpen(true);
        setIsMoreOpen(false);
    };
    const handleModelOk = async () => {
        handleModelSave();
        setIsModelModalOpen(false);
    }
    const handleModelCancel = () => {
        setIsModelModalOpen(false);
    };
    const handleModelClick = () => {
        showModelModal();
    }

    const handleMoreOpenChange = (newOpen: boolean) => {
        setIsMoreOpen(newOpen);
    };

    const handleModelClearClick = () => {
        setSelectedModel(activeModel);
    };
    const handleModelSave = async () => {
        setActiveModel(selectedModel);
        setBoxImage(<img src={selectedModel} />);
        message.success( "Not implemented yet");
    }
    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };

    const title = `${tonieboxCard.commonName}`;

    const searchResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    }

    return (
        <>
            {contextHolder}
            <Card
                extra={<Button icon={<EditOutlined key="edit" onClick={handleModelClick} /> } />}
                hoverable
                size="default"
                title={<div><Badge dot status={tonieboxStatus ? "success" : "error"} /> {tonieboxCard.boxName}</div>}
                cover={boxImage}
                actions={
                    [
                        <SettingOutlined key="edit" onClick={handleEditClick} />,
                    ]}
            >
                <Meta description={"MAC: " + tonieboxCard.ID.replace(/(.{2})(?=.)/g, "$1:")} />
            </Card >
            <Modal title={t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettings", {"name": tonieboxCard.boxName})} width='auto' open={isEditSettingsModalOpen} onOk={handleEditOk} onCancel={handleEditCancel}>
                  <TonieboxSettingsPage overlay={tonieboxCard.ID}/>
            </Modal>
            <Modal title={t("tonieboxes.editModelModal.editModel", {"name": tonieboxCard.boxName})} open={isModelModalOpen} onOk={handleModelOk} onCancel={handleModelCancel}>
                 <p><Input name="boxName" value={tonieboxCard.boxName} addonBefore="Name" /></p>
                 <p><TonieboxModelSearch placeholder={t("tonieboxes.editModelModal.placeholderSearchForAModel")} onChange={searchResultChanged} /></p>
                 <p><Input value={selectedModel} onChange={handleModelInputChange} addonBefore={<CloseOutlined onClick={handleModelClearClick} />}
                    /></p>

               </Modal>
        </>
    );
};