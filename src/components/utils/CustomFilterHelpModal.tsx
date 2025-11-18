import React from "react";
import { Modal, Typography, Table } from "antd";
import { useTranslation } from "react-i18next";

const { Paragraph, Text } = Typography;

interface CustomFilterHelpModalProps {
    visible: boolean;
    onClose: () => void;
}

const CustomFilterHelpModal: React.FC<CustomFilterHelpModalProps> = ({ visible, onClose }) => {
    const { t } = useTranslation();

    const fields = [
        { field: "series", description: t("tonies.tonies.filterBar.customFilterHelp.fields.series") },
        { field: "episode", description: t("tonies.tonies.filterBar.customFilterHelp.fields.episode") },
        { field: "model", description: t("tonies.tonies.filterBar.customFilterHelp.fields.model") },
        { field: "language", description: t("tonies.tonies.filterBar.customFilterHelp.fields.language") },
        { field: "picture", description: t("tonies.tonies.filterBar.customFilterHelp.fields.picture") },
        { field: "uid", description: t("tonies.tonies.filterBar.customFilterHelp.fields.uid") },
        { field: "ruid", description: t("tonies.tonies.filterBar.customFilterHelp.fields.ruid") },
        { field: "source", description: t("tonies.tonies.filterBar.customFilterHelp.fields.source") },
        { field: "exists", description: t("tonies.tonies.filterBar.customFilterHelp.fields.exists") },
        { field: "claimed", description: t("tonies.tonies.filterBar.customFilterHelp.fields.claimed") },
        { field: "valid", description: t("tonies.tonies.filterBar.customFilterHelp.fields.valid") },
        { field: "live", description: t("tonies.tonies.filterBar.customFilterHelp.fields.live") },
        { field: "nocloud", description: t("tonies.tonies.filterBar.customFilterHelp.fields.nocloud") },
        { field: "hasCloudAuth", description: t("tonies.tonies.filterBar.customFilterHelp.fields.hasCloudAuth") },
        { field: "tracks", description: t("tonies.tonies.filterBar.customFilterHelp.fields.tracks") },
        { field: "track", description: t("tonies.tonies.filterBar.customFilterHelp.fields.track") },
        { field: "trackcount", description: t("tonies.tonies.filterBar.customFilterHelp.fields.trackcount") },
        { field: "trackseconds", description: t("tonies.tonies.filterBar.customFilterHelp.fields.trackseconds") },
        {
            field: "tracksecondscount",
            description: t("tonies.tonies.filterBar.customFilterHelp.fields.tracksecondscount"),
        },
    ];

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            title={t("tonies.tonies.filterBar.customFilterHelp.title")}
            width={700}
        >
            <Paragraph>{t("tonies.tonies.filterBar.customFilterHelp.intro")}</Paragraph>

            <Table
                dataSource={fields}
                pagination={false}
                rowKey="field"
                columns={[
                    {
                        title: t("tonies.tonies.filterBar.customFilterHelp.table.field"),
                        dataIndex: "field",
                        key: "field",
                        render: (text) => <Text strong>{text}</Text>,
                    },
                    {
                        title: t("tonies.tonies.filterBar.customFilterHelp.table.description"),
                        dataIndex: "description",
                        key: "description",
                    },
                ]}
                style={{ marginBottom: 16 }}
            />

            <Paragraph>
                <Text strong>{t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.title")}</Text>
            </Paragraph>
            <Paragraph>
                <Text code>series=Pixi</Text> - {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.series")}
            </Paragraph>
            <Paragraph>
                <Text code>series=Pixi AND valid</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.and")}
            </Paragraph>
            <Paragraph>
                <Text code>language=de-de OR language=fr-fr</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.or")}
            </Paragraph>
            <Paragraph>
                <Text code>!nocloud</Text> - {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.negation")}
            </Paragraph>
            <Paragraph>
                <Text code>unique(series)</Text> - {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.unique")}
            </Paragraph>
            <Paragraph>
                <Text code>series is empty</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.isEmpty")}
            </Paragraph>
            <Paragraph>
                <Text code>series is not empty</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.isNotEmpty")}
            </Paragraph>
            <Paragraph>
                <Text code>series startswith Pix</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.startswith")}
            </Paragraph>
            <Paragraph>
                <Text code>model endswith 2023</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.endswith")}
            </Paragraph>

            <Paragraph>
                <Text code>language in (de-de, fr-fr)</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.inList")}
            </Paragraph>
            <Paragraph>
                <Text code>language not in (de-de, fr-fr)</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.notInList")}
            </Paragraph>
            <Paragraph>
                <Text code>live AND !nocloud AND language=de-de AND unique(series)</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.combined")}
            </Paragraph>
            <Paragraph>
                <Text strong>{t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.tracksTitle")}</Text>
            </Paragraph>
            <Paragraph>
                <Text code>tracks~"Pixi part 1"</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.tracksRegex")}
            </Paragraph>
            <Paragraph>
                <Text code>track="Pixi is alone"</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.trackExact")}
            </Paragraph>
            <Paragraph>
                <Text code>trackcount{">"}3</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.trackCount")}
            </Paragraph>
            <Paragraph>
                <Text code>tracksecondscount{">"}=3</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.trackSecondsCountCompare")}
            </Paragraph>
            <Paragraph>
                <Text code>tracksecondscount=trackcount</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.trackSecondsCountEqualsTrackCount")}
            </Paragraph>
            <Paragraph>
                <Text code>tracksecondscount!=trackcount</Text> -{" "}
                {t("tonies.tonies.filterBar.customFilterHelp.syntaxExamples.trackSecondsCountNotEqualsTrackCount")}
            </Paragraph>

            <Paragraph>
                <Text strong>{t("tonies.tonies.filterBar.customFilterHelp.tips.title")}</Text>
            </Paragraph>
            <ul>
                <li>{t("tonies.tonies.filterBar.customFilterHelp.tips.caseSensitive")}</li>
                <li>{t("tonies.tonies.filterBar.customFilterHelp.tips.combine")}</li>
                <li>{t("tonies.tonies.filterBar.customFilterHelp.tips.parentheses")}</li>
            </ul>
        </Modal>
    );
};

export default CustomFilterHelpModal;
