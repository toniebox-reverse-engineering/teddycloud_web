import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";

const { Paragraph } = Typography;

export const CommunityPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <CommunitySubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[{ title: t("home.navigationTitle") }, { title: t("community.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t(`community.title`)}</h1>
                    <Paragraph>
                        <h2>Get involved</h2>
                        Be a part of our global contributor community by writing code, commenting on issues, or
                        participate in discussons in our telegram group.
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
