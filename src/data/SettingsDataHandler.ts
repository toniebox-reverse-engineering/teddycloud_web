import { message } from "antd"
import { t } from "i18next"
import { TeddyCloudApi } from "../api/apis/TeddyCloudApi"
import { defaultAPIConfig } from "../config/defaultApiConfig"

export interface Setting{
    description: string
    iD: string
    label: string
    overlayed: boolean
    shortname : string
    type: string
    value:boolean | string | number
    initialValue?:boolean | string | number
    overlayId? : string
}

export default class SettingsDataHandler{
    private static instance : SettingsDataHandler|undefined = undefined
    private settings : Setting[] = []
    private unsavedChanges : boolean = false
    private listeners : (() => void)[] = []

    private constructor(){

    }

    public hasUnchangedChanges(){
        return this.unsavedChanges
    }

    public static getInstance(){
        if(SettingsDataHandler.instance === undefined){
            SettingsDataHandler.instance = new SettingsDataHandler()
        }
        return SettingsDataHandler.instance
    }

    //initialize settings from server
    public initializeSettings(data: Setting[]){
        data.forEach(setting => {
            setting.initialValue = setting.value
        })
        this.settings = data
    }

    public addListener(listener: () => void){
        if(!this.listeners.find(currentListener => currentListener===listener)){
            this.listeners.push(listener)
        }
    }

    removeListener(listener: () => void){
        this.listeners.filter(currentListener => currentListener!==listener)
    }

    private callAllListeners(){
        this.listeners.forEach(listener => listener())
    }

    //TODO: save changes to server (batched)
    public saveAll(){
        this.settings.forEach(async setting => {
            if(setting.initialValue !== setting.value){
                await this.saveSingleSetting(setting)
            }
        })
        this.settings.forEach(setting => setting.initialValue=setting.value)
        this.unsavedChanges = false
        this.callAllListeners()
    }

    private saveSingleSetting(setting: Setting){
        const api = new TeddyCloudApi(defaultAPIConfig());
        const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
        };

        try {
            return api.apiPostTeddyCloudSetting(setting.iD, setting.value, setting.overlayId)
                .then(() => {
                    triggerWriteConfig();
                    message.success(t("settings.saved")+": "+setting.label);
                })
                .catch((e) => {
                    message.error("Error while sending data to file: "+setting.label);
                });
        } catch (e) {
            message.error("Error while sending data to server: "+setting.label);
            return Promise<null>
        }

        //TODO: what did this do in InputField? helpers.setValue(field.value || "");
        
    }

    public resetAll(){
        this.settings.forEach(setting => setting.value=setting.initialValue??"")
        this.unsavedChanges = false
        this.callAllListeners()
    }

    public getSetting(iD:string){
        console.log("Getting setting ", iD)
        return this.settings.find(setting => setting.iD === iD)
    }

    public changeSetting(iD: string, newValue: boolean | string | number){
        const settingToChange = this.settings.find(setting => setting.iD === iD) 
        if(settingToChange){
            if(typeof settingToChange.initialValue === typeof newValue){
                settingToChange.value = newValue
                if(settingToChange.initialValue === settingToChange.value){
                    //check all settings and if the save button should still be shown
                    this.unsavedChanges = false
                    this.settings.forEach(setting => {

                        if(setting.initialValue !== setting.value){
                            this.unsavedChanges = true                          
                        }
                    })
                }
                else{
                    this.unsavedChanges = true;
                }
                this.callAllListeners()
            }
            else{
                console.warn("The type of newValue and initialValue for '"+iD+"' do not match! Omitting.")
            }
        }
        else{
            console.warn("Unknown setting '"+iD+"' to be changed. Omitting.")
        }
    }
}