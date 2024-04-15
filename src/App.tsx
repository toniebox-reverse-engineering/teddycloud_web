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
import { LoginPage } from "./pages/authentication/LoginPage";
import {AuthProvider } from "./provider/AuthProvider";
import {PrivateRoute} from "./components/route/PrivateRoute";

function App() {
  return (
    <div className="App">
      <Layout>
        <AuthProvider>
        <Router basename={process.env.REACT_APP_TEDDYCLOUD_WEB_BASE}>
          <AudioProvider>
            <StyledHeader />
            <Layout>
              <Routes>
                <Route path="/" element={<PrivateRoute />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/home/stats" element={<StatsPage />} />
                  <Route path="/tonies" element={<ToniesPage />} />
                  <Route path="/tonies/system-sounds" element={<SystemSoundsPage />} />
                  <Route path="/tonies/content" element={<ContentPage />} />
                  <Route path="/tonies/library" element={<LibraryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route
                    path="/settings/certificates"
                    element={<CertificatesPage />}
                  />
                  <Route path="/uitest" element={<UiTest />} />
                </Route>
                <Route path="/login" element={<LoginPage />} />
              </Routes>
            </Layout>
            <StyledFooter />
          </AudioProvider>
        </Router>
        </AuthProvider>
      </Layout>
    </div>
  );
}

export default App;
