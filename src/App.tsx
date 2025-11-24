import { ConfigProvider, Layout, theme } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BulbOutlined, CodeOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";

import { TeddyCloudProvider } from "./contexts/TeddyCloudContext";
import { AudioProvider } from "./contexts/AudioContext";
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
import { GUISettingsPage } from "./pages/settings/GUISettingsPage";

import { TonieboxesPage } from "./pages/tonieboxes/TonieboxesPage";
import { BoxSetupPage } from "./pages/tonieboxes/boxsetup/BoxSetupPage";
import { BoxVersionInformationPage } from "./pages/tonieboxes/boxsetup/BoxVersionInformationPage";
import { IdentifyBoxVersionPage } from "./pages/tonieboxes/boxsetup/IdentifyBoxVersionPage";
import { OpenBoxGuidePage } from "./pages/tonieboxes/boxsetup/OpenBoxGuidePage";
import { CC3200BoxFlashingGuidePage } from "./pages/tonieboxes/boxsetup/cc3200/CC3200BoxFlashingGuidePage";
import { CC3235BoxFlashingGuidePage } from "./pages/tonieboxes/boxsetup/cc3235/CC3235BoxFlashingGuidePage";
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
import MatrixRain from "./styles/matrix/matrixRain";
import "./styles/matrix/matrix.css";

import { detectColorScheme } from "./utils/browser/browserUtils";

function App() {
    const { defaultAlgorithm, darkAlgorithm } = theme;

    const [themeMode, setThemeMode] = useState<string>(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme || "auto";
    });

    const resolveThemeMode = (mode: string): "light" | "dark" | "matrix" => {
        if (mode === "auto") {
            const system = detectColorScheme();
            if (system === "dark") return "dark";
            return "light";
        }
        if (mode === "dark" || mode === "matrix") return mode;
        return "light";
    };

    const effectiveThemeMode = useMemo(() => resolveThemeMode(themeMode), [themeMode]);

    const updateMetaThemeColor = (mode: "light" | "dark" | "matrix") => {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        const color = mode === "dark" || mode === "matrix" ? "#000000" : "#f5f5f5";

        if (themeColorMeta) {
            themeColorMeta.setAttribute("content", color);
        }
        document.body.style.backgroundColor = color;
    };

    const toggleTheme = () => {
        setThemeMode((prevMode) => {
            if (prevMode === "dark") return "light";
            if (prevMode === "light") return "auto";
            if (prevMode === "auto") return "matrix";
            return "dark";
        });
    };

    // only for avoiding Theme-Switch-Motion
    useEffect(() => {
        document.body.classList.add("theme-switching");
        const timeout = window.setTimeout(() => {
            document.body.classList.remove("theme-switching");
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [themeMode]);

    // Meta-Theme-Color and Matrix-class
    useEffect(() => {
        localStorage.setItem("theme", themeMode);
        updateMetaThemeColor(effectiveThemeMode);

        if (effectiveThemeMode === "matrix") {
            document.body.classList.add("matrix-theme");
        } else {
            document.body.classList.remove("matrix-theme");
        }
    }, [themeMode, effectiveThemeMode]);

    const themeSwitchIcon = useMemo(() => {
        if (themeMode === "dark") return <MoonOutlined onClick={toggleTheme} />;
        if (themeMode === "light") return <SunOutlined onClick={toggleTheme} />;
        if (themeMode === "matrix") return <CodeOutlined style={{ marginTop: "-2px" }} onClick={toggleTheme} />;
        return <BulbOutlined onClick={toggleTheme} />;
    }, [themeMode]);

    const algorithm =
        effectiveThemeMode === "dark"
            ? darkAlgorithm
            : effectiveThemeMode === "matrix"
            ? matrixAlgorithm
            : defaultAlgorithm;

    return (
        <ConfigProvider
            theme={{
                algorithm,
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
            {effectiveThemeMode === "matrix" && <MatrixRain />}
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
