import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { Link } from "react-router-dom";

interface FeatureItems {
    [key: string]: string | FeatureGroup;
}

interface FeatureGroup {
    title: string;
    items: FeatureItems;
}

export const FeaturesPage = () => {
    const { t } = useTranslation();
    const [version, setVersion] = useState("");
    const [versionShort, setVersionShort] = useState("");
    const [commitGitShaShort, setCommitGitShaShort] = useState("");

    useEffect(() => {
        fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/internal.version.v_long`)
            .then((response) => response.text())
            .then((data) => setVersion(data))
            .catch((error) => console.error("Error fetching data:", error));
        fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/internal.version.id`)
            .then((response) => response.text())
            .then((data) => setVersionShort(data))
            .catch((error) => console.error("Error fetching data:", error));
        fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/internal.version.git_sha_short`)
            .then((response) => response.text())
            .then((data) => setCommitGitShaShort(data))
            .catch((error) => console.error("Error fetching data:", error));
    }, []);


    const renderList = (items: FeatureItems, prefix: string) => {
        return (
            <ul>
                {Object.keys(items).map(key => {
                    const item = items[key];
                    const itemPrefix = `${prefix}.${key}`;
                    if (typeof item === 'object' && item.items) {
                        return (
                            <li key={key}>
                                {t(`${itemPrefix}.title`)}
                                {renderList(item.items, itemPrefix + ".items")}
                            </li>
                        );
                    }
                    return <li key={key}>{t(itemPrefix)}</li>;
                })}
            </ul>
        );
    };

    const features = t('home.features.features', { returnObjects: true }) as FeatureItems;
    const futureFeatures = t('home.features.futureFeatures', { returnObjects: true }) as FeatureItems;

    return (
        <>
            <StyledSider>
                <HomeSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <HomeSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("home.features.navigationTitle") }
                    ]}
                />
                <StyledContent>
                    <h1>{t("home.features.title") + " " + versionShort}</h1>

                    <p>{t("home.features.description")}</p>
                    <p>Build: <Link
                        to={"https://github.com/toniebox-reverse-engineering/teddycloud/tree/" + commitGitShaShort}
                        target="_blank">{version.replace(versionShort, "")}</Link></p>
                    <h2>{t("home.features.currentlyImplementedFeatures")}</h2>
                    {renderList(features, 'home.features.features')}
                    <h2>{t("home.features.yetToCome")}</h2>
                    {renderList(futureFeatures, 'home.features.futureFeatures')}
                </StyledContent>
            </StyledLayout >
        </>
    );
};