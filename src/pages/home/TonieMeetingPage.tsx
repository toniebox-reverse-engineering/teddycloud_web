import { useTranslation } from "react-i18next";
import { Typography } from "antd";
import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { TonieMeetingElement } from "../../components/TonieMeeting";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const TonieMeetingPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <HomeSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: t("home.tonieMeeting.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <Paragraph>
                        <TonieMeetingElement
                            maxNoOfGuests={500}
                            toniesSize={150}
                            showQuestionMark={false}
                        ></TonieMeetingElement>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
