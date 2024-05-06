import React from 'react';
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Typography, Alert, List } from 'antd';

import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";

const { Paragraph, Text } = Typography;

export const ChangelogPage = () => {
  const { t } = useTranslation();

  const changelogData = [
    {
      version: "0.5.0",
      changes: [
        "security mitigations on public instances as it‘s definitely not recommended to host teddycloud in public accessible for all",
        "prepared authentication for frontend (backend adaptions)",
        "linked new /web gui on teddycloud administration gui",
        "overworked header, reordered menu items, new icons, better readable status in new /web gui",
        "fixed modals (still some display problems on small devices like mobiles exists)",
        "added audio encoder to new /web gui, you are now able to select files and encode them to a taf",
        "This lets you bring your own content easily on an existing tonie.", // This line added
        "added toniebox management to new /web gui, improved backend functions for that",
        "only at least once connected boxes are listed, model must be set manually",
        "enriched homepage in new /web gui with 5 randomly selected tonies of yours",
        "adapt tonie card list to different cover image sizes in new /web gui (all cards within one row have now the same height)",
        "added no cloud and live icon (Toggle to enable/disable) on tonie card in new /web gui",
        "fixed several bugs"
      ],
      commits: [
        "https://github.com/toniebox-reverse-engineering/teddycloud/pull/154",
        "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/8",
        "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/9",
        "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/19",
        "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/21",
        "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/22"
      ],
      discussionLink: "https://forum.revvox.de/t/release-notes-0-5-0/444",
      githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.5.0"
    },
    {
      version: "0.4.5 and older",
      changes: [
        "A lot more. See Github for details!"
      ],
      commits: []
    }
  ];

  return (
    <>
      <StyledSider>
        <CommunitySubNav />
      </StyledSider>
      <StyledLayout>
        <HiddenDesktop>
          <CommunitySubNav />
        </HiddenDesktop>
        <StyledBreadcrumb items={[
          { title: t("home.navigationTitle") },
          { title: t("community.navigationTitle") },
          { title: t("community.changelog.navigationTitle") }
        ]} />
        <StyledContent>
          <h1>{t(`community.changelog.title`)}</h1>
          <Paragraph>
            <List
              dataSource={changelogData}
              renderItem={(item) => (
                <>
                  <h2>Version {item.version}</h2>
                  <Paragraph>
                    <h3>Changes</h3>
                    <ul>
                      {item.changes.map((change, index) => (
                        <li key={index}>{change}</li>
                      ))}
                    </ul>
                  </Paragraph>
                  {item.commits && item.commits.length > 0 && (
                    <>
                      <Text strong>All contained commits can be found here (teddy cloud repo):</Text>
                      <ul>
                        {item.commits.map((commit, index) => (
                          <li key={index}>
                            <Link to={commit}>{commit}</Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {item.discussionLink && (
                    <>
                      <Text strong>Discussion:</Text>
                      <ul>
                        <li>
                          <Link to={item.discussionLink}>{item.discussionLink}</Link>
                        </li>
                      </ul>
                    </>
                  )}
                  {item.githubReleaseLink && (
                    <>
                      <Text strong>GitHub Release:</Text>
                      <ul>
                        <li>
                          <Link to={item.githubReleaseLink}>{item.githubReleaseLink}</Link>
                        </li>
                      </ul>
                    </>
                  )}
                </>
              )}
            />
          </Paragraph>
        </StyledContent>
      </StyledLayout>
    </>
  );
};
