import React from "react";
import { Modal, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { OptionsList } from "../../../../api";
import { CertificateDragNDrop } from "../../../common/form/CertificatesDragAndDrop";

const { Paragraph } = Typography;

interface CertificatesModalProps {
    open: boolean;
    tonieboxName?: string;
    overlayId?: string;
    options?: OptionsList;
    onOk: () => void;
    onCancel: () => void;
}

export const CertificatesModal: React.FC<CertificatesModalProps> = ({
    open,
    tonieboxName,
    overlayId,
    options,
    onOk,
    onCancel,
}) => {
    const { t } = useTranslation();

    const certDirOption = options?.options?.find((option) => option.iD === "core.certdir");

    return (
        <Modal
            title={t("tonieboxes.uploadTonieboxCertificatesModal.uploadTonieboxCertificates", {
                name: tonieboxName ? ' "' + tonieboxName + '"' : "",
            })}
            open={open}
            onOk={onOk}
            onCancel={onCancel}
        >
            <Paragraph>
                {certDirOption && (
                    <>
                        {t("tonieboxes.uploadTonieboxCertificatesModal.uploadPath")} <i>{certDirOption.value}</i>
                        <small>
                            {certDirOption.overlayed
                                ? t("tonieboxes.uploadTonieboxCertificatesModal.boxSpecific")
                                : t("tonieboxes.uploadTonieboxCertificatesModal.AttentionGeneralPath")}
                        </small>
                    </>
                )}
            </Paragraph>
            <CertificateDragNDrop overlay={overlayId} />
        </Modal>
    );
};
