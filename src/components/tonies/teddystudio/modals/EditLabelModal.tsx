import React, { useEffect, useState } from "react";
import { Modal, Input, Form, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { MergedItem } from "../hooks/useCustomItems";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const { Dragger } = Upload;

interface EditLabelModalProps {
    open: boolean;
    item: MergedItem | null;
    onCancel: () => void;
    onSave: (values: { text: string; episodes: string; trackTitles: string[]; picture: string }) => void;
}

export const EditLabelModal: React.FC<EditLabelModalProps> = ({ open, item, onCancel, onSave }) => {
    const { t } = useTranslation();
    const [text, setText] = useState("");
    const [episodes, setEpisodes] = useState("");
    const [trackTitlesText, setTrackTitlesText] = useState("");

    const [originalPicture, setOriginalPicture] = useState("");
    const [picture, setPicture] = useState("");

    useEffect(() => {
        if (!item) {
            setText("");
            setEpisodes("");
            setTrackTitlesText("");
            setOriginalPicture("");
            setPicture("");
            return;
        }

        setText(item.text ?? "");
        setEpisodes(item.episodes ?? "");
        setTrackTitlesText((item.trackTitles ?? []).join("\n"));

        const pic = (item as any).pic ?? "";
        setOriginalPicture(pic);
        setPicture(pic);
    }, [item]);

    const handleOk = () => {
        const trackTitles = trackTitlesText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        onSave({
            text,
            episodes,
            trackTitles,
            picture,
        });
    };

    const handleFileToDataUrl = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setPicture(reader.result as string); // neue Preview
        };
        reader.readAsDataURL(file);
    };

    return (
        <Modal
            open={open}
            width="80%"
            style={{ maxWidth: 600 }}
            title={t("tonies.teddystudio.labelEditTitle")}
            okText={t("tonies.teddystudio.save")}
            cancelText={t("tonies.teddystudio.cancel")}
            onOk={handleOk}
            onCancel={onCancel}
        >
            <Form layout="vertical">
                <Form.Item label={t("tonies.teddystudio.labelImage")}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        {picture && (
                            <img
                                src={picture}
                                alt="preview"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: 200,
                                    borderRadius: 8,
                                }}
                            />
                        )}
                        <Dragger
                            name="file"
                            multiple={false}
                            showUploadList={false}
                            accept="image/*"
                            beforeUpload={(file) => {
                                handleFileToDataUrl(file);
                                return false;
                            }}
                            style={{ padding: 8 }}
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">{t("tonies.teddystudio.replaceLabelImage")}</p>
                        </Dragger>
                    </div>
                </Form.Item>
                <Form.Item label={t("tonies.teddystudio.series")}>
                    <Input value={text} onChange={(e) => setText(e.target.value)} />
                </Form.Item>

                <Form.Item label={t("tonies.teddystudio.episodes")}>
                    <Input value={episodes} onChange={(e) => setEpisodes(e.target.value)} />
                </Form.Item>

                <Form.Item label={t("tonies.teddystudio.trackTitles")}>
                    <TextArea rows={8} value={trackTitlesText} onChange={(e) => setTrackTitlesText(e.target.value)} />
                </Form.Item>
            </Form>
        </Modal>
    );
};
