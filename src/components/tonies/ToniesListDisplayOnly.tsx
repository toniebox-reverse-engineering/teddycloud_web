import { List } from 'antd';
import { TonieCard, TonieCardProps } from '../../components/tonies/TonieCardDisplayOnly';

export const ToniesList: React.FC<{ tonieCards: TonieCardProps[] }> = ({ tonieCards }) => {
    return (
        <List
            grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 4,
                xxl: 5,
            }}
            dataSource={tonieCards}
            renderItem={(tonie) => (
                <List.Item id={tonie.ruid}>
                    <TonieCard tonieCard={tonie} />
                </List.Item>
            )}
        />
    )
}