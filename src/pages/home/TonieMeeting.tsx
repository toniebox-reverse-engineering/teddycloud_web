import { useTranslation } from "react-i18next";
import { Typography } from "antd";
import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { TonieMeetingElement } from "../../components/TonieMeeting";

const { Paragraph } = Typography;

export const TonieMeetingPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <HomeSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <HomeSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[{ title: t("home.navigationTitle") }, { title: t("home.tonieMeeting.navigationTitle") }]}
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
