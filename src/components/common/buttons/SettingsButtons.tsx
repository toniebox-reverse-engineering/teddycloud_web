import { Button } from "antd";
import { FunctionComponent, useEffect, useState } from "react";
import SettingsDataHandler from "../../../data/SettingsDataHandler";
import { useTranslation } from "react-i18next";

interface SettingsButtonProps {
    onClose?: () => void;
}

export const SettingsButton: FunctionComponent<SettingsButtonProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        const listener = () => {
            setReloadCount((prevCount) => prevCount + 1);
        };
        const settingsHandler = SettingsDataHandler.getInstance();
        settingsHandler.addListener(listener);

        return () => {
            settingsHandler.resetAll();
            settingsHandler.removeListener(listener);
        };
    }, []);

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
            {onClose ? (
                <Button
                    onClick={() => {
                        SettingsDataHandler.getInstance().resetAll();
                        onClose();
                    }}
                >
                    {t("settings.close")}
                </Button>
            ) : (
                ""
            )}
        </div>
    );
};

export default SettingsButton;
