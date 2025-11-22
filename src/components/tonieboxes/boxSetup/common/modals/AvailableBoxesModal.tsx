// src/components/tonieboxes/boxsetup/modals/AvailableBoxesModal.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Empty, Modal, Spin, Table, Typography } from "antd";
import { TeddyCloudApi } from "../../../../../api";
import { defaultAPIConfig } from "../../../../../config/defaultApiConfig";
import { TonieboxCardProps, BoxVersionsEnum } from "../../../../../types/tonieboxTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;

interface TonieboxPropsWithStatusAndVersion extends TonieboxCardProps {
    status: string;
    version: string;
}

interface AvailableBoxesModalProps {
    boxVersion: string;
    isOpen: boolean;
    onClose: () => void;
}

const AvailableBoxesModal: React.FC<AvailableBoxesModalProps> = ({ boxVersion, isOpen, onClose }) => {
    const { t } = useTranslation();
    const [tonieboxes, setTonieboxes] = useState<TonieboxPropsWithStatusAndVersion[]>([]);
    const [recheckTonieboxes, setRecheckTonieboxes] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            fetchTonieboxes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, recheckTonieboxes]);

    const fetchTonieboxes = async () => {
        setLoading(true);
        try {
            const tonieboxData = await api.apiGetTonieboxesIndex();
            const updatedBoxes = await Promise.all(
                tonieboxData.map(async (box) => {
                    const tonieboxStatus = await api.apiGetTonieboxStatus(box.ID);
                    const statusString = tonieboxStatus ? "Online" : "Offline";
                    const tonieboxVersion = await api.apiGetTonieboxVersion(box.ID);
                    const BoxVersions: { [key: string]: string } = {
                        "0": "UNKNOWN",
                        "1": "CC3200",
                        "2": "CC3235",
                        "3": "ESP32",
                    };
                    const version = BoxVersions[tonieboxVersion] || "UNKNOWN";
                    return {
                        ...box,
                        status: statusString,
                        version,
                    };
                })
            );

            setTonieboxes(updatedBoxes);
        } catch (error) {
            console.error("Error fetching tonieboxes:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: t("tonieboxes.availableBoxModal.commonName"),
            dataIndex: "commonName",
            key: "commonName",
        },
        {
            title: t("tonieboxes.availableBoxModal.boxVersion"),
            dataIndex: "version",
            key: "version",
        },
        {
            title: t("tonieboxes.availableBoxModal.status"),
            dataIndex: "status",
            key: "status",
        },
    ];

    const availableBoxesFooter = (
        <Paragraph style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button
                onClick={async () => {
                    setLoading(true);
                    setRecheckTonieboxes((prev) => !prev);
                    await fetchTonieboxes();
                }}
            >
                {t("tonieboxes.availableBoxModal.recheck")}
            </Button>
            <Button type="primary" onClick={onClose}>
                {t("tonieboxes.availableBoxModal.ok")}
            </Button>
        </Paragraph>
    );

    const renderEmpty = () => (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div>
                    <Paragraph>{t("tonieboxes.noData")}</Paragraph>
                    <Paragraph>{t("tonieboxes.noDataText")}</Paragraph>
                </div>
            }
        />
    );

    const filteredBoxes = tonieboxes.filter((box) => box.version === boxVersion);

    return (
        <Modal
            title={t("tonieboxes.availableBoxModal.availableBoxes", { boxVersion })}
            open={isOpen}
            onOk={onClose}
            onCancel={onClose}
            footer={availableBoxesFooter}
        >
            <Paragraph>
                <Paragraph>
                    {t("tonieboxes.availableBoxModal.newBoxAvailable", {
                        cc3200Hint:
                            boxVersion === BoxVersionsEnum.cc3200 ? t("tonieboxes.availableBoxModal.cc3200Hint") : "",
                    })}
                </Paragraph>
                <Link
                    to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/test-troubleshooting/"
                    target="_blank"
                >
                    {t("tonieboxes.availableBoxModal.troubleShooting")}
                </Link>
            </Paragraph>

            <h4>{t("tonieboxes.availableBoxModal.availableBoxes", { boxVersion })}</h4>
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                    <Spin size="default" />
                </div>
            ) : (
                <Table
                    dataSource={filteredBoxes}
                    columns={columns}
                    rowKey="ID"
                    pagination={false}
                    locale={{ emptyText: renderEmpty() }}
                />
            )}

            {filteredBoxes.length > 0 && (
                <Paragraph style={{ marginTop: 16 }}>
                    {t("tonieboxes.boxSetup.uploadCertificatesToBox")}{" "}
                    <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link>
                </Paragraph>
            )}
        </Modal>
    );
};

export default AvailableBoxesModal;
