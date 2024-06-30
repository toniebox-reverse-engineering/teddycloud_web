import { useEffect, useState } from "react";
import { OptionsItem } from "../../api";
import { SwitchField } from "../form/SwitchField";
import { useField } from "formik";
import { InputField } from "../form/InputField";
import { InputNumberField } from "../form/InputNumberField";

type OptionItemProps = {
    option: OptionsItem;
    noOverlay?: boolean;
    overlayId?: string;
};

export const OptionItem = ({ option, noOverlay, overlayId }: OptionItemProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, iD, description, label, shortname, value, overlayed } = option;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [optionValue, setOptionValue] = useState<string>("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [field, meta, { setValue }] = useField(iD);

    useEffect(() => {
        setOptionValue(value);
        setValue(value);
    }, [setValue, value]);

    const overlayedProp = noOverlay ? undefined : overlayed;

    return (
        <div key={iD}>
            {type === "bool" && (
                <SwitchField
                    name={iD}
                    label={label}
                    description={description}
                    overlayed={overlayedProp}
                    overlayId={overlayId}
                />
            )}
            {type === "int" && (
                <InputNumberField
                    name={iD}
                    label={label}
                    description={description}
                    overlayed={overlayedProp}
                    overlayId={overlayId}
                />
            )}
            {type === "uint" && (
                <InputNumberField
                    name={iD}
                    label={label}
                    description={description}
                    overlayed={overlayedProp}
                    overlayId={overlayId}
                />
            )}
            {type === "string" && (
                <InputField
                    name={iD}
                    label={label}
                    description={description}
                    overlayed={overlayedProp}
                    overlayId={overlayId}
                />
            )}
        </div>
    );
};

export default OptionItem;
