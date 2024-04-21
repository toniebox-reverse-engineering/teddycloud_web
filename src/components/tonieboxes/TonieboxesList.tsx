
import { List } from 'antd';
import { TonieboxCard, TonieboxCardProps } from '../../components/tonieboxes/TonieboxCard';

export const TonieboxesList: React.FC<{ tonieboxCards: TonieboxCardProps[] }> = ({ tonieboxCards }) => {
    return (

        <List
            grid={{
                gutter: 7,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 4,
                xxl: 4,
            }}
            dataSource={tonieboxCards}
            renderItem={(toniebox) => (
                <List.Item>
                    <TonieboxCard tonieboxCard={toniebox} />
                </List.Item>
            )}
        />
    )
}