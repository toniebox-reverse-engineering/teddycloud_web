import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { gitHubTCCommitTreeBaseUrl } from "../../../constants/urls";
import { useTeddyCloudVersion } from "../../../hooks/useTeddyCloudVersion";
import { FeatureItems, renderFeatureList } from "./render/renderFeatureList";

export const Features = () => {
    const { t } = useTranslation();
    const { version, versionShort, commitGitShaShort } = useTeddyCloudVersion();

    const features = t("home.features.features", {
        returnObjects: true,
    }) as unknown as FeatureItems;

    const futureFeatures = t("home.features.futureFeatures", {
        returnObjects: true,
    }) as unknown as FeatureItems;

    return (
        <>
            <h1>{t("home.features.title") + " " + versionShort}</h1>

            <p>{t("home.features.description")}</p>

            <p>
                {t("home.build")}:{" "}
                <Link to={gitHubTCCommitTreeBaseUrl + commitGitShaShort} target="_blank">
                    {version.replace(versionShort, "")}
                </Link>
            </p>

            <h2>{t("home.features.currentlyImplementedFeatures")}</h2>
            {renderFeatureList(features, "home.features.features", t)}

            <h2>{t("home.features.yetToCome")}</h2>
            {renderFeatureList(futureFeatures, "home.features.futureFeatures", t)}
        </>
    );
};
