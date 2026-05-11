import React, { useRef, useState } from "react";
import { Button, Tag, Typography, Upload, UploadProps } from "antd";
import { CheckCircleOutlined, PlusOutlined, PictureOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;

export interface CustomItem {
    image?: string;
    text?: string;
}

interface CustomImagesProps {
    customItems: CustomItem[];
    onAddImage: (file: File) => boolean;
    onOpenImageManager: () => void;
}

export const CustomImages: React.FC<CustomImagesProps> = ({
    customItems,
    onAddImage,
    onOpenImageManager,
}) => {
    const { t } = useTranslation();

    const [showHint, setShowHint] = useState(false);
    const [isFading, setIsFading] = useState(false);

    const hideTimerRef = useRef<number | null>(null);

    const handleBeforeUpload: UploadProps["beforeUpload"] = (file) => {
        onAddImage(file);
        setShowHint(true);
        setIsFading(false);
        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
        }
        hideTimerRef.current = window.setTimeout(() => {
            setIsFading(true);
            window.setTimeout(() => setShowHint(false), 300);
        }, 2000);
    };

    return (
        <>
            <Paragraph style={{ marginBottom: 8, marginTop: 8 }}>
                {t("tonies.teddystudio.customImageHint")}
            </Paragraph>
            <div style={{ display: "flex", gap: 16, flexDirection: "column", marginBottom: 16 }}>
                <div style={{ alignSelf: "flex-start" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Upload
                            showUploadList={false}
                            maxCount={1}
                            beforeUpload={handleBeforeUpload}
                        >
                            <Button icon={<PlusOutlined />}>
                                {t("tonies.teddystudio.customImageUpload")}
                            </Button>
                        </Upload>
                        <Button icon={<PictureOutlined />} onClick={onOpenImageManager}>
                            {t("tonies.imageManager.title")}
                        </Button>
                    </div>
                    {showHint && (
                        <div style={{ marginTop: 4 }}>
                            <Tag
                                icon={<CheckCircleOutlined />}
                                color="success"
                                style={{
                                    textWrap: "wrap",
                                    opacity: isFading ? 0 : 1,
                                    transition: "opacity 0.3s ease-in-out",
                                }}
                            >
                                {t("tonies.teddystudio.addedCustomImageHint")}
                            </Tag>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
