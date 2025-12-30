import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUI } from "./ui/UiProvider";

const MoodPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { showToast, showConfirm } = useUI();

  // Form States
  const [moodScore, setMoodScore] = useState(3);
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState("Private"); // New State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logic State
  const [isEditingToday, setIsEditingToday] = useState(false); // Tracks if we are editing today's entry

  // Data States
  const [history, setHistory] = useState([]);

  // Modal State
  const [showWisdom, setShowWisdom] = useState(false);
  const [wisdomMessage, setWisdomMessage] = useState(null);

  // --- CONFIGURATION ---
  const moodOptions = [
    { score: 1, emoji: "😖", label: "Terrible", activeColor: "bg-gray-200 text-gray-700 ring-gray-400", bgGradient: "from-gray-300 via-gray-100 to-gray-300" },
    { score: 2, emoji: "😔", label: "Bad", activeColor: "bg-blue-200 text-blue-700 ring-blue-400", bgGradient: "from-blue-200 via-indigo-200 to-gray-200" },
    { score: 3, emoji: "😐", label: "Okay", activeColor: "bg-indigo-200 text-indigo-700 ring-indigo-400", bgGradient: "from-indigo-100 via-purple-100 to-pink-100" },
    { score: 4, emoji: "🙂", label: "Good", activeColor: "bg-yellow-200 text-yellow-700 ring-yellow-400", bgGradient: "from-yellow-100 via-orange-100 to-amber-100" },
    { score: 5, emoji: "🤩", label: "Amazing", activeColor: "bg-pink-200 text-pink-700 ring-pink-400", bgGradient: "from-pink-200 via-rose-100 to-yellow-100" },
  ];

  const tagsList = ["Work", "Family", "Relationship", "Sleep", "Health", "Finance", "Social", "Weather", "Hobbies", "Self-Care"];
  const visibilityOptions = ["Private", "Circles", "Public"];

  const currentMood = moodOptions.find((m) => m.score === moodScore) || moodOptions[2];

  // Smart Wisdom Data
  const wisdomQuotes = {
    1: { title: "It's okay not to be okay.", quote: "This heavy feeling is temporary. Be gentle with yourself today.", action: "Try a 2-minute breathing exercise." },
    2: { title: "Tough day?", quote: "Every storm runs out of rain eventually.", action: "Maybe take a short walk or drink some water." },
    3: { title: "Staying balanced.", quote: "Peace is not the absence of trouble, but the presence of calm.", action: "A perfect time for a quick reflection journal." },
    4: { title: "Looking good!", quote: "Positive energy is contagious.", action: "Share this good vibe with a friend." },
    5: { title: "That's the spirit!", quote: "Savor this feeling. You deserve it.", action: "Write down exactly why you feel this way to remember it." },
  };

  // --- HELPER: CHECK IF DATE IS TODAY ---
  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // --- FETCH HISTORY & CHECK TODAY ---
  const fetchHistory = useCallback(async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/mood/${userId}`);
      setHistory(res.data);

      // Check if the most recent entry is from TODAY
      if (res.data.length > 0 && isToday(res.data[0].createdAt)) {
        const todayEntry = res.data[0];
        // Pre-fill form
        setMoodScore(todayEntry.score);
        setSelectedTags(todayEntry.emotions);
        setNote(todayEntry.note || "");
        setVisibility(todayEntry.visibility || "Private");
        setIsEditingToday(true);
      } else {
        setIsEditingToday(false);
      }

    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }, []);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchHistory(parsedUser._id || parsedUser.id);
    } else {
      navigate("/auth");
    }
  }, [navigate, fetchHistory]);

  // --- HANDLERS ---
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      await axios.post("http://localhost:5000/api/mood/add", {
        userId: user._id || user.id,
        score: moodScore,
        emotions: selectedTags,
        note: note,
        color: currentMood.bgGradient,
        visibility: visibility, // Send Visibility
      });

      await fetchHistory(user._id || user.id);

      // Only show wisdom if creating new, or if updating to a different mood score? 
      // Let's show it always for positive reinforcement.
      setWisdomMessage(wisdomQuotes[moodScore]);
      setShowWisdom(true);

    } catch (err) {
      console.error("Error saving mood:", err);
      showToast("Something went wrong.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (moodId) => {
    const ok = await showConfirm("Are you sure you want to delete this entry?");
    if (!ok) return;
    try {
      await axios.delete(`http://localhost:5000/api/mood/delete/${moodId}`);
      // If we deleted today's entry, reset form
      const deletedWasToday = history.find(h => h._id === moodId && isToday(h.createdAt));
      if (deletedWasToday) {
        setIsEditingToday(false);
        setMoodScore(3);
        setNote("");
        setSelectedTags([]);
        setVisibility("Private");
      }
      fetchHistory(user._id || user.id);
    } catch (err) {
      console.error("Error deleting mood", err);
    }
  };

  // --- HEATMAP HELPERS ---
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const getMoodColorForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = history.find(h => h.createdAt.startsWith(dateStr));
    if (entry) {
      const m = moodOptions.find(opt => opt.score === entry.score);
      return m.activeColor.split(' ')[0];
    }
    return "bg-white/30";
  };

  return (
    <div className={`min-h-screen w-screen transition-all duration-1000 ease-in-out bg-gradient-to-br ${currentMood.bgGradient} flex flex-col items-center py-8 px-4 font-sans overflow-y-auto`}>

      {/* Back Button */}
      <div className="w-full max-w-2xl mb-4">
        <button
          onClick={() => navigate("/home")}
          className="text-gray-700 font-semibold text-lg hover:text-indigo-600 transition-colors flex items-center gap-2"
        >
          <span>←</span> Back to Home
        </button>
      </div>

      {/* Main Glass Card */}
      <div className="bg-white/60 backdrop-blur-xl w-full max-w-2xl rounded-[2rem] shadow-2xl p-6 md:p-10 border border-white/50 transition-all duration-500 mb-10 relative">

        {/* HEATMAP */}
        <div className="absolute top-6 right-6 hidden sm:flex gap-1">
          {getLast7Days().map((date, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                title={date.toDateString()}
                className={`w-3 h-3 rounded-full ${getMoodColorForDate(date)}`}
              />
            </div>
          ))}
        </div>

        {/* HEADER: Dynamic Text based on whether we are Editing or New */}
        <div className="text-center mb-8 mt-2">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditingToday ? "Update your check-in" : "How are you feeling?"}
          </h1>
          {isEditingToday && (
            <p className="text-sm text-indigo-600 font-medium bg-indigo-50 inline-block px-3 py-1 rounded-full">
              You've already checked in today. Changes here will update your entry.
            </p>
          )}
        </div>

        {/* 1. MOOD SELECTOR */}
        <div className="flex justify-between items-center mb-6 px-2">
          {moodOptions.map((option) => (
            <div key={option.score} className="flex flex-col items-center gap-2">
              <button
                onClick={() => setMoodScore(option.score)}
                className={`
                  flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl text-3xl md:text-4xl
                  transition-all duration-300 transform hover:scale-110 
                  ${moodScore === option.score
                    ? `${option.activeColor} shadow-lg ring-4 ring-offset-2 ring-offset-white/50 scale-110`
                    : "bg-white/40 text-gray-400 hover:bg-white/80 grayscale hover:grayscale-0"
                  }
                `}
              >
                {option.emoji}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center font-bold text-xl text-gray-800 mb-6 uppercase tracking-widest opacity-80">
          {currentMood.label}
        </div>

        {/* 2. TAGS */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">What's affecting you?</p>
          <div className="flex flex-wrap gap-2">
            {tagsList.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                  ${selectedTags.includes(tag)
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white"
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 3. NOTE */}
        <div className="mb-6">
          <textarea
            placeholder="Add a note..."
            className="w-full bg-white/50 border border-gray-200 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all resize-none h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>

        {/* 4. VISIBILITY SETTINGS */}
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Visibility</p>
          <div className="flex bg-white/50 rounded-xl p-1 border border-gray-200">
            {visibilityOptions.map((option) => (
              <button
                key={option}
                onClick={() => setVisibility(option)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${visibility === option
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* 5. SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEditingToday ? "Update Entry" : "Log Mood"}
        </button>

        {/* 6. HISTORY WITH VISIBILITY INDICATOR */}
        {history.length > 0 && (
          <div className="mt-12 border-t border-gray-200/50 pt-6">
            <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-4">Past Entries</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {history.map((entry) => {
                const moodData = moodOptions.find(m => m.score === entry.score);
                return (
                  <div key={entry._id} className="group bg-white/40 p-4 rounded-xl flex items-center justify-between border border-white/50 hover:bg-white/60 transition-colors relative">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{moodData?.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {moodData?.label}
                          {entry.emotions.length > 0 && <span className="text-gray-500 font-normal"> • {entry.emotions.join(", ")}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          {/* Visibility Badge */}
                          <span className="text-[10px] uppercase bg-gray-200/50 text-gray-500 px-2 rounded-md">
                            {entry.visibility || "Private"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="text-red-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* SMART WISDOM MODAL (Keep Existing) */}
      {/* --- 7. SMART WISDOM MODAL (UPDATED) --- */}
      {showWisdom && wisdomMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-bounce-in relative border border-white/50">

            <h2 className="text-2xl font-bold text-indigo-900 mb-2">{wisdomMessage.title}</h2>
            <p className="text-gray-600 italic text-lg mb-6">"{wisdomMessage.quote}"</p>

            <div className="bg-indigo-50 p-4 rounded-xl mb-8">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Suggested Action</span>
              <p className="text-indigo-800 font-medium">{wisdomMessage.action}</p>
            </div>

            {/* BUTTONS GROUP */}
            <div className="flex flex-col gap-3">
              {/* Primary: Journal */}
              <button
                onClick={() => navigate("/journal")}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30"
              >
                <span>✍️</span> Want to write about it?
              </button>

              {/* Secondary: Close */}
              <button
                onClick={() => setShowWisdom(false)}
                className="w-full bg-white border border-gray-200 text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                No thanks, I'm good
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MoodPage;