import { Button } from "antd";
import { t } from "i18next";
import { FunctionComponent, useState } from "react";
import SettingsDataHandler from "../../data/SettingsDataHandler";

interface SettingsButtonProps {}

export const SettingsButton: FunctionComponent<SettingsButtonProps> = () => {
    const [reloadCount, setReloadCount] = useState(0);

    const listener = () => {
        setReloadCount(reloadCount + 1);
    };
    SettingsDataHandler.getInstance().addListener(listener);
    const isDisabled = !SettingsDataHandler.getInstance().hasUnchangedChanges();
    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
            }}
        >
            <Button disabled={isDisabled} onClick={() => SettingsDataHandler.getInstance().resetAll()}>
                {t("settings.discard")}
            </Button>
            <Button disabled={isDisabled} type="primary" onClick={() => SettingsDataHandler.getInstance().saveAll()}>
                {t("settings.save")}
            </Button>
        </div>
    );
};

export default SettingsButton;
