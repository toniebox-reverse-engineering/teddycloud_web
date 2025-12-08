import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useTeddyCloudVersion = () => {
    const [version, setVersion] = useState("");
    const [versionShort, setVersionShort] = useState("");
    const [commitGitShaShort, setCommitGitShaShort] = useState("");
    const [commitGitSha, setCommitGitSha] = useState("");

    const [newVersionAvailable, setNewVersionAvailable] = useState<boolean>(false);
    const [isDevelopVersion, setIsDevelopVersion] = useState<boolean>(false);
    const [latestDevelopSHA, setLatestDevelopSHA] = useState("");
    const [latestReleaseVersion, setLatestReleaseVersion] = useState("");

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

        api.apiGetTeddyCloudSettingRaw("internal.version.git_sha")
            .then((r) => r.text())
            .then(setCommitGitSha)
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!versionShort || !commitGitSha) {
            return;
        }

        const develop = versionShort.endsWith("X.X.X");
        setIsDevelopVersion(develop);

        const endpoint = develop ? "/reverseGeneric/teddycloud_develop" : "/reverseGeneric/teddycloud_release";

        api.apiGetTeddyCloudApiRaw(endpoint)
            .then((response) => response.json())
            .then((versionInfo) => {
                if (develop) {
                    const latestDevelopSHA = versionInfo.sha;
                    setNewVersionAvailable(commitGitSha !== latestDevelopSHA);
                    setLatestDevelopSHA(latestDevelopSHA);
                } else {
                    const tagName = versionInfo.tag_name;
                    setNewVersionAvailable(versionShort.replace("v", "tc_v") !== tagName);
                    setLatestReleaseVersion(tagName);
                }
            })
            .catch(() => {
                // ignore
            });
    }, [versionShort, commitGitSha]);

    return {
        version,
        versionShort,
        commitGitShaShort,
        commitGitSha,
        latestDevelopSHA,
        latestReleaseVersion,
        newVersionAvailable,
        isDevelopVersion,
    };
};
