import React, { useEffect, useState } from "react";
import { Modal, Input, Form } from "antd";
import { MergedItem } from "../hooks/useCustomItems";

const { TextArea } = Input;

interface EditLabelTextsModalProps {
    open: boolean;
    item: MergedItem | null;
    onCancel: () => void;
    onSave: (values: { text: string; episodes: string; trackTitles: string[] }) => void;
}

export const EditLabelTextsModal: React.FC<EditLabelTextsModalProps> = ({ open, item, onCancel, onSave }) => {
    const [text, setText] = useState("");
    const [episodes, setEpisodes] = useState("");
    const [trackTitlesText, setTrackTitlesText] = useState("");

    useEffect(() => {
        if (!item) {
            setText("");
            setEpisodes("");
            setTrackTitlesText("");
            return;
        }
        setText(item.text ?? "");
        setEpisodes(item.episodes ?? "");
        setTrackTitlesText((item.trackTitles ?? []).join("\n"));
    }, [item]);

    const handleOk = () => {
        const trackTitles = trackTitlesText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        onSave({ text, episodes, trackTitles });
    };

    return (
        <Modal open={open} title="Edit tracklist" okText="Save" cancelText="Cancel" onOk={handleOk} onCancel={onCancel}>
            <Form layout="vertical">
                <Form.Item label="Text">
                    <Input value={text} onChange={(e) => setText(e.target.value)} />
                </Form.Item>

                <Form.Item label="Episodes (raw)">
                    <TextArea
                        rows={4}
                        value={episodes}
                        onChange={(e) => setEpisodes(e.target.value)}
                        placeholder="Raw episodes string…"
                    />
                </Form.Item>

                <Form.Item label="Track titles (one per line)">
                    <TextArea
                        rows={8}
                        value={trackTitlesText}
                        onChange={(e) => setTrackTitlesText(e.target.value)}
                        placeholder="Track 1&#10;Track 2&#10;Track 3"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
