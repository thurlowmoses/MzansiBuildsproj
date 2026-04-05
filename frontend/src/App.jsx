import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import CelebrationWall from "./pages/CelebrationWall";
import DiscoveryPage from "./pages/DiscoveryPage";
import FeedPage from "./pages/FeedPage";
import LandingPage from "./pages/LandingPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProfileDashboard from "./pages/ProfileDashboard";
import ProfilePage from "./pages/ProfilePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

function App() {
  return (
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
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/celebration" element={<CelebrationWall />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
