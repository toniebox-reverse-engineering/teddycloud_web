import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { TonieCardProps } from "../../../../types/tonieTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

/**
 * Assign a "lib://" or "http(s)://" source path to a Tonie tag, mirroring
 * useTonieCardSaveFlow.handleSourceSave (source + nocloud + live follow-up).
 */
export const useAssignSourceToTonie = () => {
    const assignSourceToTonie = async (tonieCard: TonieCardProps, path: string, overlay: string) => {
        await api.apiPostTeddyCloudContentJson(tonieCard.ruid, "source=" + encodeURIComponent(path), overlay);

        if (!tonieCard.nocloud) {
            await api.apiPostTeddyCloudContentJson(tonieCard.ruid, "nocloud=true", overlay);
        }

        const shouldBeLive = path.startsWith("http");
        if (shouldBeLive !== tonieCard.live) {
            await api.apiPostTeddyCloudContentJson(tonieCard.ruid, "live=" + shouldBeLive, overlay);
        }
    };

    return { assignSourceToTonie };
};
