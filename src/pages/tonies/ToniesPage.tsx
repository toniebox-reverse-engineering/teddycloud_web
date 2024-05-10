import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiddenDesktop, StyledBreadcrumb, StyledContent, StyledLayout, StyledSider } from '../../components/StyledComponents';
import { TonieCardProps } from '../../components/tonies/TonieCard'; // Import the TonieCard component and its props type
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { ToniesList } from '../../components/tonies/ToniesList';

import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { Select } from 'antd';
import { useLocation } from 'react-router-dom';

const api = new TeddyCloudApi(defaultAPIConfig());
const { Option } = Select;

export const ToniesPage = () => {

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const linkOverlay = searchParams.get('overlay');

  const { t } = useTranslation();
  const [tonies, setTonies] = useState<TonieCardProps[]>([])
  const [tonieBoxContentDirs, setTonieboxContentDirs] = useState<Array<[string, string[], string]>>([]);
  const [overlay, setOverlay] = useState(() => {
    if (linkOverlay !== null) {
      console.log("LinkOverlay: ", linkOverlay);
      localStorage.setItem('overlay', linkOverlay);
      return linkOverlay;
    } else {
      console.log("storedOverlay");
      const savedOverlay = localStorage.getItem('overlay');
      return savedOverlay ? savedOverlay : "TC Default";
    }
  });

  useEffect(() => {
    const overlay = localStorage.getItem('overlay');
    if (overlay) {
      setOverlay(overlay);
    }
  }, []);

  useEffect(() => {
    const fetchContentDirs = async () => {
      const tonieboxData = await api.apiGetTonieboxesIndex();

      const tonieboxContentDirs = await Promise.all(
        tonieboxData.map(async toniebox => {
          const contentDir = await api.apiGetTonieboxContentDir(toniebox.ID);
          return [contentDir, toniebox.boxName, toniebox.ID,] as [string, string, string];
        })
      );

      const groupedContentDirs: [string, string[], string][] = tonieboxContentDirs.reduce((acc: [string, string[], string][], [contentDir, boxName, boxID]) => {

        const existingGroupIndex = acc.findIndex(group => group[0] === contentDir);
        if (existingGroupIndex !== -1) {
          acc[existingGroupIndex][1].push(boxName);
          setOverlay(acc[existingGroupIndex][2]);
        } else {
          acc.push([contentDir, [boxName], boxID]);
        }
        return acc;
      }, []);

      groupedContentDirs.push(["", ["TeddyCloud Default Content Dir"], ""]);

      const updatedContentDirs: [string, string[], string][] = groupedContentDirs.map(([contentDir, boxNames, boxId]) => [contentDir, boxNames, boxId]);

      setTonieboxContentDirs(updatedContentDirs);
    };
    fetchContentDirs();

  }, []);

  useEffect(() => {
    const fetchTonies = async () => {
      const tonieData = await api.apiGetTagIndex(overlay ? overlay : "");
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
  }, [overlay]);

  const handleSelectChange = (overlay: string) => {
    setOverlay(overlay);
    localStorage.setItem('overlay', overlay);
  };

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
          ]}
        />
        <StyledContent>
          <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", flexDirection: "row", alignItems: "center" }}>
            <h1 style={{ width: "200px" }}>{t('tonies.title')}</h1>
            <Select id="contentDirectorySelect" defaultValue="" onChange={handleSelectChange} style={{ maxWidth: "300px" }}
              value={overlay}>
              {tonieBoxContentDirs.map(([contentDir, boxNames, boxId]) => (
                <Option key={boxId} value={boxId}>
                  {boxNames}
                </Option>
              ))}
            </Select></div>
          <ToniesList showFilter={true} tonieCards={tonies.filter(tonie => tonie.type === 'tag')} />
        </StyledContent>
      </StyledLayout>
    </>
  );
};
