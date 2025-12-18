// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import HomePage from "./HomePage";
import MoodPage from "./MoodPage";
import JournalPage from "./JournalPage";
import ProfilePage from "./ProfilePage";
import CirclesPage from "./CirclesPage";
import SingleCirclePage from "./SingleCirclePage";// 1. Import the new component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        {/* 2. Add the new route */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/circles" element={<CirclesPage />} />
        <Route path="/circles/:id" element={<SingleCirclePage />} />
      </Routes>
    </Router>
  );
}

export default App;