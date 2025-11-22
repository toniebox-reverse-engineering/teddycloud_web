export const isWebSerialSupported = () => {
    return "serial" in navigator;
};
