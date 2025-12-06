import { JSX, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Breadcrumb, Layout, Menu, theme } from "antd";
import Sider from "antd/es/layout/Sider";
import styled from "styled-components";
import { extractText } from "../../utils/strings/extractText";

const { useToken } = theme;

type BreadcrumbItem = {
    title: JSX.Element | string;
};

type BreadcrumbWrapperProps = {
    items: BreadcrumbItem[];
};

export const StyledSubMenu = styled(Menu)`
    height: 100%;
    border-right: 0;
`;

export const StyledSider = styled(Sider)`
    min-width: 230px !important;

    @media (max-width: 767px) {
        display: none;
    }
`;

export const StyledLayout = styled(Layout)`
    padding: 0 24px 24px;
`;

export const StyledBreadcrumb = styled(Breadcrumb)`
    margin: 16px 0;
`;

export const StyledContent = styled(Layout.Content)`
    padding: 24px;
    margin: 0;
    min-height: 280px;
    background: ${() => useToken().token.colorBgContainer};
`;

export const HiddenDesktop = styled.span`
    @media (min-width: 767px) {
        display: none;
    }
`;

export const HiddenMobile = styled.span`
    @media (max-width: 767px) {
        display: none;
    }
`;

const BreadcrumbWrapper: React.FC<BreadcrumbWrapperProps> = ({ items }) => {
    const { t } = useTranslation();

    const pageTitle = useMemo(() => {
        if (items.length <= 1) return "TeddyCloud";

        const translated = items
            .slice(1)
            .map((i) => t(extractText(i.title)))
            .join(" - ");

        return `TeddyCloud - ${translated}`;
    }, [items, t]);

    useEffect(() => {
        document.title = pageTitle;
    }, [pageTitle]);

    return <StyledBreadcrumb items={items} />;
};

export default BreadcrumbWrapper;
