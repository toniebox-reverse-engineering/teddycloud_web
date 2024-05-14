import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Typography, Button, Alert, List, Card } from "antd";

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

    const contributionTiles = [
        { id: "1", title: "Title 1", content: "Text for Title 1" },
        { id: "2", title: "Title 2", content: "Text for Title 2" },
        { id: "3", title: "Title 3", content: "Text for Title 3" },
        { id: "4", title: "Title 4", content: "Text for Title 4" },
        // Add more title-text pairs as needed
    ];

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
                        <List
                            grid={{
                                gutter: 16,
                                xs: 1,
                                sm: 2,
                                md: 2,
                                lg: 2,
                                xl: 2,
                                xxl: 2,
                            }}
                            dataSource={contributionTiles}
                            renderItem={(contributionTile) => (
                                <List.Item id={contributionTile.id}>
                                    <Card
                                        title={contributionTile.title}
                                        content={contributionTile.content}
                                        size="small"
                                    />
                                </List.Item>
                            )}
                        />
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
