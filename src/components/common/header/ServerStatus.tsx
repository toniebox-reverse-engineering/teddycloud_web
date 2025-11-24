import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Space, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, LockOutlined } from "@ant-design/icons";

import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import { BoxineApi, BoxineForcedApi, TeddyCloudApi } from "../../../api";

import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";

const boxineApi = new BoxineApi(defaultAPIConfig());
const boxineForcedApi = new BoxineForcedApi(defaultAPIConfig());
const teddyCloudApi = new TeddyCloudApi(defaultAPIConfig());

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ServerStatus = () => {
    const { t } = useTranslation();
    const { fetchCloudStatus, setToniesCloudAvailable } = useTeddyCloud();

    const [boxineStatus, setBoxineStatus] = useState(false);
    const [boxineEnabledStatus, setBoxineEnabledStatus] = useState(true);
    const [teddyStatus, setTeddyStatus] = useState(false);

    const fetchBoxineEnabledStatus = useCallback(async (): Promise<boolean> => {
        try {
            const response = await teddyCloudApi.apiGetTeddyCloudSettingRaw("cloud.enabled");
            const text = (await response.text()).trim().toLowerCase();
            const enabled = text === "true";

            setBoxineEnabledStatus(enabled);
            if (!enabled) {
                setBoxineStatus(false);
            }

            return enabled;
        } catch {
            console.log("Something went wrong getting cloud.enabled.");
            setBoxineEnabledStatus(false);
            setBoxineStatus(false);
            return false;
        }
    }, []);

    const fetchTeddyStatus = useCallback(async () => {
        try {
            const timeRequest = (await boxineApi.v1TimeGet()) as string;
            setTeddyStatus(timeRequest.length === 10);
        } catch {
            setTeddyStatus(false);
        }
    }, []);

    const fetchBoxineStatusWithRetries = useCallback(async () => {
        const maxRetries = 10;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const timeRequest = (await boxineForcedApi.reverseV1TimeGet()) as string;
                if (timeRequest.length === 10) {
                    setBoxineStatus(true);
                    return;
                }
            } catch {
                setBoxineStatus(false);
                if (attempt < maxRetries - 1) {
                    await delay(500);
                }
            }
        }
    }, []);

    const fetchCloudStatusUsingTimeRequests = useCallback(async () => {
        const isEnabled = await fetchBoxineEnabledStatus();

        await fetchTeddyStatus();

        if (isEnabled) {
            await fetchBoxineStatusWithRetries();
        }
    }, [fetchBoxineEnabledStatus, fetchTeddyStatus, fetchBoxineStatusWithRetries]);

    useEffect(() => {
        fetchCloudStatusUsingTimeRequests();
    }, [fetchCloudStatusUsingTimeRequests, fetchCloudStatus]);

    useEffect(() => {
        setToniesCloudAvailable(boxineStatus);
    }, [boxineStatus, setToniesCloudAvailable]);

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
