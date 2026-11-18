import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "antd";

import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";
import { useAuth } from "../provider/AuthProvider";
import { backendUrl } from "../utils/basePath";

const api = new TeddyCloudApi(defaultAPIConfig());

export const checkWebVersionMismatch = async (t: (key: string) => string) => {
    try {
        const ignoreResp = await api.apiGetTeddyCloudSettingRaw(
            "frontend.ignore_web_version_mismatch"
        );
        const ignoreMismatch = (await ignoreResp.text()).trim() === "true";
        if (ignoreMismatch) {
            return;
        }

        const expectedShaResp = await api.apiGetTeddyCloudSettingRaw(
            "internal.version_web.git_sha"
        );
        const expectedWebGitSha = (await expectedShaResp.text()).trim();

        const actualResp = await fetch(backendUrl("/web/web_version.json"));
        let actualWebGitSha = "";
        if (actualResp.ok) {
            const actualData = await actualResp.json();
            actualWebGitSha = actualData.web_gitSha ? String(actualData.web_gitSha).trim() : "";
        }

        console.log("expected Web Git Sha: ", expectedWebGitSha);
        console.log("actual Web Git Sha: ", actualWebGitSha);

        if (import.meta.env.MODE === "production") {
            if (
                expectedWebGitSha &&
                expectedWebGitSha !== "unknown" &&
                actualWebGitSha !== "DEVELOPMENT MODE" &&
                expectedWebGitSha !== actualWebGitSha
            ) {
                Modal.error({
                    title: t("home.error"),
                    content: (
                        <div>
                            <p>{t("home.errorWebVersionMismatch")}</p>
                            <div
                                style={{
                                    fontSize: 12,
                                    marginTop: 8,
                                    opacity: 0.8,
                                    fontFamily: "monospace",
                                }}
                            >
                                <div>Expected: {expectedWebGitSha.slice(0, 7)}</div>
                                <div>
                                    Found: {actualWebGitSha ? actualWebGitSha.slice(0, 7) : "missing"}
                                </div>
                            </div>
                        </div>
                    ),
                    okText: t("home.errorConfirm"),
                });
            }
        }
    } catch (err) {
        console.log("Something went wrong checking web version mismatch:", err);
    }
};

export const useWebVersionMismatchCheck = () => {
    const { t } = useTranslation();
    const { loading, statusAvailable, needsLogin } = useAuth();

    useEffect(() => {
        if (loading || !statusAvailable || needsLogin) {
            return;
        }

        void checkWebVersionMismatch(t);
    }, [loading, statusAvailable, needsLogin, t]);
};
