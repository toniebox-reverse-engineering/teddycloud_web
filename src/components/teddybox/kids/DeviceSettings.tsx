import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Form, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

import { TeddyBoxScheduleEntry } from "../../../utils/teddybox/schedule";
import { useTeddyBoxInstall } from "../hooks/useTeddyBoxPwa";

const { Paragraph } = Typography;

export type DeviceDraft = {
    activeShelf: string;
    schedule: TeddyBoxScheduleEntry[];
};

/**
 * Settings that only apply to this phone or tablet, at the end of the settings tab inside the
 * TeddyBox (the start collection is in the collections tab). Nothing when none applies here.
 */
export const DeviceSettings: React.FC = () => {
    const { t } = useTranslation();
    const { state: installState, install } = useTeddyBoxInstall();
    // only where the browser can install it; otherwise no hint at all
    if (installState !== "available" && installState !== "ios") return null;

    return (
        <>
            <Divider titlePlacement="start" plain>
                {t("teddybox.device.title")}
            </Divider>
            <Form.Item label={t("teddybox.device.install")}>
                {installState === "available" ? (
                    <Button icon={<DownloadOutlined />} onClick={() => void install()}>
                        {t("teddybox.device.installButton")}
                    </Button>
                ) : (
                    <Paragraph style={{ marginBottom: 0 }}>
                        {t("teddybox.device.installIos")}
                    </Paragraph>
                )}
            </Form.Item>
        </>
    );
};
