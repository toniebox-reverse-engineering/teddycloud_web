import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider, Layout, theme } from "antd";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BulbOutlined, CodeOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";

import { TeddyCloudProvider } from "./TeddyCloudContext";
import { AudioProvider } from "./components/audio/AudioContext";
import { StyledFooter } from "./components/common/footer/StyledFooter";
import { StyledHeader } from "./components/common/header/StyledHeader";
import { Error404Page } from "./pages/Error404Page";
import { ChangelogPage } from "./pages/community/ChangelogPage";
import { CommunityPage } from "./pages/community/CommunityPage";
import { ContributionPage } from "./pages/community/ContributionPage";
import { ContributionToniesJsonPage } from "./pages/community/ContributionToniesJsonPage";
import { ContributorsPage } from "./pages/community/ContributorsPage";
import { FAQPage } from "./pages/community/FAQPage";
import { HowToGetSupportPage } from "./pages/community/HowToGetSupportPage";
import { PluginListPage } from "./pages/community/PluginListPage";
import { PluginPage } from "./pages/community/PluginPage";
import { TranslationsPage } from "./pages/community/TranslationsPage";
import { FeaturesPage } from "./pages/home/FeaturesPage";
import { HomePage } from "./pages/home/HomePage";
import { StatsPage } from "./pages/home/StatsPage";
import { TonieMeetingPage } from "./pages/home/TonieMeetingPage";
import { NotificationsListPage } from "./pages/settings/NotificationsListPage";
import { RtnlPage } from "./pages/settings/RtnlPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { CertificatesPage } from "./pages/settings/certificates/CertificatesPage";
import { TonieboxesPage } from "./pages/tonieboxes/TonieboxesPage";
import { BoxSetupPage } from "./pages/tonieboxes/boxsetup/BoxSetupPage";
import { BoxVersionInformationPage } from "./pages/tonieboxes/boxsetup/BoxVersionInformationPage";
import { IdentifyBoxVersionPage } from "./pages/tonieboxes/boxsetup/IdentifyBoxVersionPage";
import { OpenBoxGuidePage } from "./pages/tonieboxes/boxsetup/OpenBoxGuidePage";
import { CC3200BoxFlashingGuidePage } from "./pages/tonieboxes/boxsetup/cc3200/CC3200BoxFlashingGuidePage";
import { ESP32BoxFlashingPage } from "./pages/tonieboxes/boxsetup/esp32/ESP32BoxFlashingPage";
import { ESP32LegacyFlashingGuidePage } from "./pages/tonieboxes/boxsetup/esp32/ESP32LegacyFlashingGuidePage";
import { ContentPage } from "./pages/tonies/ContentPage";
import { EncoderPage } from "./pages/tonies/EncoderPage";
import { LibraryPage } from "./pages/tonies/LibraryPage";
import { SystemSoundsPage } from "./pages/tonies/SystemSoundsPage";
import { TeddyStudioPage } from "./pages/tonies/TeddyStudioPage";
import { TonieAudioPlaylistsPage } from "./pages/tonies/TonieAudioPlaylistsPage";
import { TeddyAudioPlayerPage } from "./pages/tonies/TeddyAudioPlayerPage";
import { ToniesPage } from "./pages/tonies/ToniesPage";
import { matrixAlgorithm } from "./styles/matrix/matrixAlgorithm";
import { detectColorScheme } from "./utils/browser/browserUtils";
import MatrixRain from "./styles/matrix/matrixRain";
import "./styles/matrix/matrix.css";
import { GUISettingsPage } from "./pages/settings/GUISettingsPage";
import { CC3235BoxFlashingGuidePage } from "./pages/tonieboxes/boxsetup/cc3235/CC3235BoxFlashingGuidePage";

