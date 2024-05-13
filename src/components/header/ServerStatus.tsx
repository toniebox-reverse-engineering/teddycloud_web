import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { BoxineApi, BoxineForcedApi } from "../../api";
import { Space, Tag, Tooltip } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";

const api = new BoxineApi(defaultAPIConfig());
const api2 = new BoxineForcedApi(defaultAPIConfig());

export const ServerStatus = () => {
    const { t } = useTranslation();
    const [boxineStatus, setBoxineStatus] = useState<boolean>(false);
    const [teddyStatus, setTeddyStatus] = useState<boolean>(false);

    const fetchTime = async () => {
        try {
            const timeRequest = (await api.v1TimeGet()) as String;
            if (timeRequest.length === 10) {
                setTeddyStatus(true);
            }
        } catch (e) {
            setTeddyStatus(false);
        }
        try {
            const timeRequest2 = (await api2.reverseV1TimeGet()) as String;

            if (timeRequest2.length === 10) {
                setBoxineStatus(true);
            }
        } catch (e) {
            setBoxineStatus(false);
        }
    };

    useEffect(() => {
        fetchTime();
    }, []);

    return (
        <Space>
            <Tooltip title={boxineStatus ? t("server.boxineStatusOnline") : t("server.boxineStatusOffline")}>
                <Tag
                    icon={boxineStatus ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={boxineStatus ? "#87d068" : "#f50"}
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
