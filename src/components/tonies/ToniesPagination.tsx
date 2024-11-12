import React from "react";
import { useTranslation } from "react-i18next";
import { Pagination, Button } from "antd";

interface ToniesPaginationProps {
    currentPage: number;
    onChange: (current: number, size: number) => void;
    total: number;
    pageSize: number;
    additionalButtonOnClick: () => void;
}

const ToniesPagination: React.FC<ToniesPaginationProps> = ({
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
                pageSizeOptions={["24", "48", "96", "192"]}
                locale={{ items_per_page: t("tonies.tonies.pageSelector") }}
                style={{ marginBottom: 8 }}
            />
            <Button onClick={additionalButtonOnClick} style={{ marginLeft: 16 }}>
                {t("tonies.tonies.showAll")}
            </Button>
        </>
    );
};

export default ToniesPagination;
