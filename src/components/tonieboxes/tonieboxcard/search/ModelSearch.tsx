/* Currently unused, but may be used in the future */

import React from "react";
import { Select } from "antd";
import { useTeddyCloud } from "../../../../TeddyCloudContext";

export const ModelSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
    value: any;
}> = (props) => {
    const { boxModelImages } = useTeddyCloud();

    const handleChange = (newValue: string) => {
        props.onChange(newValue);
    };

    return (
        <Select
            showSearch
            value={props.value}
            placeholder={props.value ? "" : props.placeholder}
            defaultActiveFirstOption={false}
            suffixIcon={null}
            filterOption={false}
            onChange={handleChange}
            notFoundContent={null}
            options={(boxModelImages || []).map((d: any) => ({
                value: d.id,
                label: d.name,
            }))}
        />
    );
};
