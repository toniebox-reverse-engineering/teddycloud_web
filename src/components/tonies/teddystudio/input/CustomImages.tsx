import React from "react";
import { Button, Divider, Input, Upload } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export interface CustomItem {
    image?: string;
    text?: string;
}

interface CustomImagesProps {
    customItems: CustomItem[];
    onTextChange: (index: number, text: string) => void;
    onRemoveItem: (index: number) => void;
    onAddImage: (file: File) => boolean;
}

export const CustomImages: React.FC<CustomImagesProps> = ({ customItems, onTextChange, onRemoveItem, onAddImage }) => {
    const { t } = useTranslation();

    const handleCustomTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
        onTextChange(index, e.target.value);
    };

    return (
        <>
            <Divider>{t("tonies.teddystudio.customImage")}</Divider>
            <p style={{ fontSize: "small", marginBottom: 8 }}>{t("tonies.teddystudio.customImageHint")}</p>
            <div style={{ display: "flex", gap: 16, flexDirection: "column", marginBottom: 16 }}>
                {customItems.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {item.image && (
                            <img
                                src={item.image}
                                alt="preview"
                                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                            />
                        )}

                        <Input.TextArea
                            placeholder={t("tonies.teddystudio.customImageTitle")}
                            value={item.text}
                            onChange={(e) => handleCustomTextChange(e, idx)}
                            style={{ flex: 1 }}
                        />

                        <Button icon={<DeleteOutlined />} onClick={() => onRemoveItem(idx)} />
                    </div>
                ))}

                <div style={{ alignSelf: "end" }}>
                    <Upload showUploadList={false} maxCount={1} beforeUpload={onAddImage}>
                        <Button icon={<PlusOutlined />}>{t("tonies.teddystudio.customImageUpload")}</Button>
                    </Upload>
                </div>
            </div>
        </>
    );
};
