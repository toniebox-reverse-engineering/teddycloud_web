import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

const api = new TeddyCloudApi(defaultAPIConfig());

export const FileBrowser: React.FC<{ special: string }> = ({ special }) => {
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
        fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/fileIndexV2?path=${path}&special=${special}`)
            .then((response) => response.json())
            .then((data) => {
                setFiles(data.files);
            });
    }, [path, special]);

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

    const defaultSorter = (a: any, b: any, dataIndex: string | string[]) => {
        const getValue = (obj: any, keys: string[]) => {
            return keys.reduce((acc, currentKey) => {
                if (acc && acc[currentKey] !== undefined) {
                    return acc[currentKey];
                }
                return undefined;
            }, obj);
        };

        // Get the values of the fields
        const fieldA = Array.isArray(dataIndex) ? getValue(a, dataIndex) : a[dataIndex];
        const fieldB = Array.isArray(dataIndex) ? getValue(b, dataIndex) : b[dataIndex];

        if (fieldA === undefined && fieldB === undefined) {
            return 0; // Both values are undefined, consider them equal
        } else if (fieldA === undefined) {
            return 1; // Field A is undefined, consider it greater than B
        } else if (fieldB === undefined) {
            return -1; // Field B is undefined, consider it greater than A
        }

        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
            return fieldA.localeCompare(fieldB);
        } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
            return fieldA - fieldB;
        } else {
            console.log("Unsupported types for sorting:", a, b);
            console.log("Unsupported types for sorting field:", dataIndex, fieldA, fieldB);
            return 0;
        }
    };

    columns.forEach(column => {
        if (!column.hasOwnProperty('sorter')) {
            (column as any).sorter = (a: any, b: any) => defaultSorter(a, b, column.dataIndex);
        }
    });
    return (
        <Table dataSource={files} columns={columns} rowKey="name" pagination={false} onRow={(record, rowIndex) => ({
            onDoubleClick: () => {
                if (record.isDir) {
                    handleDirClick(record.name);
                }
            }
        })} />
    );
};
