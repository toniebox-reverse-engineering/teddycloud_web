import React, { useMemo } from "react";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { SearchDropdown } from "../../../common/elements/SearchDropdown";

export const ModelSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
    value: string;
}> = ({ placeholder, onChange, value }) => {
    const { boxModelImages } = useTeddyCloud();

    const options = useMemo(
        () =>
            (boxModelImages || []).map((d: any) => ({
                value: d.id,
                label: d.name,
            })),
        [boxModelImages]
    );

    return (
        <SearchDropdown
            value={value}
            placeholder={placeholder}
            options={options}
            onInputChange={onChange}
            onSelect={onChange}
            showNoResults={false}
        />
    );
};
