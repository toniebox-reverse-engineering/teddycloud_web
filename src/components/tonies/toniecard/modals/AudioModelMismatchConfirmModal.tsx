import { createRoot } from "react-dom/client";
import ConfirmationDialog from "../../../common/modals/ConfirmationModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function showAudioModelMismatchConfirm(t: any, audioModel: string): Promise<boolean> {
    return new Promise((resolve) => {
        const div = document.createElement("div");
        document.body.appendChild(div);

        const root = createRoot(div);

        const cleanup = () => {
            root.unmount();
            div.remove();
        };

        const handleOk = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        root.render(
            <ConfirmationDialog
                title={t("tonies.confirmAudioModelMismatchModal.title")}
                open={true}
                okText={t("tonies.confirmAudioModelMismatchModal.confirm")}
                cancelText={t("tonies.confirmAudioModelMismatchModal.cancel")}
                content={t("tonies.confirmAudioModelMismatchModal.content", { audioModel })}
                handleOk={handleOk}
                handleCancel={handleCancel}
            />,
        );
    });
}
