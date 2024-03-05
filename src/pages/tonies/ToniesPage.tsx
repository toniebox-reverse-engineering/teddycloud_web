import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List } from 'antd';
import { StyledBreadcrumb, StyledContent, StyledLayout, StyledSider } from '../../components/StyledComponents';
import { TonieCard, TonieCardProps } from '../../components/tonies/TonieCard'; // Import the TonieCard component and its props type
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

const api = new TeddyCloudApi(defaultAPIConfig());

export const ToniesPage = () => {
  const { t } = useTranslation();

  // Define the state with TonieCardProps[] type
  const [tonies, setTonies] = useState<TonieCardProps[]>([]);

  useEffect(() => {
    const fetchTonies = async () => {
      // Perform API call to fetch Tonie data
      const tonieData = await api.apiGetTagIndex();
      setTonies(tonieData.sort((a, b) => {
        if (a.tonieInfo.series < b.tonieInfo.series) {
          return -1;
        }
        if (a.tonieInfo.series > b.tonieInfo.series) {
          return 1;
        }
        if (a.tonieInfo.episode < b.tonieInfo.episode) {
          return -1;
        }
        if (a.tonieInfo.episode > b.tonieInfo.episode) {
          return 1;
        }
        return 0;
      }));
    };

    fetchTonies();
  }, []);

  // Function to fetch Tonie data (replace with your actual API call)
  const fetchTonieData = async () => {

    // Sample data for demonstration
    /*
    return [
      {
        uid: 'E0:04:03:50:17:64:46:B3',
        ruid: 'b3466417500304e0',
        type: 'tag',
        valid: true,
        exists: true,
        tonieInfo: {
          series: 'Disney',
          episode: 'Cars 2',
          model: '10000989',
          picture: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/10000989-50003227-b-DiWOB9PC.png',
        }
      },
      {

        uid: 'E0:04:03:50:17:64:46:B3',
        ruid: 'b3466417500304e0',
        type: 'tag',
        valid: true,
        exists: true,
        tonieInfo: {
          series: 'Disney',
          episode: 'Cars 2',
          model: '10000989',
          picture: 'https://278163f382d2bab4b036-4f5ec62496a160f3570d3b6e48fc4516.ssl.cf3.rackcdn.com/10000989-50003227-b-DiWOB9PC.png',
        },

      },
      // Add more Tonie objects as needed
    ];
    */
  };

  return (
    <>
      <StyledSider>&nbsp;</StyledSider>
      <StyledLayout>
        <StyledBreadcrumb
          items={[
            { title: t('home.navigationTitle') },
            { title: t('tonies.navigationTitle') },
          ]}
        />
        <StyledContent>
          <h1>{t('tonies.title')}</h1>
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
            dataSource={tonies.filter(tonie => tonie.type === 'tag')}
            renderItem={(tonie) => (
              <List.Item>
                <TonieCard tonieCard={tonie} />
              </List.Item>
            )}
          />
        </StyledContent>
      </StyledLayout>
    </>
  );
};
