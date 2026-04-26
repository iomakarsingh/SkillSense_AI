import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { useTheme } from './hooks/useTheme';
import LandingPage      from './pages/LandingPage';
import UploadPage       from './pages/UploadPage';
import ProcessingPage   from './pages/ProcessingPage';
import AssessmentPage   from './pages/AssessmentPage';
import ResultsDashboard from './pages/ResultsDashboard';

function AppShell() {
  useTheme(); // initializes dark/light from localStorage / system preference

  return (
    <Routes>
      <Route path="/"           element={<LandingPage />} />
      <Route path="/upload"     element={<UploadPage />} />
      <Route path="/processing" element={<ProcessingPage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/results"    element={<ResultsDashboard />} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </SessionProvider>
  );
}
