import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, message, Slider, Select, Modal } from 'antd';
import { InfoCircleOutlined, EditOutlined, SaveOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { TonieboxModelSearch } from './TonieboxModelSearch';
import { TonieboxSettingsPage } from './TonieboxSettingsPage';

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

    // isEditSettingsModal... --> Name of Toniebox, Certificates
    // isModelModal... --> Color of Toniebox to display image

    const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const [activeModel, setActiveModel] = useState(""); // tonieboxCard.tonieboxInfo.model);
    const [selectedModel, setSelectedModel] = useState("");

    const [boxImage, setBoxImage] = useState(<img src='https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/Toniebox_grey_d-0hENHTGx.png' />);

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
                title={tonieboxCard.boxName}
                cover={boxImage}
                actions={
                    [
                        <SettingOutlined key="edit" onClick={handleEditClick} />,
                    ]}
            >
                <Meta description={"MAC: " + tonieboxCard.ID.replace(/(.{2})(?=.)/g, "$1:")} />
            </Card >
            <Modal title={t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettings", {"name": tonieboxCard.boxName})} open={isEditSettingsModalOpen} onOk={handleEditOk} onCancel={handleEditCancel}>
                  <TonieboxSettingsPage overlay={tonieboxCard.ID}/>
            </Modal>
            <Modal title={t("tonieboxes.editModelModal.editModel", {"name": tonieboxCard.boxName})} open={isModelModalOpen} onOk={handleModelOk} onCancel={handleModelCancel}>
                 <p><Input name="boxName" value={tonieboxCard.boxName} addonBefore="Name" /></p>
                 <p><TonieboxModelSearch placeholder={t("tonieboxes.editModelModal.placeholderSearchForAModel")} style={{ width: 500 }} onChange={searchResultChanged} /></p>
                 <p><Input value={selectedModel} onChange={handleModelInputChange} addonBefore={<CloseOutlined onClick={handleModelClearClick} />}
                    /></p>

               </Modal>
        </>
    );
};