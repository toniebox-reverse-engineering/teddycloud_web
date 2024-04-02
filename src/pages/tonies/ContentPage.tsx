import { useTranslation } from 'react-i18next';
import {
  HiddenDesktop, StyledBreadcrumb, StyledContent, StyledLayout, StyledSider
} from '../../components/StyledComponents';

import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from '../../components/tonies/FileBrowser';

export const ContentPage = () => {
  const { t } = useTranslation();
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
          <FileBrowser special="" />
        </StyledContent>
      </StyledLayout>
    </>
  );
};
