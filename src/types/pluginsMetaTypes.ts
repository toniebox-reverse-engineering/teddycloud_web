import { ElementType } from "react";

export enum TeddyCloudSection {
    Tonies = "tonies",
    Home = "home",
    Tonieboxes = "tonieboxes",
    Settings = "settings",
    Community = "community",
}

export type PluginMeta = {
    pluginId: string;
    pluginName: string;
    author: string;
    version: string;
    description: string;
    pluginHomepage?: string;
    teddyCloudSection?: TeddyCloudSection;
    icon: ElementType;
    standalone?: boolean;
};
