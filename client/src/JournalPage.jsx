import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JournalPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Data State
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("Private"); // New State
  const [isSaving, setIsSaving] = useState(false);

  const visibilityOptions = ["Private", "Circles", "Public"];

  // --- 1. LOAD USER & ENTRIES ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchEntries(parsedUser._id || parsedUser.id);
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const fetchEntries = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/journal/${userId}`);
      setEntries(res.data);
    } catch (err) {
      console.error("Error fetching journals:", err);
    }
  };

  // --- 2. HANDLERS ---
  
  const handleSave = async () => {
    if (!content.trim()) return alert("Journal content cannot be empty.");
    setIsSaving(true);

    try {
      await axios.post("http://localhost:5000/api/journal/add", {
        userId: user._id || user.id,
        title: title || "Untitled Entry",
        content: content,
        moodTag: "Neutral",
        visibility: visibility // Send Visibility
      });
      
      await fetchEntries(user._id || user.id);
      handleNewEntry(); 
      alert("Entry saved successfully! 📖");

    } catch (err) {
      console.error("Error saving journal:", err);
      alert("Failed to save entry.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this journal entry?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/journal/delete/${id}`);
      fetchEntries(user._id || user.id);
      if (selectedEntry && selectedEntry._id === id) {
        handleNewEntry();
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setTitle("");
    setContent("");
    setVisibility("Private"); // Reset visibility
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setVisibility(entry.visibility || "Private");
  };

  return (
    // Changed BG to Indigo/Purple Gradient
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 flex font-sans overflow-hidden">
      
      {/* --- SIDEBAR (History) --- */}
      <div className="w-80 h-full bg-white/40 backdrop-blur-xl border-r border-white/50 flex flex-col p-6 hidden md:flex">
        
        {/* Header */}
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                <span>📖</span> My Journal
            </h2>
            <p className="text-indigo-600 text-sm mt-1">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} so far
            </p>
        </div>

        {/* New Entry Button */}
        <button 
            onClick={handleNewEntry}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mb-6"
        >
            <span>+</span> New Entry
        </button>

        {/* List of Entries */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {entries.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 italic">
                    No entries yet. <br/> Start writing today!
                </div>
            ) : (
                entries.map((entry) => (
                    <div 
                        key={entry._id}
                        onClick={() => handleSelectEntry(entry)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border group relative ${
                            selectedEntry && selectedEntry._id === entry._id
                            ? "bg-white shadow-md border-indigo-200 scale-[1.02]"
                            : "bg-white/40 border-transparent hover:bg-white/70 hover:shadow-sm"
                        }`}
                    >
                        <h3 className="font-bold text-gray-800 truncate pr-6">{entry.title}</h3>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">
                                {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                            {/* Visibility Badge (Small) */}
                            <span className="text-[10px] uppercase bg-indigo-100 text-indigo-600 px-1.5 rounded">
                                {entry.visibility || "Private"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed opacity-80">
                            {entry.content}
                        </p>
                    </div>
                ))
            )}
        </div>
        
        {/* Back to Home */}
        <button 
            onClick={() => navigate("/home")}
            className="mt-4 text-gray-500 hover:text-indigo-700 text-sm font-medium flex items-center gap-2 transition-colors"
        >
            <span>←</span> Back to Orbit
        </button>
      </div>

      {/* --- MAIN WRITING AREA --- */}
      <div className="flex-1 h-full flex flex-col relative">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex items-center justify-between bg-white/30 backdrop-blur-md">
             <button onClick={() => navigate("/home")} className="text-gray-600">← Home</button>
             <button onClick={handleNewEntry} className="text-indigo-700 font-bold">+ New</button>
        </div>

        {/* Paper Container */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 flex flex-col">
            
            {/* Top Bar: Date, Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b border-gray-200 pb-4 gap-4">
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Title your day..." 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent text-3xl md:text-4xl font-bold text-indigo-900 placeholder-indigo-200/60 focus:outline-none w-full"
                        disabled={selectedEntry} 
                    />
                    <p className="text-indigo-400 text-sm mt-2 font-medium">
                        {selectedEntry 
                            ? new Date(selectedEntry.createdAt).toLocaleString() 
                            : new Date().toLocaleString()
                        }
                    </p>
                </div>

                {/* Actions Group */}
                <div className="flex flex-col items-end gap-3">
                    
                    {/* VISIBILITY SELECTOR (Only in Write Mode) */}
                    {!selectedEntry && (
                        <div className="flex bg-white/60 rounded-lg p-1 border border-indigo-100 shadow-sm">
                            {visibilityOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setVisibility(option)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        visibility === option 
                                        ? "bg-indigo-600 text-white shadow-sm" 
                                        : "text-indigo-400 hover:text-indigo-600 hover:bg-white/50"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* VIEW MODE: VISIBILITY BADGE */}
                    {selectedEntry && (
                         <span className="px-3 py-1.5 text-xs font-bold rounded-md bg-indigo-100 text-indigo-600 uppercase tracking-wider">
                            {visibility}
                         </span>
                    )}

                    {/* SAVE / DELETE BUTTONS */}
                    <div className="flex gap-2 w-full justify-end">
                        {selectedEntry ? (
                            <button 
                                onClick={() => handleDelete(selectedEntry._id)}
                                className="text-red-400 hover:text-red-600 px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Delete Entry
                            </button>
                        ) : (
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {isSaving ? "Saving..." : "Save Entry"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Writing Area */}
            <textarea
                placeholder="What's on your mind? Start typing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`flex-1 w-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed text-gray-700 placeholder-indigo-200 custom-scrollbar ${
                    selectedEntry ? "cursor-text" : ""
                }`}
                disabled={selectedEntry} 
            ></textarea>

            {selectedEntry && (
                <div className="mt-4 text-center">
                    <button 
                        onClick={handleNewEntry}
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Start a new entry
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default JournalPage;