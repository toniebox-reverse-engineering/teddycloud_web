import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Space, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, LockOutlined } from "@ant-design/icons";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { BoxineApi, BoxineForcedApi, TeddyCloudApi } from "../../api";

import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import { useTeddyCloud } from "../../TeddyCloudContext";

const api = new BoxineApi(defaultAPIConfig());
const api2 = new BoxineForcedApi(defaultAPIConfig());
const apiTC = new TeddyCloudApi(defaultAPIConfig());

export const ServerStatus = () => {
    const { t } = useTranslation();
    const { fetchCloudStatus } = useTeddyCloud();
    const [boxineStatus, setBoxineStatus] = useState<boolean>(false);
    const [boxineEnabledStatus, setBoxineEnabledStatus] = useState<boolean>(true);
    const [teddyStatus, setTeddyStatus] = useState<boolean>(false);

    const fetchBoxineEnabledStatus = async () => {
        try {
            const cloudEnabled = await apiTC.apiGetTeddyCloudSettingRaw("cloud.enabled");
            const cloudEnabledBoolean = (await cloudEnabled.text()) === "true";
            setBoxineEnabledStatus(cloudEnabledBoolean);
            if (!cloudEnabledBoolean) setBoxineStatus(false);
            return cloudEnabledBoolean;
        } catch (err) {
            console.log("Something went wrong getting cloud.enabled.");
            setBoxineEnabledStatus(false);
            return false;
        }
    };

    const fetchCloudStatusUsingTimeRequests = async () => {
        const isEnabled = await fetchBoxineEnabledStatus();

        try {
            const timeRequest = (await api.v1TimeGet()) as String;
            if (timeRequest.length === 10) {
                setTeddyStatus(true);
            }
        } catch (e) {
            setTeddyStatus(false);
        }

        if (isEnabled) {
            async function timeRequest2WithRetries() {
                const maxRetries = 10;
                let attempts = 0;
                let success = false;

                while (attempts < maxRetries && !success) {
                    try {
                        const timeRequest2 = (await api2.reverseV1TimeGet()) as string;
                        if (timeRequest2.length === 10) {
                            setBoxineStatus(true);
                            success = true;
                        }
                    } catch (e) {
                        attempts++;
                        setBoxineStatus(false);

                        await new Promise((resolve) => setTimeout(resolve, 500));
                    }
                }
            }

            timeRequest2WithRetries();
        }
    };

    useEffect(() => {
        fetchCloudStatusUsingTimeRequests();
    }, []);

    useEffect(() => {
        fetchCloudStatusUsingTimeRequests();
    }, [fetchCloudStatus]);

    return (
        <Space>
            <Tooltip
                title={
                    boxineEnabledStatus
                        ? boxineStatus
                            ? t("server.boxineStatusOnline")
                            : t("server.boxineStatusOffline")
                        : t("server.boxineDisabled")
                }
            >
                <Tag
                    icon={
                        boxineEnabledStatus ? (
                            boxineStatus ? (
                                <CheckCircleOutlined />
                            ) : (
                                <CloseCircleOutlined />
                            )
                        ) : (
                            <LockOutlined />
                        )
                    }
                    color={boxineEnabledStatus ? (boxineStatus ? "#87d068" : "#f50") : "#faad14"}
                    bordered={false}
                    style={{ cursor: "help", color: "#001529" }}
                >
                    <HiddenDesktop>B</HiddenDesktop>
                    <HiddenMobile>Boxine</HiddenMobile>
                </Tag>
            </Tooltip>
            <Tooltip title={teddyStatus ? t("server.teddycloudStatusOnline") : t("server.teddycloudStatusOffline")}>
                <Tag
                    icon={teddyStatus ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={teddyStatus ? "#87d068" : "#f50"}
                    bordered={false}
                    style={{ cursor: "help", color: "#001529" }}
                >
                    <HiddenDesktop>TC</HiddenDesktop>
                    <HiddenMobile>TeddyCloud</HiddenMobile>
                </Tag>
            </Tooltip>
        </Space>
    );
};
