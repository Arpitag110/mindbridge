import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import HomePage from "./HomePage";
import MoodPage from "./MoodPage";
import JournalPage from "./JournalPage";
import ProfilePage from "./ProfilePage";
import CirclesPage from "./CirclesPage";
import SingleCirclePage from "./SingleCirclePage";
import DashboardPage from "./DashboardPage"; // 1. Import Dashboard
import { SocketProvider } from "./SocketContext"; // 2. Import SocketProvider

function App() {
  return (
    // 3. Wrap everything in SocketProvider
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/mood" element={<MoodPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/circles" element={<CirclesPage />} />
          <Route path="/circles/:id" element={<SingleCirclePage />} />
          
          {/* 4. Add the Dashboard Route */}
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;