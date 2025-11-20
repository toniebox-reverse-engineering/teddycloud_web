import { createRoot } from "react-dom/client";
import ConfirmationDialog from "../../../common/ConfirmationDialog";

export function showHideTonieConfirm(t: any, tonieLabel: string): Promise<boolean> {
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
                title={t("tonies.confirmHideModal.title")}
                open={true}
                okText={t("tonies.confirmHideModal.hide")}
                cancelText={t("tonies.confirmHideModal.cancel")}
                content={t("tonies.confirmHideModal.confirmHideDialog", { tonieToHide: tonieLabel })}
                handleOk={handleOk}
                handleCancel={handleCancel}
            />
        );
    });
}
