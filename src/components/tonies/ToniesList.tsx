
import { List } from 'antd';
import { useTranslation } from 'react-i18next'; // Assuming you are using react-i18next for translation
import { TonieCard, TonieCardProps } from '../../components/tonies/TonieCard';

export const ToniesList: React.FC<{ tonieCards: TonieCardProps[] }> = ({ tonieCards }) => {

    const { t } = useTranslation();

    return (
        <List

            grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 4,
                xxl: 6
            }}
            pagination={{
                showSizeChanger: true,
                defaultPageSize: 24,
                pageSizeOptions: ["24", "48", "96", "192"],
                position: "both",
                style: { "marginBottom": "16px" },
                locale: {
                    items_per_page: t('tonies.pageSelector'), // Custom text for page size selector
                }
            }}

            dataSource={tonieCards}
            renderItem={(tonie) => (
                <List.Item>
                    <TonieCard tonieCard={tonie} />
                </List.Item>
            )}
        />
    )
}