import { useState } from "react";
import { User, Mail, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const inputClasses = "w-full pl-10 p-3 bg-indigo-50/50 border border-transparent rounded-xl outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all duration-200";
  
  // Consistent button style with hover scale and shadow
  const formButtonClasses = "w-full bg-indigo-600 text-white p-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-in-out";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Back Button with hover effect */}
      <button 
        onClick={() => navigate("/")} 
        className="absolute top-8 left-8 p-3 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow-md text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all duration-200 z-10"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Decorative blobs for consistency */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>


      <div className="relative bg-white/90 backdrop-blur-lg rounded-[2rem] shadow-2xl overflow-hidden max-w-4xl w-full min-h-[600px] flex z-20">
        
        {/* --- LEFT SIDE: SIGN IN FORM --- */}
        <div className="w-1/2 p-12 flex flex-col justify-center items-center">
          <h2 className="text-4xl font-bold mb-8 text-indigo-900">Welcome Back</h2>
          <div className="space-y-5 w-full max-w-xs">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-indigo-400 w-5 h-5" />
              <input type="email" placeholder="Email" className={inputClasses} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-indigo-400 w-5 h-5" />
              <input type="password" placeholder="Password" className={inputClasses} />
            </div>
            <button className={formButtonClasses}>
              SIGN IN
            </button>
            <p className="text-sm text-center text-indigo-400 mt-4 cursor-pointer hover:text-indigo-600 transition-colors">Forgot your password?</p>
          </div>
        </div>

        {/* --- RIGHT SIDE: SIGN UP FORM --- */}
        <div className="w-1/2 p-12 flex flex-col justify-center items-center">
          <h2 className="text-4xl font-bold mb-8 text-indigo-900">Create Account</h2>
          <div className="space-y-5 w-full max-w-xs">
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-indigo-400 w-5 h-5" />
              <input type="text" placeholder="Full Name" className={inputClasses} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-indigo-400 w-5 h-5" />
              <input type="email" placeholder="Email" className={inputClasses} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-indigo-400 w-5 h-5" />
              <input type="password" placeholder="Password" className={inputClasses} />
            </div>
            <button className={formButtonClasses}>
              SIGN UP
            </button>
          </div>
        </div>

        {/* --- THE SLIDING OVERLAY (Gradient Version) --- */}
        <div 
          className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white transform transition-transform duration-700 ease-in-out flex flex-col justify-center items-center p-12 z-50 ${
            isSignUp ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {isSignUp ? (
            // CONTENT: ASK TO SIGN IN
            <div className="text-center animate-fade-in">
              <h2 className="text-5xl font-bold mb-6 leading-tight">Welcome Back!</h2>
              <p className="text-lg mb-10 text-indigo-100 font-medium leading-relaxed">To keep connected with us please login with your personal info</p>
              <button 
                onClick={() => setIsSignUp(false)}
                // Added hover scale to slider buttons
                className="border-2 border-white px-10 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-indigo-700 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
              >
                SIGN IN
              </button>
            </div>
          ) : (
            // CONTENT: ASK TO SIGN UP
            <div className="text-center animate-fade-in">
              <h2 className="text-5xl font-bold mb-6 leading-tight">New Here?</h2>
              <p className="text-lg mb-10 text-indigo-100 font-medium leading-relaxed">Start your journey to mental clarity with us today.</p>
              <button 
                onClick={() => setIsSignUp(true)}
                // Added hover scale to slider buttons
                className="border-2 border-white px-10 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-indigo-700 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out"
              >
                SIGN UP
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AuthPage;