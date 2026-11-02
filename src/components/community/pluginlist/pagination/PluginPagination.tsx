import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Pagination } from "antd";

interface PluginPaginationProps {
    currentPage: number;
    onChange: (current: number, size: number) => void;
    total: number;
    pageSize: number;
    additionalButtonOnClick: () => void;
}

const PluginPagination: React.FC<PluginPaginationProps> = ({
    currentPage,
    onChange,
    total,
    pageSize,
    additionalButtonOnClick,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={onChange}
                showSizeChanger
                pageSizeOptions={["6", "12", "24", "48"]}
                locale={{ items_per_page: t("community.plugins.pagination.pageSelector") }}
                style={{ marginBottom: 8 }}
                showLessItems
            />
            <Button onClick={additionalButtonOnClick} style={{ marginLeft: 16 }}>
                {t("community.plugins.pagination.showAll")}
            </Button>
        </>
    );
};

export default PluginPagination;
