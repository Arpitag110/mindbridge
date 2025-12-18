import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import Axios
import "./index.css";

const HomePage = () => {
  const navigate = useNavigate();
  
  // 1. User Data
  const [user, setUser] = useState(null);
  
  // 2. Logic State
  const [hasLoggedToday, setHasLoggedToday] = useState(true); // Default true to prevent flash
  const [isLoadingMood, setIsLoadingMood] = useState(true);

  // 3. Center Circle Content State
  const defaultCenter = { 
    title: "MindBridge", 
    desc: "Your sanctuary for mental clarity." 
  };
  const [centerInfo, setCenterInfo] = useState(defaultCenter);

  // --- INITIAL LOAD & CHECK MOOD ---
  useEffect(() => {
    const checkUserAndMood = async () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Check Mood History
        try {
          const res = await axios.get(`http://localhost:5000/api/mood/${parsedUser._id || parsedUser.id}`);
          const history = res.data;

          if (history.length > 0) {
            const lastEntryDate = new Date(history[0].createdAt);
            const today = new Date();
            
            // Compare dates (ignoring time)
            const isSameDay = 
              lastEntryDate.getDate() === today.getDate() &&
              lastEntryDate.getMonth() === today.getMonth() &&
              lastEntryDate.getFullYear() === today.getFullYear();

            setHasLoggedToday(isSameDay);
          } else {
            setHasLoggedToday(false); // No history at all
          }
        } catch (err) {
          console.error("Error checking mood status", err);
        } finally {
          setIsLoadingMood(false);
        }

      } else {
        navigate("/auth"); 
      }
    };

    checkUserAndMood();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/auth");
  };

  // --- NAVIGATION ITEMS ---
  const navItems = [
    { title: "Profile", desc: "Manage your personal account settings.", path: "/profile" },
    { title: "Dashboard", desc: "Visualize your progress.", path: "/dashboard" },
    { title: "Circles", desc: "Join community support groups.", path: "/circles" },
    { title: "Journal", desc: "A private space to write.", path: "/journal" },
    { title: "Mood", desc: "Track your emotional well-being.", path: "/mood" },
  ];

  const radius = 250; 

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 overflow-hidden relative flex flex-col font-sans">
      
      {/* Header */}
      <div className="absolute top-6 right-8 flex items-center gap-4 z-50">
        <h2 className="text-indigo-900 font-semibold text-lg">
          Hi, {user?.username || user?.name || "Friend"}
        </h2>
        <button 
          onClick={handleLogout}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full shadow-md transition-all"
        >
          Logout
        </button>
      </div>

      {/* --- DAILY CHECK-IN WIDGET (Bottom Left) --- */}
      {!isLoadingMood && !hasLoggedToday && (
        <div className="absolute bottom-8 left-8 z-50 animate-fade-in-up">
           <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-xl max-w-sm relative overflow-hidden group">
              {/* Decorative background element */}
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-1 relative z-10">
                Daily Check-In 📝
              </h3>
              <p className="text-gray-600 text-sm mb-4 relative z-10">
                You haven't logged your mood yet today. Tracking creates awareness.
              </p>
              
              <button 
                onClick={() => navigate("/mood")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 relative z-10"
              >
                Track Now →
              </button>
           </div>
        </div>
      )}

      {/* OPTIONAL: "All Set" Widget (If they HAVE logged) */}
      {!isLoadingMood && hasLoggedToday && (
         <div className="absolute bottom-8 left-8 z-50 animate-fade-in-up opacity-80 hover:opacity-100 transition-opacity">
            <div className="bg-green-50/80 backdrop-blur-md border border-green-100 p-4 rounded-2xl shadow-lg flex items-center gap-3">
               <div className="bg-green-100 text-green-600 p-2 rounded-full">✓</div>
               <div>
                  <p className="text-sm font-bold text-green-800">You're all set!</p>
                  <p className="text-xs text-green-600">Mood logged for today.</p>
               </div>
            </div>
         </div>
      )}

      {/* Main Orbit Area */}
      <div className="flex-1 flex items-center justify-center relative">
        
        {/* CENTER STATIC CIRCLE */}
        <div className="absolute z-20 w-80 h-80 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl flex flex-col items-center justify-center text-center p-8 transition-all duration-300 border border-white/50">
          <h1 className="text-4xl font-bold text-indigo-900 mb-3">{centerInfo.title}</h1>
          <p className="text-indigo-600 text-lg leading-relaxed">{centerInfo.desc}</p>
        </div>

        {/* ORBIT TRACK */}
        <div className="absolute w-[500px] h-[500px] rounded-full orbit-container flex items-center justify-center pointer-events-none">
          {navItems.map((item, index) => {
            const angleDeg = (360 / navItems.length) * index - 90; 
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = radius * Math.cos(angleRad);
            const y = radius * Math.sin(angleRad);

            return (
              <div
                key={index}
                className="absolute flex items-center justify-center pointer-events-auto"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div className="counter-rotate">
                  <div 
                    onClick={() => navigate(item.path)}
                    className={`w-36 h-36 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform duration-300 hover:scale-110 
                      ${item.title === "Mood" && !hasLoggedToday 
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse" // Highlight Mood Bubble if not logged
                        : "bg-indigo-500 hover:bg-indigo-600 text-white"}`
                    }
                    onMouseEnter={() => setCenterInfo(item)}
                    onMouseLeave={() => setCenterInfo(defaultCenter)}
                  >
                    <span className="font-semibold text-xl">{item.title}</span>
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