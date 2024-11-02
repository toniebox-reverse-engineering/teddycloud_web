export type TonieboxImage = {
    id: string;
    name: string;
    img_src: string;
    crop?: number[];
};

export type TonieboxCardProps = {
    ID: string;
    commonName: string;
    boxName: string;
    boxModel: string;
};

export type TonieboxCardsList = {
    boxes: TonieboxCardProps[];
};

export enum BoxVersionsEnum {
    unknown = "UNKNOWN",
    cc3200 = "CC3200",
    cc3235 = "CC3235",
    esp32 = "ESP32",
}
