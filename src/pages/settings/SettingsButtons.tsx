import { Button } from "antd";
import { t } from "i18next";
import { FunctionComponent, useState } from "react";
import SettingsDataHandler from "../../data/SettingsDataHandler";





interface SettingsButtonProps {
    
}
 
export const SettingsButton: FunctionComponent<SettingsButtonProps> = () => {
    const [reloadCount, setReloadCount] = useState(0)

    const listener = () => {
        setReloadCount(reloadCount+1)
    }
    SettingsDataHandler.getInstance().addListener(listener)
    return SettingsDataHandler.getInstance().hasUnchangedChanges()?( <div
        style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
        }}
    >
        <Button onClick={() => SettingsDataHandler.getInstance().resetAll()}>{t("settings.discard")}</Button>
        <Button type="primary" onClick={() => SettingsDataHandler.getInstance().saveAll()}>
            {t("settings.save")}
        </Button>
    </div> )
    :<></>;
}



 
export default SettingsButton;