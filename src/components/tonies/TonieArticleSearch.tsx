import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select, Tooltip, message } from "antd";
import type { SelectProps } from "antd";
import { TonieInfo } from "./TonieCard";
import ToniesCustomJsonEditor from "./ToniesCustomJsonEditor";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const TonieArticleSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
}> = (props) => {
    const { t } = useTranslation();
    // this is actually needed that the search works
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [messageApi, contextHolder] = message.useMessage();
    const [data, setData] = useState<SelectProps["options"]>([]);
    const [value, setValue] = useState<string>();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [tonieInfos, setTonieInfos] = useState<TonieInfo[]>();
    const [showAddCustomTonieModal, setShowAddCustomTonieModal] = useState<boolean>(false);

    const handleSearch = async (search: string) => {
        const searchEncode = encodeURIComponent(search);
        const path =
            "/api/toniesJsonSearch?" +
            "searchModel=" +
            searchEncode +
            "&searchSeries=" +
            searchEncode +
            "&searchEpisode=" +
            searchEncode;
        try {
            const response = await api.apiGetTeddyCloudApiRaw(path);
            const data = await response.json();
            setTonieInfos(data);
            const result = data.map((item: TonieInfo) => ({
                value: item.model,
                text: "[" + item.model + "] " + item.series + " - " + item.episode,
                picture: item.picture,
            }));
            setData(result);
        } catch (error) {
            message.error(t("tonieArticleSearch.failedToFetchSearchResults") + error);
            return;
        }
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);
        props.onChange(newValue);
    };

    const handleAddNewCustomButtonClick = () => {
        setShowAddCustomTonieModal(true);
    };

    return (
        <>
            <Select
                showSearch
                value={value}
                placeholder={props.placeholder}
                defaultActiveFirstOption={false}
                suffixIcon={null}
                filterOption={false}
                onSearch={handleSearch}
                onChange={handleChange}
                notFoundContent={null}
                options={(data || []).map((d) => ({
                    value: d.value,
                    label: (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <img src={d.picture} alt={d.text} style={{ display: "none" }} />
                            {d.text}
                        </div>
                    ),
                }))}
            />
            <ToniesCustomJsonEditor
                open={showAddCustomTonieModal}
                props={props}
                setValue={setValue}
                onClose={() => setShowAddCustomTonieModal(false)}
            />
            <Tooltip title={t("tonies.addNewCustomTonieHint")}>
                <Button onClick={handleAddNewCustomButtonClick} style={{ marginTop: 8 }}>
                    {t("tonies.addNewCustomTonie")}
                </Button>
            </Tooltip>
        </>
    );
};
