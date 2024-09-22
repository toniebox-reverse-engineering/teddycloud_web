import SettingsDataHandler from "../../../data/SettingsDataHandler";
import { SettingsInputField } from "./SettingsInputField";
import { SettingsInputNumberField } from "./SettingsInputNumberField";
import { SettingsSwitchField } from "./SettingsSwitchField";

interface SettingsOptionItem{
    iD: string
}

export const SettingsOptionItem = (props: SettingsOptionItem) => {
    const {iD} = props;
    const option = SettingsDataHandler.getInstance().getSetting(props.iD)
        if(option!== undefined){
            const {type, label, description} = option
            
            return (
                <div key={iD}>
                {type === "bool" && (
                    <SettingsSwitchField
                    name={iD}
                    label={label}
                    description={description}
                    />
                )}
                {type === "int" && (
                    <SettingsInputNumberField
                    name={iD}
                    label={label}
                    description={description}
                    />
                )}
                {type === "uint" && (
                    <SettingsInputNumberField
                    name={iD}
                    label={label}
                    description={description}
                    />
                )}
                {type === "string" && (
                    <SettingsInputField
                    name={iD}
                    label={label}
                    description={description}
                    />
                )}
            </div>
        );        
    }
    else{
        console.warn("No option found for iD ", iD)
        return <></>
    }
};
