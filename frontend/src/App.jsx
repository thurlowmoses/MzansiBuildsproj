import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import AuthPage from "./pages/AuthPage";
import CelebrationWall from "./pages/CelebrationWall";
import DiscoveryPage from "./pages/DiscoveryPage";
import FeedPage from "./pages/FeedPage";
import HelpPage from "./pages/HelpPage";
import LandingPage from "./pages/LandingPage";
import MessagesPage from "./pages/MessagesPage";
import NewProjectPage from "./pages/NewProjectPage";
import EditProjectPage from "./pages/EditProjectPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfileDashboard from "./pages/ProfileDashboard";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected app routes live behind auth. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/dashboard" element={<ProfileDashboard />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/projects/new" element={<NewProjectPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/projects/:id/edit" element={<EditProjectPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<PublicProfilePage />} />
              <Route path="/celebration" element={<CelebrationWall />} />
              <Route path="/celebration-wall" element={<CelebrationWall />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
