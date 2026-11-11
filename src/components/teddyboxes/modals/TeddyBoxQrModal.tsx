import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Modal, QRCode, Typography } from "antd";

import { TEDDYBOX_ROUTE } from "../../../constants/teddybox";
import { TeddyBoxConfig } from "../../../types/teddyboxTypes";
import { withBase } from "../../../utils/basePath";

const { Paragraph, Text } = Typography;

export const teddyBoxUrl = (id: string) =>
    `${window.location.origin}${withBase(`/web${TEDDYBOX_ROUTE}/${encodeURIComponent(id)}`)}`;

interface TeddyBoxQrModalProps {
    box: TeddyBoxConfig;
    onClose: () => void;
}

/** QR code to open the TeddyBox on the child's device. */
export const TeddyBoxQrModal: React.FC<TeddyBoxQrModalProps> = ({ box, onClose }) => {
    const { t } = useTranslation();
    const url = teddyBoxUrl(box.id);

    return (
        <Modal
            open
            destroyOnHidden
            title={t("teddybox.qr.title", { name: box.name })}
            onCancel={onClose}
            footer={<Button onClick={onClose}>{t("teddybox.qr.close")}</Button>}
        >
            <Flex vertical align="center" gap={16}>
                <QRCode value={url} size={220} />
                <Paragraph copyable={{ text: url }} style={{ marginBottom: 0 }}>
                    <Text code style={{ wordBreak: "break-all" }}>
                        {url}
                    </Text>
                </Paragraph>
            </Flex>
            <Paragraph style={{ marginTop: 16 }}>{t("teddybox.qr.howTo")}</Paragraph>
            <Paragraph type="secondary">{t("teddybox.qr.install")}</Paragraph>
        </Modal>
    );
};
