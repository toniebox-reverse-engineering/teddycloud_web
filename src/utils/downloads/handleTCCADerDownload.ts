export const handleTCCADerDownload = (asC2Der: boolean): void => {
    const baseUrl = import.meta.env.VITE_APP_TEDDYCLOUD_API_URL;
    const fileType = asC2Der ? "c2" : "ca";
    const fileUrl = `${baseUrl}/api/getFile/${fileType}.der`;

    window.location.href = fileUrl;
};
