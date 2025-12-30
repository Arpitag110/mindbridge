import { useState, useEffect } from "react";
import axios from "axios";
import { useUI } from "./ui/UiProvider";
import { useNavigate } from "react-router-dom";

const CirclesPage = () => {
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState("All");

  // Create Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public",
    tags: "", // Entered as comma separated string
  });

  // Predefined tags for the filter bar
  const filterTags = ["All", "Anxiety", "Depression", "Meditation", "Positivity", "Social", "Work-Stress"];

  // --- INIT ---
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);
    fetchCircles();
  }, [activeTag]); // Refetch when tag changes

  // --- API CALLS ---
  const fetchCircles = async () => {
    try {
      setLoading(true);
      // Construct query: ?search=...&tag=...
      let query = `?search=${searchTerm}`;
      if (activeTag !== "All") query += `&tag=${activeTag}`;

      const res = await axios.get(`http://localhost:5000/api/circles${query}`);
      setCircles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { showToast } = useUI();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return showToast("Please fill in required fields", "error");

    try {
      // CLEAN TAGS: Split by comma, trim spaces, and remove '#' if user typed it
      const tagArray = formData.tags.split(",")
        .map(t => t.trim().replace("#", ""))
        .filter(t => t);

      await axios.post("http://localhost:5000/api/circles", {
        ...formData,
        tags: tagArray,
        creator: currentUser._id,
      });

      setShowModal(false);
      setFormData({ name: "", description: "", visibility: "public", tags: "" });
      fetchCircles(); // Refresh list
    } catch (err) {
      console.error(err);
      showToast("Failed to create circle. Name might be taken.", "error");
    }
  };

  const handleJoin = async (circleId) => {
    try {
      await axios.put(`http://localhost:5000/api/circles/${circleId}/join`, {
        userId: currentUser._id
      });
      fetchCircles(); // Refresh to update member counts/buttons
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnter = (circleId) => {
    navigate(`/circles/${circleId}`);
  };

  // --- HELPER TO CHECK MEMBERSHIP ---
  const getButtonState = (circle) => {
    if (!currentUser) return { text: "Login to Join", style: "bg-gray-300", disabled: true };

    if (circle.members.some(m => m._id === currentUser._id)) {
      // User is a member -> Button becomes "Enter"
      return { text: "Joined", style: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200", disabled: false };
    }
    if (circle.pendingMembers && circle.pendingMembers.includes(currentUser._id)) {
      return { text: "Requested", style: "bg-yellow-100 text-yellow-700 border-yellow-200", disabled: true };
    }
    return { text: circle.visibility === "private" ? "Request Join" : "Join Circle", style: "bg-indigo-600 text-white hover:bg-indigo-700", disabled: false };
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* 1. HERO SECTION */}
      <div className="bg-indigo-600 text-white py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Back to Orbit Button */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors font-medium mb-6"
          >
            <span>←</span> Back to Home
          </button>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Find Your Circle</h1>
              <p className="text-indigo-100">Connect with others who understand your journey.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-transform hover:scale-105"
            >
              + Create New Circle
            </button>
          </div>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-8">
        <div className="bg-white p-4 rounded-2xl shadow-md flex flex-col md:flex-row gap-4 items-center">

          {/* Search Bar */}
          <div className="flex-1 w-full relative">
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search circles (e.g. 'Coding', 'Anxiety')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCircles()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Tags */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {filterTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CIRCLES GRID */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {loading ? (
          <p className="text-center text-gray-500">Loading circles...</p>
        ) : circles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <h3 className="text-xl font-bold">No Circles Found</h3>
            <p>Try changing your search or create the first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map(circle => {
              const btn = getButtonState(circle);
              return (
                <div key={circle._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
                  {/* Card Header (Color strip for now) */}
                  <div
                    onClick={() => btn.text === "Joined" && handleEnter(circle._id)}
                    className={`h-24 rounded-t-2xl w-full cursor-pointer ${circle.coverImage ? '' : 'bg-gradient-to-r from-indigo-300 to-purple-300'}`}
                  >
                    {circle.coverImage && <img src={circle.coverImage} className="w-full h-full object-cover rounded-t-2xl" />}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3
                        onClick={() => btn.text === "Joined" && handleEnter(circle._id)}
                        className="text-xl font-bold text-gray-800 line-clamp-1 cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        {circle.name}
                      </h3>
                      {circle.visibility === 'private' && <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">🔒 Private</span>}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{circle.description}</p>

                    {/* Tags Display - Visually add # */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {circle.tags.slice(0, 3).map((t, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-medium">#{t}</span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <div className="text-xs text-gray-500">
                        <span className="font-bold text-gray-700">{circle.members.length}</span> members
                      </div>

                      <button
                        onClick={() => {
                          if (btn.text === "Joined") {
                            handleEnter(circle._id);
                          } else if (!btn.disabled) {
                            handleJoin(circle._id);
                          }
                        }}
                        disabled={btn.disabled && btn.text !== "Joined"} // Only disable if pending/waiting, not if joined
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${btn.style}`}
                      >
                        {btn.text === "Joined" ? "Enter Circle" : btn.text}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create a Circle</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Circle Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Anxiety Support Group"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2 h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="What is this circle about?"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. stress, work, sleep"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.visibility === 'public'}
                    onChange={() => setFormData({ ...formData, visibility: 'public' })}
                  />
                  <span className="text-sm text-gray-700">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.visibility === 'private'}
                    onChange={() => setFormData({ ...formData, visibility: 'private' })}
                  />
                  <span className="text-sm text-gray-700">Private (Invite only)</span>
                </label>
              </div>

              <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors mt-2">
                Launch Circle
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CirclesPage;