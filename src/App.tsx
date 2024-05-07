import "./App.css";
import { Layout } from "antd";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AudioProvider } from './components/audio/AudioContext';

import { UiTest } from "./components/UiTest";
import { SettingsPage } from "./pages/settings/SettingsPage";
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
import { TonieboxesPage } from "./pages/tonieboxes/TonieboxesPage";
import { CommunityPage } from "./pages/community/CommunityPage";
import { ContributionPage } from "./pages/community/ContributionPage";
import { ContributorsPage } from "./pages/community/ContributorsPage";
import { ChangelogPage } from "./pages/community/ChangelogPage";

function App() {
  return (
    <div className="App">
      <Layout>
        <Router basename={process.env.REACT_APP_TEDDYCLOUD_WEB_BASE}>
          <AudioProvider>
            <StyledHeader />
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home/stats" element={<StatsPage />} />
                <Route path="/tonies" element={<ToniesPage />} />
                <Route path="/tonies/system-sounds" element={<SystemSoundsPage />} />
                <Route path="/tonies/content" element={<ContentPage />} />
                <Route path="/tonies/library" element={<LibraryPage />} />
                <Route path="/tonies/encoder" element={<EncoderPage />} />
                <Route path="/tonieboxes" element={<TonieboxesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/certificates" element={<CertificatesPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/community/contribution" element={<ContributionPage />} />
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
  );
}

export default App;
