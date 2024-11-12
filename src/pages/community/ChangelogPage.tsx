import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Typography, List } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
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
            version: "0.6.3",
            changes: [
                "Stabilization backend",
                "Added Hide Information in filesV2 Api https://github.com/toniebox-reverse-engineering/teddycloud/issues/234",
                "Provide c2.der symlink",
                "Added custom_img volume for storing custom images - adapt your docker-compose.yaml according https://github.com/toniebox-reverse-engineering/teddycloud/blob/master/docker/docker-compose.yaml",
                "gui: Added version overview page",
                "gui: Added spinning wheel to lists, should also fix https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/129",
                "gui: Extended cc3235 guide based on https://github.com/toniebox-reverse-engineering/teddycloud/issues/232, https://github.com/toniebox-reverse-engineering/teddycloud/issues/230 and https://github.com/toniebox-reverse-engineering/teddycloud/issues/229",
                "gui: Extended audioplayer, fixed bugs, show info of currently played content (in case of taf), added play icon to each track in tonieinfomodal (only if tracks and trackseconds have the same number of elements), on click plays the chapter directly",
                "gui: Edit Tonie/Tag: Overworked rollback and empty field functionality https://github.com/toniebox-reverse-engineering/teddycloud/issues/235",
                "gui: Edit Tonie/Tag: Fixed some bugs",
                "gui: Set Cursor to Default on Filebrowser directory row",
                "gui: Show disabled Cloud in Boxine status badge https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/164",
                "gui: Recheck cloud status on certain changes (cloud.enabled, uploaded certs, autoextracted certs in esp32 flashing process) https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/167",
                "gui: Added notification system, own page. Migrated messages to notification (except settingspages) https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/165",
                "gui: Fixed bug deleting Toniebox https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/174",
                "gui: Mark hidden Tonies/Tags in content view",
                "gui: Only allow *.der files to be uploaded on certificate upload",
                "gui: Added Download buttons/link to download TeddyCloud CA Certificate https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/177",
                "gui: Overworked filebrowsers directory visualization and multi select action buttons https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/162",
                "gui: Some refactoring",
            ],
            commits: [
                "https://github.com/toniebox-reverse-engineering/teddycloud/compare/tc_v0.6.2...tc_v0.6.3",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/compare/tcw_v0.6.2...tcw_v0.6.3",
            ],
            discussionLink: "https://forum.revvox.de/t/release-notes-0-6-3/812",
            githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.6.3",
        },
        {
            version: "0.6.2",
            changes: [
                "Stabilization backend",
                "Provide TrackSeconds for Frontend https://github.com/toniebox-reverse-engineering/teddycloud/issues/187",
                "Fixed bug no update of model in content.json if empty https://github.com/toniebox-reverse-engineering/teddycloud/issues/215",
                "Added web_version.json for consistency checks, including new setting frontend.ignore_web_version_mismatch",
                "Added frontend setting frontend.confirm_audioplayer_close",
                "Fixed some bugs",
                "gui: Next button in audio player now jumps according tracks of taf",
                "gui: Show error if something went wrong while encoding new taf (Audio Encoder)",
                "gui: Added translation overview page in community contribution section",
                "gui: Improved Audio Encoder, leave selected target folder till reload of page, if only one file is added, take filename as preset for taf filename https://github.com/toniebox-reverse-engineering/teddycloud/issues/223",
                "gui: Fixed filterbug in FileBrowser Component (List + Select) https://github.com/toniebox-reverse-engineering/teddycloud/issues/224",
                "gui: Show warning if web_version of gui does not match expected web_version from backend",
                "gui: Show warning if ogg/opus (taf) is not supported by browser",
                "gui: Integrated frontend.confirm_audioplayer_close",
                "gui: Improved Code Snippet Element, show line numbers and added copy functionality",
                "gui: Added Box setup overview page",
                "gui: Added Box version identification page https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/145",
                "gui: Added Open Toniebox guide page https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/146",
                "gui: Extended CC3200 Firmware flash section, added custom alt Url Patch generation. https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/126",
                "gui: Extended CC3200 Firmware flash section, extended Applying Patches step",
                "gui: Extended CC3235 Firmware flash section, same version as wiki, but additional images flash chip",
                "gui: Added ESP32 Firmware flash legacy section, same version as wiki",
                "gui: some refactoring",
            ],
            commits: [
                "https://github.com/toniebox-reverse-engineering/teddycloud/compare/tc_v0.6.1...tc_v0.6.2",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/compare/tcw_v0.6.1...tcw_v0.6.2",
            ],
            discussionLink: "https://forum.revvox.de/t/release-notes-0-6-2/773",
            githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.6.2",
        },
        {
            version: "0.6.1",
            changes: [
                "Stabilization backend",
                "Changed default for setting cloud.prioCustomContent to false",
                "Disabled prioCustomContent if lower audio id is allowed",
                "Added reload tonies(.custom).json api https://github.com/toniebox-reverse-engineering/teddycloud/issues/177",
                "Added moveFile api https://github.com/toniebox-reverse-engineering/teddycloud/issues/198",
                "Added server side taf file encoding",
                "Support TAF files in taps and server side taf file encoding",
                "Added API to extract certificates https://github.com/toniebox-reverse-engineering/teddycloud/issues/103",
                "Initial cert generation generates now a 4096bit long cert https://github.com/toniebox-reverse-engineering/teddycloud/issues/138",
                "Extended settings api",
                "Fixed bug updating empty model information if entry was added in tonies.json https://github.com/toniebox-reverse-engineering/teddycloud/issues/215",
                "Fixed some bugs",
                "gui: Fixed bug storing source with html special chars",
                "gui: Fixed bug saving model and source of a tonie/tag at once",
                "gui: Fixed display bug sourceInfo with unknown content",
                "gui: Integrated new reload tonies.json api",
                "gui: Added Moving and renaming of files in library and content",
                "gui: Fixing security weaknesses",
                "gui: Added file upload to library",
                'gui: If setting "Category frontend: Split content / model" is disabled, don\'t show the source info in Tonies list and details modal',
                "gui: Added encoding functionality in library",
                "gui: Allow playing all encodable files in teddyCloud",
                "gui: ESP32 flash process - integrated remaining manual steps. Certificate extraction is now also automated",
                "gui: Fixed bug tonieboxes if tonieboxes.custom.json was empty or not available https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/133",
                "gui: Added Spanish language - feel free to improve translations as current translation is completely done by ChatGPT.",
            ],
            commits: [
                "https://github.com/toniebox-reverse-engineering/teddycloud/compare/tc_v0.6.0...tc_v0.6.1",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/compare/tcw_v0.6.0...tcw_v0.6.1",
            ],
            discussionLink: "https://forum.revvox.de/t/release-notes-0-6-1/701",
            githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.6.1",
        },
        {
            version: "0.6.0",
            changes: [
                "Stabilization backend",
                "store last played time of last played tag",
                "extend getTagIndex API, provide language in tonieInfos",
                "PoC Toniebox api access (explicitly allow access to teddy cloud api on tonebox level)",
                "Added enable/disable new Tonieboxes: prohibit registration of new tonieboxes if not enabled",
                "Added removal of overlays (= removal of Tonieboxes from TeddyCloud)",
                "add hide tonie/tag functionality (hide using new /web gui, present to box to unhide)",
                "fixed locking bug, reworked locking.",
                "fixed bug not storing cloud auth in some circumstances",
                "fixed bug not storing source in json file: https://github.com/toniebox-reverse-engineering/teddycloud/issues/165",
                "added limit to tempfile creation for radiostreams, default: 240mb (~6h) (configurable if expert mode is activated) https://github.com/toniebox-reverse-engineering/teddycloud/issues/180",
                "added possibility to set WiFi Credentials on ESP32 Firmware patching",
                "introduced second HTTPS port for WebFrontend only, which allows using https for webfrontend (Default: 8443)",
                "tonie images from boxine can now be cached locally (PoC)",
                "new /web gui is now default web gui: https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/47",
                "new /web gui: enhanced Toniecard, added search for Radiostream in Edit Modal",
                "new /web gui: Tonies - Content section - added Migrate Content to Lib button on TAF files",
                "new /web gui: added RTNL Log Page: https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/48",
                "new /web gui: added show Json File when double click on json file (File browser view)",
                "new /web gui: added show TAP File when double click on tap file (File browser view)",
                "new /web gui: added show TAF Header (including AudioID + Hash) when double click on a taf file (File browser view)",
                "new /web gui: show date time of last played tag (toniecard + toniboxcard)",
                "new /web gui: added Tonie Audio Playlist page (WIP - Implementation not yet finished), rearranged menu entries tonies section: https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/52",
                "new /web gui: added delete feature in content, library and audio playlist page",
                "new /web gui: improved changelog page, parse links and open links in new tab; completed contributors page: https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/27",
                "new /web gui: added language flag to tonies card if it's not the same as the most owned language ones, added language filter",
                "new /web gui: deletion of tonieboxes",
                "new /web gui: info if add new boxes is enabled on homepage and tonieboxes page",
                "new /web gui: enable/disable API access for toniebox added on tonieboxes page",
                "new /web gui: add hide tonie/tag in tonies list (in info modal)",
                "new /web gui: PoC Tonies Custom Json Editor (WiP, not working, but you get the json part to copy into the tonies.custom.json)",
                "new /web gui: PoC Tonie Audio Playlist Editor (WiP, not working, but you get the json to copy and save as a TAP file) ",
                "new /web gui: allow TAP files to be selected on Edit Tag Modal",
                "new /web gui: new 404 page",
                "new /web gui: hidden feature Tonie meeting. Search for it!",
                "new /web gui: added link to Toniebox if the box is version cc3200, an ip is available and cfw is installed: https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/28",
                "new /web gui: hide audioplayer if no source is set, when clicking on play icon of a tonie/taf/... the player is shown: https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/40",
                "new /web gui: added minimize/maximize audioplayer https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/40",
                "new /web gui: show Tonie on tonie article search",
                "new /web gui: improved audioplayer, added volume control to custom one, hide doubled audioplayer",
                "new /web gui: added French translation. Feel free to check if chatGPT is a good translator. If something is wrong, give us a shout at telegram!",
                "new /weg gui: overworked filebrowser to be responsive",
                "new /web gui: overworked tonie information modal, now also available in file browser (library + content)",
                "new /web gui: added Create Directory functionality in file browser",
                "new /web gui: added better breadcrumb to filebrowser (clickable for easy directory switching) https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/78",
                "new /web gui: set nocloud to true if source of a tag is changed https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/77",
                "new /web gui: show image and information from set source if different from model https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/80",
                "new /web gui: tonie overview: filter now also considers information from set source",
                "new /web gui: fixed bugs after updating tonies in tonies overview",
                "new /web gui: added FAQ page in community section",
                "new /web gui: support web streams in audioplayer",
                "new /web gui: improved filebrowser, added filter field and made buttons sticky",
                "new /web gui: integrated ESP32 Firmware Flashing https://github.com/toniebox-reverse-engineering/teddycloud_web/issues/46",
                "new /web gui: integrated setting of WiFi credentials in ESP32 Firmware Flashing",
                "new /web gui: show hint on ESP32 Firmware Flashing page if browser does not support WebSerial",
                "new /web gui: allow multiselection in file browser for file deletion",
                "new /web gui: limit audio encoder to 99 files (as Toniebox only supports 99 chapters)",
                "new /web gui: fixed image fetch loop when playing a tonie",
                "new /web gui: fixed poor audio quality in some case when using audio encoder",
                "new /web gui: migrated gui from create-react-app to vite",
                "new /web gui: fixed some bugs and minor refactoring",
            ],
            commits: [
                "https://github.com/toniebox-reverse-engineering/teddycloud/compare/tc_v0.5.2...tc_v0.6.0",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/compare/tcw_v0.5.2...tcw_v0.6.0",
            ],
            discussionLink: "https://forum.revvox.de/t/release-notes-0-6-0/468",
            githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.6.0",
        },
        {
            version: "0.5.2",
            changes: [
                "Stabilization backend",
                "Several fixes and changes regards backend crashes and emptied config files when changing any tonie setting",
                "Fix for random directories in library (and everywhere)",
                "Fixed bug storing last played tonie per box",
                "Fixed bug clearing text settings (like paths or flex tonie)",
                "API for searching models is now case insensitive",
                "Save IP of Toniebox as prepartion for linking CFW Tonieboxes",
                "Introduced Settings level - 1: Basic, 2: Detail, 3: Expert (1 Default - if you are missing settings, increase level!)",
                "new /web gui: enhanced Tonies Card, added editable content source",
                "new /web gui: enhanced Toniebox Card, improved UX",
                "new /web gui: Dark theme (Last used Theme stored in localStorage in Browser)",
                "new /web gui: Show All (Hide Pagination on Tonies List, stored in localStorage in Browser)",
                "new /web gui: Support of overlayed content folder. More details can be found here: https://forum.revvox.de/t/teddycloud-supporting-multiple-tonieboxes/451/1",
                "new /web gui: Text inputs in Settings must be saved explicitly. (only Textinputs, other types are still autosaved.) Expect changes in future releases.",
                "new /web gui: fixed various state bugs",
                "new /web gui: show last online date of offline tonieboxes",
                "new /web gui: Messages on successful setting updates",
                "new /web gui: some refactoring",
            ],
            commits: [
                "https://github.com/toniebox-reverse-engineering/teddycloud/compare/tc_v0.5.1...tc_v0.5.2",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/compare/tcw_v0.5.1...tcw_v0.5.2",
            ],
            discussionLink: "https://forum.revvox.de/t/release-notes-0-5-2/450",
            githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.5.2",
        },
        {
            version: "0.5.1",
            changes: [
                "Stabilization Backend (added locks to prevent crashes, removed memory leaks)",
                "Creating dirs when uploading certificates to a not yet existing path",
                "Moving Tafs from Content to Library on click (not yet available in (new?) frontend)",
                "new /web gui: Pagination + Filtering on Tonies List ( Paging Tonies · Issue #24 · toniebox-reverse-engineering/teddycloud_web · GitHub 2 )",
                "new /web gui: Extend Box Management: Certificate upload now box specific possible, overworked certificate upload ( Certificate upload box related · Issue #26 · toniebox-reverse-engineering/teddycloud_web · GitHub )",
                "new /web gui: Show last played Tonie on Box Management, link to prefiltered Tonieslist, added marking of the Last played Tonies on each box in Tonieslist ( Make use of internal.last_ruid · Issue #30 · toniebox-reverse-engineering/teddycloud_web · GitHub 1 )",
                "new /web gui: adapted cursor on cards to default as cards not really clickable ( TonieCard Cursor · Issue #25 · toniebox-reverse-engineering/teddycloud_web · GitHub )",
                "new /web gui: fixed navigation item marking",
                "new /web gui: updated box models, added pseudomodels of the official tonies covers (sleepy bear, sheep and rabbit). They are now placed in a json in the config folder. Custom tonieboxes are now also possible. Add your customised one in tonieboxes.custom.json and choose it in the box mgmt.",
                "new /web gui: added community section (WIP) ( Add Changelog and contribution page · Issue #27 · toniebox-reverse-engineering/teddycloud_web · GitHub 1 )",
                "new /web gui: fixed warnings",
            ],
            commits: [
                "https://github.com/toniebox-reverse-engineering/teddycloud/compare/tc_v0.5.0...tc_v0.5.1",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/compare/tcw_v0.5.0...tcw_v0.5.1",
            ],
            discussionLink: "https://forum.revvox.de/t/release-notes-0-5-1/447",
            githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.5.1",
        },
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
                "fixed several bugs",
            ],
            commits: [
                "https://github.com/toniebox-reverse-engineering/teddycloud/pull/154",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/8",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/9",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/19",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/21",
                "https://github.com/toniebox-reverse-engineering/teddycloud_web/pull/22",
            ],
            discussionLink: "https://forum.revvox.de/t/release-notes-0-5-0/444",
            githubReleaseLink: "https://github.com/toniebox-reverse-engineering/teddycloud/releases/tag/tc_v0.5.0",
        },
        {
            version: "0.4.5 and older",
            changes: ["A lot more. See Github for details!"],
            commits: [],
        },
    ];

    const renderChangeEntry = (entry: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = entry.split(urlRegex);

        return parts.map((part, index) =>
            urlRegex.test(part) ? (
                <Link key={index} to={part} target="_blank" rel="noopener noreferrer">
                    {part}
                </Link>
            ) : (
                part
            )
        );
    };

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <CommunitySubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("community.navigationTitle") },
                        { title: t("community.changelog.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("community.changelog.title")}</h1>
                    <Paragraph>
                        <List
                            dataSource={changelogData}
                            renderItem={(item) => (
                                <>
                                    <h2>
                                        {t("community.changelog.version")} {item.version}
                                    </h2>
                                    <Paragraph>
                                        <h3>{t("community.changelog.changes")}</h3>
                                        <ul>
                                            {item.changes.map((change, index) => (
                                                <li key={index}>{renderChangeEntry(change)}</li>
                                            ))}
                                        </ul>
                                    </Paragraph>
                                    {item.commits && item.commits.length > 0 && (
                                        <>
                                            <Text strong>{t("community.changelog.allCommits")}:</Text>
                                            <ul>
                                                {item.commits.map((commit, index) => (
                                                    <li key={index}>
                                                        <Link to={commit} target="_blank">
                                                            {commit}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    {item.discussionLink && (
                                        <>
                                            <Text strong>{t("community.changelog.discussion")}:</Text>
                                            <ul>
                                                <li>
                                                    <Link to={item.discussionLink} target="_blank">
                                                        {item.discussionLink}
                                                    </Link>
                                                </li>
                                            </ul>
                                        </>
                                    )}
                                    {item.githubReleaseLink && (
                                        <>
                                            <Text strong>{t("community.changelog.githubRelease")}:</Text>
                                            <ul>
                                                <li>
                                                    <Link to={item.githubReleaseLink} target="_blank">
                                                        {item.githubReleaseLink}
                                                    </Link>
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
