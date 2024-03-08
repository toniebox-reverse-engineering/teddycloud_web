import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

  const [files, setFiles] = useState([]);
  const [path, setPath] = useState('');
  const location = useLocation();
  const navigate = useNavigate();


  useEffect(() => {
    // Function to parse the query parameters from the URL
    const queryParams = new URLSearchParams(location.search);
    const initialPath = queryParams.get('path') || ''; // Get the 'path' parameter from the URL, default to empty string if not present

    setPath(initialPath); // Set the initial path
  }, [location]);

  useEffect(() => {
    // TODO: fetch option value with API Client generator
    fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/fileIndexV2?path=${path}`)
      .then((response) => response.json())
      .then((data) => {
        setFiles(data.files);
      });
  }, [path]);

  const handleDirClick = (dirPath: string) => {
    const newPath = dirPath === ".." ? path.split("/").slice(0, -1).join("/") : `${path}/${dirPath}`;
    navigate(`?path=${newPath}`); // Update the URL with the new path using navigate
    setPath(newPath); // Update the path state
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => {
        if (record.isDir) {
          return (
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleDirClick(record.name)}>
              {text}
            </span>
          );
        }
        return text;
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: any) => (record.isDir ? '<DIR>' : size),
    },
    {
      title: 'Picture',
      dataIndex: ['tonieInfo', 'picture'],
      key: 'picture',
      render: (picture: string) => picture && <img src={picture} alt="Tonie Picture" style={{ width: 100 }} />
    },
    {
      title: 'Model',
      dataIndex: ['tonieInfo', 'model'],
      key: 'model',
    },
    {
      title: 'Series',
      dataIndex: ['tonieInfo', 'series'],
      key: 'series',
    },
    {
      title: 'Episode',
      dataIndex: ['tonieInfo', 'episode'],
      key: 'episode',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
  ];

  const defaultSorter = (a: any, b: any, key: string) => {
    const fieldA = a[key];
    const fieldB = b[key];

    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return fieldA.localeCompare(fieldB);
    } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return fieldA - fieldB;
    } else {
      console.log("Unsupported types for sorting:", fieldA, fieldB);
      return 0;
    }
  };

  columns.forEach(column => {
    if (!column.hasOwnProperty('sorter')) {
      (column as any).sorter = (a: any, b: any) => defaultSorter(a, b, column.key);
    }
  });
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
          <Table dataSource={files} columns={columns} rowKey="name" pagination={false} />;
        </StyledContent>
      </StyledLayout>
    </>
  );
};
