import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

interface GitHubRef {
    ref: string;
    node_id: string;
    url: string;
    object: {
        sha: string;
        type: string;
        url: string;
    };
}

const parseRcVersion = (ref: string): number[] | null => {
    const match = ref.match(/^refs\/tags\/rc_v(\d+)\.(\d+)\.(\d+)(?:-(?:rc)?(\d+))?$/);

    return match
        ? [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4] ?? 0)]
        : null;
};

export const useTeddyCloudVersion = () => {
    const [version, setVersion] = useState("");
    const [versionShort, setVersionShort] = useState("");
    const [commitGitShaShort, setCommitGitShaShort] = useState("");
    const [commitGitSha, setCommitGitSha] = useState("");

    const [newVersionAvailable, setNewVersionAvailable] = useState<boolean>(false);
    const [isDevelopVersion, setIsDevelopVersion] = useState<boolean>(false);
    const [isReleaseCandidateVersion, setIsReleaseCandidateVersion] = useState<boolean>(false);

    const [latestDevelopSHA, setLatestDevelopSHA] = useState("");
    const [latestReleaseCandidateTag, setLatestReleaseCandidateTag] = useState("");
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

        const develop = versionShort.endsWith("X.X.X") && !versionShort.includes("rc");
        const releaseCandidate = versionShort.includes("rc");

        setIsDevelopVersion(develop);
        setIsReleaseCandidateVersion(releaseCandidate);

        const endpoint = releaseCandidate
            ? "/reverseGeneric/teddycloud_release_candidate"
            : develop
              ? "/reverseGeneric/teddycloud_develop"
              : "/reverseGeneric/teddycloud_release";

        api.apiGetTeddyCloudApiRaw(endpoint)
            .then((response) => response.json())
            .then((versionInfo) => {
                if (releaseCandidate) {
                    const refs = versionInfo as GitHubRef[];

                    const candidates = refs
                        .map((ref) => ({
                            ...ref,
                            version: parseRcVersion(ref.ref),
                        }))
                        .filter((ref) => ref.version !== null && ref.object.type === "commit");

                    candidates.sort((a, b) => {
                        const va = a.version!;
                        const vb = b.version!;

                        for (let i = 0; i < 4; i++) {
                            if (va[i] !== vb[i]) {
                                return vb[i] - va[i];
                            }
                        }

                        return 0;
                    });

                    const latest = candidates[0];

                    if (!latest) {
                        return;
                    }

                    const latestTag = latest.ref.replace("refs/tags/", "");

                    // Example: v0.7.1-rc2 -> rc_v0.7.1-2
                    const currentTag = versionShort
                        .replace(/^v/, "rc_v")
                        .replace(/-rc(\d+)$/, "-$1")
                        .replace(/-rc$/, "");

                    const currentVersion = parseRcVersion(`refs/tags/${currentTag}`);

                    setLatestReleaseCandidateTag(latestTag);

                    if (!currentVersion) {
                        return;
                    }

                    const updateAvailable = latest.version!.some((value, index) => {
                        for (let i = 0; i < index; i++) {
                            if (latest.version![i] !== currentVersion[i]) {
                                return false;
                            }
                        }

                        return value > currentVersion[index];
                    });

                    setNewVersionAvailable(updateAvailable);
                } else if (develop) {
                    const latestDevelopSHA = versionInfo.sha;
                    setNewVersionAvailable(
                        !commitGitSha.includes("unknown") && commitGitSha !== latestDevelopSHA,
                    );
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
        latestReleaseCandidateTag,
        latestReleaseVersion,
        newVersionAvailable,
        isDevelopVersion,
        isReleaseCandidateVersion,
    };
};
