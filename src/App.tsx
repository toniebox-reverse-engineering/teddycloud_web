import "./App.css";
import { Layout } from "antd";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { UiTest } from "./components/UiTest";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { CertificatesPage } from "./pages/settings/certificates/CertificatesPage";
import { HomePage } from "./pages/home/HomePage";
import { StatsPage } from "./pages/home/StatsPage";
import { StyledHeader } from "./components/header/StyledHeader";
import { ToniesPage } from "./pages/tonies/ToniesPage";

function App() {
  return (
    <div className="App">
      <Layout>
        <Router basename={process.env.REACT_APP_TEDDYCLOUD_WEB_BASE}>
          <StyledHeader />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home/stats" element={<StatsPage />} />
              <Route path="/tonies" element={<ToniesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/settings/certificates"
                element={<CertificatesPage />}
              />
              <Route path="/uitest" element={<UiTest />} />
            </Routes>
          </Layout>
        </Router>
      </Layout>
    </div>
  );
}

export default App;
