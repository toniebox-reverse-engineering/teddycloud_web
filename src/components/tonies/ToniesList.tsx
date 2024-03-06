
import { List } from 'antd';
import { TonieCard, TonieCardProps } from '../../components/tonies/TonieCard';

export const ToniesList: React.FC<{ tonieCards: TonieCardProps[] }> = ({ tonieCards }) => {
    return (
        <List
            grid={{
                gutter: 7,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 4,
                xxl: 5,
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