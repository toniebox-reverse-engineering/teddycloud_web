export const isWebSerialSupported = (): boolean => {
    return typeof navigator !== "undefined" && "serial" in navigator;
};
