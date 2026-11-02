import { backendUrl } from "../basePath";

export const handleTCCADerDownload = (asC2Der: boolean): void => {
    const fileType = asC2Der ? "c2" : "ca";
    window.location.href = backendUrl(`/api/getFile/${fileType}.der`);
};
