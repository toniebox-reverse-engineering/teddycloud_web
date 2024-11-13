import { message } from "antd";
import { t } from "i18next";
import { TeddyCloudApi } from "../api/apis/TeddyCloudApi";
import { defaultAPIConfig } from "../config/defaultApiConfig";

export interface Setting {
    description: string;
    iD: string;
    label: string;
    overlayed: boolean | undefined;
    shortname: string;
    type: string;
    value: boolean | string | number;
    initialValue?: boolean | string | number;
    initialOverlayed?: boolean | undefined;
    overlayId?: string;
}

const api = new TeddyCloudApi(defaultAPIConfig());

export default class SettingsDataHandler {
    private static instance: SettingsDataHandler | undefined = undefined;
    private settings: Setting[] = [];
    private unsavedChanges: boolean = false;
    private listeners: (() => void)[] = [];
    private idListeners: { iD: string; listener: () => {} }[] = [];

    private constructor() {}

    public hasUnchangedChanges() {
        return this.unsavedChanges;
    }

    public static getInstance() {
        if (SettingsDataHandler.instance === undefined) {
            SettingsDataHandler.instance = new SettingsDataHandler();
        }
        return SettingsDataHandler.instance;
    }

    //initialize settings from server
    public initializeSettings(data: Setting[], overlayId: string | undefined) {
        data.forEach((setting) => {
            setting.initialValue = setting.value;
            setting.initialOverlayed = setting.overlayed !== undefined ? setting.overlayed : undefined;
            setting.overlayId = overlayId;
        });
        this.settings = data;
        console.log(data);
    }

    public addListener(listener: () => void) {
        if (!this.listeners.find((currentListener) => currentListener === listener)) {
            this.listeners.push(listener);
        }
    }

    removeListener(listener: () => void) {
        this.listeners.filter((currentListener) => currentListener !== listener);
    }

    public addIdListener(listener: () => void, iD: string) {
        if (!this.idListeners.find((element) => element.listener === listener)) {
            this.listeners.push(listener);
        }
    }

    removeIdListener(listener: () => void) {
        this.idListeners.filter((element) => element.listener !== listener);
    }

    private callAllListeners() {
        this.listeners.forEach((listener) => listener());
    }

    //TODO: save changes to server (batched)
    public saveAll() {
        this.settings.forEach(async (setting) => {
            if (setting.initialValue !== setting.value) {
                await this.saveSingleSetting(setting);
            }
        });
        this.settings.forEach((setting) => (setting.initialValue = setting.value));
        this.unsavedChanges = false;
        this.callAllListeners();
    }

    private saveSingleSetting(setting: Setting) {
        const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
        };

        try {
            const reset = setting.overlayed === undefined && setting.overlayed === false ? true : false;

            return api
                .apiPostTeddyCloudSetting(setting.iD, setting.value, setting.overlayId, reset)
                .then(() => {
                    triggerWriteConfig();
                    message.success(t("settings.saved") + ": " + setting.label);
                })
                .catch((e) => {
                    message.error("Error while sending data to file: " + setting.label);
                });
        } catch (e) {
            message.error("Error while sending data to server: " + setting.label);
            return Promise<null>;
        }
    }

    public resetAll() {
        this.settings.forEach((setting) => {
            setting.value = setting.initialValue ?? "";
            setting.overlayed = setting.initialOverlayed !== undefined ? setting.initialOverlayed : undefined;
        });

        this.unsavedChanges = false;
        this.callAllListeners();
        this.idListeners.forEach((element) => element.listener());
    }

    public getSetting(iD: string) {
        return this.settings.find((setting) => setting.iD === iD);
    }

    public changeSetting(iD: string, newValue: boolean | string | number, overlayed: boolean | undefined) {
        const settingToChange = this.settings.find((setting) => setting.iD === iD);
        if (settingToChange) {
            if (typeof settingToChange.initialValue === typeof newValue) {
                settingToChange.value = newValue;
                if (settingToChange.initialValue === settingToChange.value) {
                    //check all settings and if the save button should still be shown
                    this.unsavedChanges = false;
                    this.settings.forEach((setting) => {
                        if (setting.initialValue !== setting.value) {
                            this.unsavedChanges = true;
                        }
                    });
                } else {
                    this.unsavedChanges = true;
                }
                this.idListeners
                    .filter((element) => element.iD === iD)
                    .forEach((element) => {
                        element.listener();
                    });
                this.callAllListeners();
            } else {
                console.warn("The type of newValue and initialValue for '" + iD + "' do not match! Omitting.");
            }
        } else {
            console.warn("Unknown setting '" + iD + "' to be changed. Omitting.");
        }
    }

    public changeSettingOverlayed(iD: string, newOverlayed: boolean) {
        const settingToChange = this.settings.find((setting) => setting.iD === iD);
        if (settingToChange) {
            console.log(newOverlayed);
            settingToChange.overlayed = newOverlayed;

            if (newOverlayed === false) {
                const fetchFieldValue = () => {
                    try {
                        api.apiGetTeddyCloudSettingRaw(iD)
                            .then((response) => response.text())
                            .then((fieldValue) => {
                                this.changeSetting(iD, fieldValue, newOverlayed);
                            })
                            .catch((error) => {
                                message.error(`Error fetching field value: ${error}`);
                            });
                    } catch (error) {
                        message.error(`Error fetching field value: ${error}`);
                    }
                };

                fetchFieldValue();
            }

            if (settingToChange.initialOverlayed === settingToChange.overlayed) {
                //check all settings and if the save button should still be shown
                this.unsavedChanges = false;
                this.settings.forEach((setting) => {
                    if (setting.initialValue !== setting.value) {
                        this.unsavedChanges = true;
                    }
                    if (setting.initialOverlayed !== setting.overlayed) {
                        this.unsavedChanges = true;
                    }
                });
            } else {
                this.unsavedChanges = true;
            }
            this.idListeners
                .filter((element) => element.iD === iD)
                .forEach((element) => {
                    element.listener();
                });
            this.callAllListeners();
        } else {
            console.warn("Unknown setting '" + iD + "' to be changed. Omitting.");
        }
    }
}
