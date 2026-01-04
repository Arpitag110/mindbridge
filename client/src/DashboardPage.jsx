import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Bell, Activity, Users, MessageCircle, Search, UserPlus, ArrowLeft } from "lucide-react";
import { useSocket } from "./SocketContext";
import ChatWidget from "./ChatWidget";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { socket, user } = useSocket();

  // Notification State
  const [notifications, setNotifications] = useState([]);

  // Data State
  const [moodData, setMoodData] = useState([]);
  const [myCirclesCount, setMyCirclesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Chat & Search State
  const [activeChat, setActiveChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchNotifications();
      fetchRecentChats();
    }
  }, [user, socket]);

  // Re-fetch recent chats when a chat window closes (to update order or new users)
  useEffect(() => {
    if (!activeChat && user) {
      fetchRecentChats();
    }
  }, [activeChat, user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (data) => {
      setNotifications((prev) => [...prev, data]);
    };
    socket.on("getNotification", handleNewNotification);
    return () => {
      socket.off("getNotification", handleNewNotification);
    };
  }, [socket]);

  // Listen for incoming chat messages and refresh recent chats
  useEffect(() => {
    if (!socket) return;
    const handleIncomingMessage = (data) => {
      // Refresh recent chats so the sender shows up at top
      fetchRecentChats();
    };
    socket.on('getMessage', handleIncomingMessage);
    return () => socket.off('getMessage', handleIncomingMessage);
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/${user._id || user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      // Remove from UI immediately
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));

      // Mark as read in backend
      await axios.put(`http://localhost:5000/api/notifications/mark-read/${notificationId}`);
    } catch (err) {
      console.error("Error marking notification as read", err);
    }
  };

  // NEW: Fetch conversation history list
  const fetchRecentChats = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/messages/conversations/${user._id}`);
      console.log("Recent chats fetched:", res.data);
      setRecentChats(res.data);
    } catch (err) {
      console.error("Error fetching conversations", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Mood History
      const moodRes = await axios.get(`http://localhost:5000/api/mood/${user._id || user.id}`);
      const formattedMoods = moodRes.data.reverse().map(entry => ({
        date: new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: "short" }),
        score: entry.score
      }));
      setMoodData(formattedMoods);

      // 2. Fetch Circles
      const circlesRes = await axios.get("http://localhost:5000/api/circles");
      const myCircles = circlesRes.data.filter(c =>
        c.members.some(member => member._id === user._id || member === user._id)
      );
      setMyCirclesCount(myCircles.length);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      setLoading(false);
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/users?search=${searchQuery}`);
      setSearchResults(res.data.filter(u => u._id !== user._id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const startChat = (targetUser) => {
    setActiveChat(targetUser);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!user) return <div className="p-10 text-center text-indigo-600 font-bold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">

      {/* BACK TO HOME */}
      <div className="max-w-6xl mx-auto mb-4">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </button>
      </div>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.username} 👋</h1>
          <p className="text-gray-500">Your mental health overview & community.</p>
        </div>

        <div className="relative group">
          <button className="bg-white p-3 rounded-xl shadow-sm border relative hover:bg-gray-100 transition">
            <Bell size={20} className="text-gray-600" />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce"></span>}
          </button>

          {/* Notification Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border hidden group-hover:block z-20 overflow-hidden">
            <div className="p-3 border-b text-xs font-bold text-gray-500 uppercase bg-gray-50 flex justify-between items-center">
              Recent Activity
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">No new activity yet</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => markNotificationAsRead(n._id)}
                    className="p-3 border-b hover:bg-indigo-50 transition text-sm flex gap-2 cursor-pointer group"
                  >
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0"></div>
                    <div className="flex-1">
                      <span className="font-bold text-gray-800">{n.senderName}</span>
                      <span className="text-gray-600"> {n.message || (n.type === 'like' ? 'liked your post' : 'commented')}</span>
                      <p className="text-gray-500 italic text-xs mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(n._id);
                      }}
                      className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Stats & Graph */}
        <div className="lg:col-span-2 space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition hover:shadow-md">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600"><Activity /></div>
              <div><h3 className="text-2xl font-bold text-gray-800">{moodData.length}</h3><p className="text-xs text-gray-500 font-bold uppercase">Entries</p></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition hover:shadow-md">
              <div className="bg-green-100 p-3 rounded-xl text-green-600"><Activity /></div>
              <div><h3 className="text-2xl font-bold text-gray-800">Stable</h3><p className="text-xs text-gray-500 font-bold uppercase">Status</p></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition hover:shadow-md">
              <div className="bg-pink-100 p-3 rounded-xl text-pink-600"><Users /></div>
              <div><h3 className="text-2xl font-bold text-gray-800">{myCirclesCount}</h3><p className="text-xs text-gray-500 font-bold uppercase">Circles Joined</p></div>
            </div>
          </div>

          {/* MOOD GRAPH */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="font-bold text-lg text-gray-800 mb-6">Mood Trends (Last 7 Days)</h2>
            <div className="h-72 w-full">
              {moodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis domain={[0, 6]} hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl border-gray-100">
                  <p>No mood data yet. Check in today!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Chat & Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border h-full flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-green-100 p-2 rounded-lg text-green-600"><MessageCircle size={20} /></div>
            <h3 className="font-bold text-gray-800">Community Chat</h3>
          </div>

          {/* SEARCH BAR */}
          <form onSubmit={handleUserSearch} className="mb-6 relative">
            <input
              type="text"
              placeholder="Find users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
            <button type="submit" hidden></button>
          </form>

          {/* LIST AREA */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {searchResults.length > 0 ? (
              // SEARCH RESULTS
              <>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Search Results</p>
                {searchResults.map(u => (
                  <div
                    key={u._id}
                    onClick={() => startChat(u)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-10 h-10 rounded-full bg-gray-100" alt="avatar" />
                      <span className="font-medium text-gray-700">{u.username}</span>
                    </div>
                    <UserPlus size={16} className="text-indigo-600" />
                  </div>
                ))}
              </>
            ) : (
              // RECENT CHATS (Active Conversations)
              <>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Recent Messages</p>
                {recentChats.length > 0 ? (
                  recentChats.map(u => (
                    <div
                      key={u._id}
                      onClick={() => startChat(u)}
                      className={`flex items-center gap-3 cursor-pointer p-2 rounded-xl transition border border-transparent hover:border-indigo-100 ${u.unreadCount > 0 ? 'bg-indigo-50' : 'hover:bg-indigo-50'}`}
                    >
                      <div className="relative">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-10 h-10 rounded-full bg-gray-100" alt="avatar" />
                      </div>
                      <div className="flex-1">
                        <span className={`font-medium block ${u.unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'}`}>{u.username}</span>
                        <span className={`text-xs ${u.unreadCount > 0 ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}>{u.lastMessage ? u.lastMessage : 'Tap to chat'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.unreadCount > 0 && (
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full" title={`${u.unreadCount} unread`} />
                        )}
                        <MessageCircle size={16} className="text-gray-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 mt-10">
                    <p className="text-sm">No conversations yet.</p>
                    <p className="text-xs mt-1">Search a user to start!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CHAT WIDGET POPUP */}
      {activeChat && (
        <ChatWidget
          socket={socket}
          currentUser={user}
          targetUser={activeChat}
          onClose={() => setActiveChat(null)}
          onMessageSent={fetchRecentChats}
        />
      )}
    </div>
  );
};

export default DashboardPage;