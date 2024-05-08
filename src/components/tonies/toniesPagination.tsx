import React from 'react';
import { Pagination, Button } from 'antd';
import { useTranslation } from 'react-i18next';

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
    additionalButtonOnClick
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
                pageSizeOptions={["24", "48", "96", "192"]} // Set pageSizeOptions                
                locale={{ items_per_page: t('tonies.tonies.pageSelector') }} // Set locale
                style={{ margin: '0 16px' }}
            />
            <Button onClick={additionalButtonOnClick} style={{ marginRight: '8px' }}>
                {t('tonies.tonies.showAll')}
            </Button>
        </>
    );
};

export default ToniesPagination;
