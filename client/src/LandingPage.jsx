import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      {/* --- CUSTOM CSS FOR ANIMATIONS --- */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes drift {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 8s ease-in-out infinite; animation-delay: 2s; }
        .animate-float-slow { animation: float 10s ease-in-out infinite; animation-delay: 1s; }
        .animate-drift { animation: drift 20s infinite alternate linear; }
      `}</style>

      {/* --- FLOATING BUBBLES BACKGROUND --- */}
      {/* Top Left - Large Purple */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-drift"></div>
      
      {/* Bottom Right - Large Blue */}
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-drift" style={{ animationDelay: '2s' }}></div>
      
      {/* Small Floating Bubbles */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float"></div>
      <div className="absolute bottom-1/3 left-10 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float-delayed"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float-slow"></div>
      <div className="absolute bottom-20 left-1/2 w-16 h-16 bg-blue-200 rounded-full mix-blend-multiply filter blur-lg opacity-50 animate-float"></div>


      {/* --- HERO CONTENT --- */}
      <div className="max-w-3xl space-y-8 relative z-10">
        
        {/* FIXED TITLE: Added pb-4 and leading-normal to prevent clipping */}
        <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight pb-4 leading-normal filter drop-shadow-sm">
          MindBridge
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
          Find your inner calm. A supportive space to reflect, track your mood, 
          and connect with a community that truly understands you.
        </p>

        <button 
          onClick={() => navigate("/auth")}
          className="group relative px-10 py-5 bg-indigo-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out flex items-center gap-3 mx-auto"
        >
          Get Started
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>

    </div>
  );
}

export default LandingPage;