import React from "react";
import { Descriptions, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { BoxCertStatus, useBoxCertificate } from "../hooks/useBoxCertificate";

const { Paragraph, Text } = Typography;

export const boxCertStatusColor: Record<BoxCertStatus, string | undefined> = {
    "": undefined,
    trusted: "success",
    pinned: "success",
    mismatch: "error",
};

const Fingerprint: React.FC<{ value: string }> = ({ value }) =>
    value ? (
        <Text code copyable style={{ wordBreak: "break-all" }}>
            {value}
        </Text>
    ) : (
        <Text type="secondary">-</Text>
    );

export const BoxCertificateCheck: React.FC<{ overlayId?: string }> = ({ overlayId }) => {
    const { t } = useTranslation();
    const { status, presented, pin } = useBoxCertificate(overlayId, true);

    return (
        <>
            <h4>{t("tonieboxes.boxCertificate.title")}</h4>
            <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label={t("tonieboxes.boxCertificate.status")}>
                    <Tag color={boxCertStatusColor[status]}>
                        {t(`tonieboxes.boxCertificate.statusText.${status || "none"}`)}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t("tonieboxes.boxCertificate.presented")}>
                    <Fingerprint value={presented} />
                </Descriptions.Item>
                <Descriptions.Item label={t("tonieboxes.boxCertificate.pin")}>
                    <Fingerprint value={pin} />
                </Descriptions.Item>
            </Descriptions>
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
                {t("tonieboxes.boxCertificate.nextConnection")}
            </Paragraph>
        </>
    );
};
