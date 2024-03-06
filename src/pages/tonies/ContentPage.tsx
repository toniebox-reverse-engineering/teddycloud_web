import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiddenDesktop, StyledBreadcrumb, StyledContent, StyledLayout, StyledSider
} from '../../components/StyledComponents';
import { Table } from 'antd';
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";

const api = new TeddyCloudApi(defaultAPIConfig());

export const ContentPage = () => {
  const { t } = useTranslation();
  const dataSource = [
    {
      key: '1',
      name: 'Mike',
      age: 32,
      address: '10 Downing Street',
    },
    {
      key: '2',
      name: 'John',
      age: 42,
      address: '10 Downing Street',
    },
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
  ];

  return (
    <>
      <StyledSider><ToniesSubNav /></StyledSider>
      <StyledLayout>
        <HiddenDesktop>
          <ToniesSubNav />
        </HiddenDesktop>
        <StyledBreadcrumb
          items={[
            { title: t('home.navigationTitle') },
            { title: t('tonies.navigationTitle') },
            { title: t('tonies.content.navigationTitle') },
          ]}
        />
        <StyledContent>
          <h1>{t('tonies.content.title')}</h1>
          <Table dataSource={dataSource} columns={columns} />;
        </StyledContent>
      </StyledLayout>
    </>
  );
};
