import { changeLanguage } from "i18next";
import { Dropdown, MenuProps, Space, Tag } from "antd";
import {
  GlobalOutlined
} from '@ant-design/icons';

export const StyledLanguageSwitcher = () => {
  
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: "EN",
      onClick: () => changeLanguage("en")
    },
    {
      key: '2',
      label: "DE",
      onClick: () => changeLanguage("de")
    },
  ];

  return (
    <Space>
      <Dropdown menu={{ items }} placement="bottom" trigger={['click']}>
        <Tag color="transparent"><GlobalOutlined /></Tag>
      </Dropdown>
    </Space>
  );
};
