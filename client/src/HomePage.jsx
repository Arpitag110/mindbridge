import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

const HomePage = () => {
  const navigate = useNavigate();
  
  // 1. Get User Data safely
  const [user, setUser] = useState({ name: "User" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } else {
      navigate("/auth"); 
    }
  }, [navigate]);

  // 2. Center Circle Content State
  const defaultCenter = { 
    title: "MindBridge", 
    desc: "Your sanctuary for mental clarity." 
  };
  const [centerInfo, setCenterInfo] = useState(defaultCenter);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/auth");
  };

  // --- UPDATED DESCRIPTIONS ---
  const navItems = [
    { 
      title: "Profile", 
      desc: "Manage your personal account settings, privacy preferences, and user details." 
    },
    { 
      title: "Dashboard", 
      desc: "Visualize your progress with weekly insights, charts, and mental health stats." 
    },
    { 
      title: "Circles", 
      desc: "Join community support groups to share experiences and connect with peers safely." 
    },
    { 
      title: "Journal", 
      desc: "A private space to write down your thoughts, reflections, and daily gratitude." 
    },
    { 
      title: "Mood", 
      desc: "Track your emotional well-being over time to identify patterns and triggers." 
    },
  ];

  const radius = 250; // Distance from center

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 overflow-hidden relative flex flex-col font-sans">
      
      {/* Header */}
      <div className="absolute top-6 right-8 flex items-center gap-4 z-50">
        <h2 className="text-indigo-900 font-semibold text-lg">
          Hi, {user.username || user.name || "Friend"}
        </h2>
        <button 
          onClick={handleLogout}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full shadow-md transition-all"
        >
          Logout
        </button>
      </div>

      {/* Main Orbit Area */}
      <div className="flex-1 flex items-center justify-center relative">
        
        {/* CENTER STATIC CIRCLE */}
        <div className="absolute z-20 w-80 h-80 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl flex flex-col items-center justify-center text-center p-8 transition-all duration-300 border border-white/50">
          <h1 className="text-4xl font-bold text-indigo-900 mb-3">{centerInfo.title}</h1>
          <p className="text-indigo-600 text-lg leading-relaxed">{centerInfo.desc}</p>
        </div>

        {/* ORBIT TRACK (Spinning Container) */}
        <div className="absolute w-[500px] h-[500px] rounded-full orbit-container flex items-center justify-center pointer-events-none">
          
          {navItems.map((item, index) => {
            // Calculate position
            const angleDeg = (360 / navItems.length) * index - 90; 
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = radius * Math.cos(angleRad);
            const y = radius * Math.sin(angleRad);

            return (
              <div
                key={index}
                className="absolute flex items-center justify-center"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {/* LAYER 1: COUNTER-ROTATION 
                  This div spins backwards to keep the content upright.
                  It ignores hover effects to avoid conflict.
                */}
                <div className="counter-rotate pointer-events-auto">
                  
                  {/* LAYER 2: HOVER & STYLING 
                    This div handles the hover scale and looks.
                    Because it is inside the counter-rotator, it stays upright!
                  */}
                  <div 
                    className="w-36 h-36 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform duration-300 hover:scale-110"
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