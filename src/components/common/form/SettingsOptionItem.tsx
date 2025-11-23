import SettingsDataHandler from "../../../data/SettingsDataHandler";
import { SettingsInputField } from "./SettingsInputField";
import { SettingsInputNumberField } from "./SettingsInputNumberField";
import { SettingsSwitchField } from "./SettingsSwitchField";

interface SettingsOptionItem {
    iD: string;
    noOverlay?: boolean;
    overlayId?: string;
}

export const SettingsOptionItem = (props: SettingsOptionItem) => {
    const { iD } = props;
    const option = SettingsDataHandler.getInstance().getSetting(props.iD);

    const overlayedProp = props.noOverlay ? undefined : option?.overlayed;

    if (option !== undefined) {
        const { type, label, description } = option;

        return (
            <div key={iD}>
                {type === "bool" && (
                    <SettingsSwitchField
                        name={iD}
                        label={label}
                        description={description}
                        overlayed={overlayedProp}
                        overlayId={props.overlayId}
                    />
                )}
                {type === "int" && (
                    <SettingsInputNumberField
                        name={iD}
                        label={label}
                        description={description}
                        overlayed={overlayedProp}
                        overlayId={props.overlayId}
                    />
                )}
                {type === "uint" && (
                    <SettingsInputNumberField
                        name={iD}
                        label={label}
                        description={description}
                        overlayed={overlayedProp}
                        overlayId={props.overlayId}
                    />
                )}
                {type === "string" && (
                    <SettingsInputField
                        name={iD}
                        label={label}
                        description={description}
                        overlayed={props.noOverlay ? undefined : option?.overlayed}
                        overlayId={props.overlayId}
                    />
                )}
            </div>
        );
    } else {
        console.warn("No option found for iD ", iD);
        return <></>;
    }
};
