import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./index.css"; 

const HomePage = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    avatar: "felix", 
    mantra: "Loading your vibe...",
    stats: { moodCount: 0 }
  });

  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const defaultCenter = { 
    title: "MindBridge", 
    desc: "Your sanctuary for mental clarity." 
  };
  const [centerInfo, setCenterInfo] = useState(defaultCenter);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchHomeData = async () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        try {
          // 1. Fetch Profile Data
          const userRes = await axios.get(`http://localhost:5000/api/users/${parsedUser._id || parsedUser.id}`);
          setProfileData({
            avatar: userRes.data.avatar || "felix",
            mantra: userRes.data.mantra || "Welcome to your space.",
            stats: userRes.data.stats || { moodCount: 0 }
          });

          // 2. Fetch Mood History
          const moodRes = await axios.get(`http://localhost:5000/api/mood/${parsedUser._id || parsedUser.id}`);
          const history = moodRes.data;

          if (history.length > 0) {
            const lastEntryDate = new Date(history[0].createdAt);
            const today = new Date();
            
            const isSameDay = 
              lastEntryDate.getDate() === today.getDate() &&
              lastEntryDate.getMonth() === today.getMonth() &&
              lastEntryDate.getFullYear() === today.getFullYear();

            setHasLoggedToday(isSameDay);
          } else {
            setHasLoggedToday(false);
          }

        } catch (err) {
          console.error("Error loading home data:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        navigate("/auth"); 
      }
    };

    fetchHomeData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/auth");
  };

  // --- ORBIT CONFIGURATION ---
  const navItems = [
    { 
      title: "Profile", 
      desc: "Curate your digital persona.\nManage your personal space.", 
      path: "/profile" 
    },
    { 
      title: "Dashboard", 
      desc: "Visualize your healing journey.\nSpot patterns in your growth.", 
      path: "/dashboard" 
    },
    { 
      title: "Circles", 
      desc: "Connect with people.\nFind comfort in community.", 
      path: "/circles" 
    },
    { 
      title: "Journal", 
      desc: "Unload your heavy thoughts.\nYour private safe haven.", 
      path: "/journal" 
    },
    { 
      title: "Mood", 
      desc: "Take your emotional pulse.\nAwareness starts here.", 
      path: "/mood" 
    },
  ];

  // 👇 REDUCED RADIUS to 260 (Brings them closer)
  const radius = 260; 

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 overflow-hidden relative flex flex-col font-sans">
      
      {/* --- TOP LEFT: PROFILE IDENTITY --- */}
      <div 
        className="absolute top-6 left-6 z-50 flex items-center gap-4 cursor-pointer group"
        onClick={() => navigate("/profile")}
      >
          <div className="relative transition-transform duration-300 group-hover:scale-105">
             <img 
               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.avatar}`} 
               alt="User Avatar"
               className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-indigo-50"
             />
             <div className="absolute -bottom-1 -right-2 bg-white text-orange-500 font-bold text-xs px-2 py-0.5 rounded-full shadow-sm border border-orange-100 flex items-center gap-1">
               <span>🔥</span> {profileData.stats.moodCount}
             </div>
          </div>

          <div className="hidden md:block">
            <h2 className="text-xl font-bold text-indigo-900 leading-tight">
              Hi, {user?.username || "Friend"}
            </h2>
            <p className="text-indigo-500 text-sm font-medium italic opacity-80">
              "{profileData.mantra}"
            </p>
          </div>
      </div>

      {/* --- TOP RIGHT: LOGOUT --- */}
      <div className="absolute top-6 right-8 z-50">
        <button 
          onClick={handleLogout}
          className="bg-white/50 hover:bg-white text-indigo-900 px-5 py-2 rounded-full shadow-sm border border-white/60 transition-all font-semibold text-sm backdrop-blur-sm"
        >
          Logout
        </button>
      </div>

      {/* --- BOTTOM LEFT: DAILY CHECK-IN WIDGET --- */}
      {!isLoading && !hasLoggedToday && (
        <div className="absolute bottom-8 left-8 z-50 animate-fade-in-up hidden md:block">
           <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-xl max-w-sm relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>
             
             <h3 className="text-lg font-bold text-gray-800 mb-1">Daily Check-In 📝</h3>
             <p className="text-gray-600 text-sm mb-4">You haven't logged your mood yet today.</p>
             
             <button 
               onClick={() => navigate("/mood")}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all"
             >
               Track Now →
             </button>
           </div>
        </div>
      )}

      {/* --- CENTER: ORBIT SYSTEM --- */}
      <div className="flex-1 flex items-center justify-center relative">
        
        {/* Static Center Hub */}
        <div className="absolute z-20 w-80 h-80 bg-white/40 backdrop-blur-xl rounded-full shadow-2xl flex flex-col items-center justify-center text-center p-8 transition-all duration-300 border border-white/60">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">{centerInfo.title}</h1>
          <p className="text-indigo-800 text-lg font-medium whitespace-pre-line leading-relaxed">
            {centerInfo.desc}
          </p>
        </div>

        {/* Orbit Track & Planets - REDUCED CONTAINER SIZE TO MATCH */}
        <div className="absolute w-[600px] h-[600px] rounded-full orbit-container flex items-center justify-center pointer-events-none">
          {navItems.map((item, index) => {
            const angleDeg = (360 / navItems.length) * index - 90; 
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = radius * Math.cos(angleRad);
            const y = radius * Math.sin(angleRad);

            const showPulse = item.title === "Mood" && !hasLoggedToday && !isLoading;

            return (
              <div
                key={index}
                className="absolute flex items-center justify-center pointer-events-auto"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div className="counter-rotate">
                  <div 
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => setCenterInfo(item)}
                    onMouseLeave={() => setCenterInfo(defaultCenter)}
                    className={`
                      w-36 h-36 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 border-4 border-white/50
                      ${showPulse 
                        ? "bg-pink-500 text-white animate-pulse shadow-pink-300/50" 
                        : "bg-indigo-500 hover:bg-indigo-600 text-white"}
                    `}
                  >
                    <span className="font-bold text-lg">{item.title}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default HomePage;