import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useTeddyCloudVersion = () => {
    const [version, setVersion] = useState("");
    const [versionShort, setVersionShort] = useState("");
    const [commitGitShaShort, setCommitGitShaShort] = useState("");

    useEffect(() => {
        api.apiGetTeddyCloudSettingRaw("internal.version.v_long")
            .then((r) => r.text())
            .then(setVersion)
            .catch(() => {});

        api.apiGetTeddyCloudSettingRaw("internal.version.id")
            .then((r) => r.text())
            .then(setVersionShort)
            .catch(() => {});

        api.apiGetTeddyCloudSettingRaw("internal.version.git_sha_short")
            .then((r) => r.text())
            .then(setCommitGitShaShort)
            .catch(() => {});
    }, []);

    return { version, versionShort, commitGitShaShort };
};