function App() {
    const { defaultAlgorithm, darkAlgorithm } = theme;

    const updateMetaThemeColor = (themeColor: string) => {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute("content", themeColor);
        }
        document.body.style.backgroundColor = themeColor;
    };

    // State for managing theme mode
    const [themeMode, setThemeMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme || "auto"; // Default to 'auto' if no theme is saved
    });

    // Function to toggle between dark, light, and auto modes
    const toggleTheme = () => {
        setThemeMode((prevMode) => {
            if (prevMode === "dark") return "light";
            else if (prevMode === "light") return "auto";
            else if (prevMode === "auto") return "matrix";
            else return "dark";
        });
    };

    // Effect to update local storage when theme mode changes
    useEffect(() => {
        localStorage.setItem("theme", themeMode);
        if (detectColorScheme() === "dark") {
            updateMetaThemeColor("#000000");
        } else if (detectColorScheme() === "matrix") {
            updateMetaThemeColor("#000000");
        } else {
            updateMetaThemeColor("#f5f5f5");
        }
        if (themeMode === "matrix") {
            document.body.classList.add("matrix-theme");
        } else {
            document.body.classList.remove("matrix-theme");
        }
    }, [themeMode]);

    let themeSwitchIcon;
    if (themeMode === "dark") themeSwitchIcon = <MoonOutlined onClick={toggleTheme} />;
    else if (themeMode === "light") themeSwitchIcon = <SunOutlined onClick={toggleTheme} />;
    else if (themeMode === "matrix")
        themeSwitchIcon = <CodeOutlined style={{ marginTop: "-2px" }} onClick={toggleTheme} />;
    else themeSwitchIcon = <BulbOutlined onClick={toggleTheme} />;

    return (
        <ConfigProvider
            theme={{
                algorithm:
                    themeMode === "dark" ? darkAlgorithm : themeMode === "matrix" ? matrixAlgorithm : defaultAlgorithm,
                components: {
                    Slider: {
                        dotSize: 3,
                        handleSize: 6,
                        handleSizeHover: 8,
                        railSize: 4,
                    },
                    Popover: {
                        titleMinWidth: 0,
                    },
                },
            }}
        >
            {themeMode === "matrix" && <MatrixRain />}
            <TeddyCloudProvider>
                <div className="App">
                    <Layout style={{ minHeight: "100vh" }}>
                        <Router basename={import.meta.env.VITE_APP_TEDDYCLOUD_WEB_BASE}>
                            <StyledHeader themeSwitch={themeSwitchIcon} themeMode={themeMode} />
                            <AudioProvider>
                                <Layout>
                                    <Routes>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/home/stats" element={<StatsPage />} />
                                        <Route path="/home/features" element={<FeaturesPage />} />
                                        <Route path="/home/toniemeeting" element={<TonieMeetingPage />} />
                                        <Route path="/home/plugin/:pluginId" element={<PluginPage />} />
                                        <Route path="/tonies" element={<ToniesPage />} />
                                        <Route
                                            path="/tonies/audioplayer"
                                            element={<TeddyAudioPlayerPage standalone={false} />}
                                        />
                                        <Route path="/audioplayer" element={<TeddyAudioPlayerPage standalone />} />
                                        <Route path="/tonies/system-sounds" element={<SystemSoundsPage />} />
                                        <Route path="/tonies/content" element={<ContentPage />} />
                                        <Route path="/tonies/library" element={<LibraryPage />} />
                                        <Route path="/tonies/encoder" element={<EncoderPage />} />
                                        <Route path="/tonies/tap" element={<TonieAudioPlaylistsPage />} />
                                        <Route path="/tonies/teddystudio" element={<TeddyStudioPage />} />
                                        <Route path="/tonies/plugin/:pluginId" element={<PluginPage />} />
                                        <Route path="/tonieboxes" element={<TonieboxesPage />} />
                                        <Route path="/tonieboxes/boxsetup" element={<BoxSetupPage />} />
                                        <Route
                                            path="/tonieboxes/boxsetup/identifyboxversion"
                                            element={<IdentifyBoxVersionPage />}
                                        />
                                        <Route
                                            path="/tonieboxes/boxsetup/openboxguide"
                                            element={<OpenBoxGuidePage />}
                                        />
                                        <Route
                                            path="/tonieboxes/boxsetup/boxversioninfo"
                                            element={<BoxVersionInformationPage />}
                                        />
                                        <Route
                                            path="/tonieboxes/boxsetup/esp32/flashing"
                                            element={<ESP32BoxFlashingPage />}
                                        />
                                        <Route
                                            path="/tonieboxes/boxsetup/esp32/legacy"
                                            element={<ESP32LegacyFlashingGuidePage />}
                                        />
                                        <Route
                                            path="/tonieboxes/boxsetup/cc3200/flashing"
                                            element={<CC3200BoxFlashingGuidePage />}
                                        />
                                        <Route
                                            path="/tonieboxes/boxsetup/cc3235/flashing"
                                            element={<CC3235BoxFlashingGuidePage />}
                                        />
                                        <Route path="/tonieboxes/plugin/:pluginId" element={<PluginPage />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                        <Route path="/settings/guisettings" element={<GUISettingsPage />} />
                                        <Route path="/settings/certificates" element={<CertificatesPage />} />
                                        <Route path="/settings/rtnl" element={<RtnlPage />} />
                                        <Route path="/settings/notifications" element={<NotificationsListPage />} />
                                        <Route path="/settings/plugin/:pluginId" element={<PluginPage />} />
                                        <Route path="/community" element={<CommunityPage />} />
                                        <Route path="/community/tcplugins" element={<PluginListPage />} />
                                        <Route path="/community/tcplugins/:pluginId" element={<PluginPage />} />
                                        <Route path="/community/plugin/:pluginId" element={<PluginPage />} />
                                        <Route path="/community/faq" element={<FAQPage />} />
                                        <Route
                                            path="/community/supportrequestguide"
                                            element={<HowToGetSupportPage />}
                                        />
                                        <Route path="/community/contribution" element={<ContributionPage />} />
                                        <Route
                                            path="/community/contribution/tonies-json"
                                            element={<ContributionToniesJsonPage />}
                                        />
                                        <Route
                                            path="/community/contribution/translations"
                                            element={<TranslationsPage />}
                                        />
                                        <Route path="/community/contributors" element={<ContributorsPage />} />
                                        <Route path="/community/changelog" element={<ChangelogPage />} />
                                        <Route path="/*" element={<Error404Page />} />
                                    </Routes>
                                </Layout>
                                <StyledFooter />
                            </AudioProvider>
                        </Router>
                    </Layout>
                </div>
            </TeddyCloudProvider>
        </ConfigProvider>
    );
}

export default App;
