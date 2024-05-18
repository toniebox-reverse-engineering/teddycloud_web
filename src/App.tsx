import "./App.css";
import { Layout } from "antd";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AudioProvider } from "./components/audio/AudioContext";

import { UiTest } from "./components/UiTest";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { RtnlPage } from "./pages/settings/RtnlPage";
import { CertificatesPage } from "./pages/settings/certificates/CertificatesPage";
import { HomePage } from "./pages/home/HomePage";
import { StatsPage } from "./pages/home/StatsPage";
import { StyledHeader } from "./components/header/StyledHeader";
import { StyledFooter } from "./components/footer/StyledFooter";
import { ToniesPage } from "./pages/tonies/ToniesPage";
import { SystemSoundsPage } from "./pages/tonies/SystemSoundsPage";
import { ContentPage } from "./pages/tonies/ContentPage";
import { LibraryPage } from "./pages/tonies/LibraryPage";
import { EncoderPage } from "./pages/tonies/EncoderPage";
import { TonieAudioPlaylistsPage } from "./pages/tonies/TonieAudioPlaylistsPage";
import { TonieboxesPage } from "./pages/tonieboxes/TonieboxesPage";
import { CommunityPage } from "./pages/community/CommunityPage";
import { ContributionPage } from "./pages/community/ContributionPage";
import { ContributionToniesJsonPage } from "./pages/community/ContributionToniesJsonPage";
import { ContributorsPage } from "./pages/community/ContributorsPage";
import { ChangelogPage } from "./pages/community/ChangelogPage";
import { useState, useEffect } from "react";
import { ConfigProvider, theme } from "antd";
import { SunOutlined, MoonOutlined, BulbOutlined } from "@ant-design/icons";
import { ESP32BoxFlashing } from "./pages/tonieboxes/ESP32BoxFlashing";

function detectColorScheme() {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme === "auto") {
        return prefersDarkMode ? "dark" : "light";
    } else {
        return storedTheme;
    }
}

function App() {
    const { defaultAlgorithm, darkAlgorithm } = theme;

    // State for managing theme mode
    const [themeMode, setThemeMode] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme || "auto"; // Default to 'auto' if no theme is saved
    });

    const [isDarkMode, setIsDarkMode] = useState(detectColorScheme() === "dark");

    // Function to toggle between dark, light, and auto modes
    const toggleTheme = () => {
        setThemeMode((prevMode) => {
            if (prevMode === "dark") return "light";
            else if (prevMode === "light") return "auto";
            else return "dark";
        });
    };

    // Effect to update local storage when theme mode changes
    useEffect(() => {
        localStorage.setItem("theme", themeMode);
        setIsDarkMode(detectColorScheme() === "dark");
    }, [themeMode]);

    let themeSwitchIcon;
    if (themeMode === "dark") themeSwitchIcon = <MoonOutlined onClick={toggleTheme} />;
    else if (themeMode === "light") themeSwitchIcon = <SunOutlined onClick={toggleTheme} />;
    else themeSwitchIcon = <BulbOutlined onClick={toggleTheme} />;

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
            }}
        >
            <div className="App">
                <Layout style={{ minHeight: "100vh" }}>
                    <Router basename={process.env.REACT_APP_TEDDYCLOUD_WEB_BASE}>
                        <AudioProvider>
                            <StyledHeader themeSwitch={themeSwitchIcon} />
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/home/stats" element={<StatsPage />} />
                                    <Route path="/tonies" element={<ToniesPage />} />
                                    <Route path="/tonies/system-sounds" element={<SystemSoundsPage />} />
                                    <Route path="/tonies/content" element={<ContentPage />} />
                                    <Route path="/tonies/library" element={<LibraryPage />} />
                                    <Route path="/tonies/encoder" element={<EncoderPage />} />
                                    <Route path="/tonies/tap" element={<TonieAudioPlaylistsPage />} />
                                    <Route path="/tonieboxes" element={<TonieboxesPage />} />
                                    <Route path="/tonieboxes/esp32boxflashing" element={<ESP32BoxFlashing />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    <Route path="/settings/certificates" element={<CertificatesPage />} />
                                    <Route path="/settings/rtnl" element={<RtnlPage />} />
                                    <Route path="/community" element={<CommunityPage />} />
                                    <Route path="/community/contribution" element={<ContributionPage />} />
                                    <Route
                                        path="/community/contribution/tonies-json"
                                        element={<ContributionToniesJsonPage />}
                                    />
                                    <Route path="/community/contributors" element={<ContributorsPage />} />
                                    <Route path="/community/changelog" element={<ChangelogPage />} />
                                    <Route path="/uitest" element={<UiTest />} />
                                </Routes>
                            </Layout>
                            <StyledFooter />
                        </AudioProvider>
                    </Router>
                </Layout>
            </div>
        </ConfigProvider>
    );
}

export default App;
