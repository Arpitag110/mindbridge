import { useState, useEffect, useRef } from "react";
import { X, Send, Loader } from "lucide-react";
import axios from "axios";

const ChatWidget = ({ socket, currentUser, targetUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  // 1. Load Chat History on Open
  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${currentUser._id}/${targetUser._id}`
        );
        setMessages(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching messages", err);
        setLoading(false);
      }
    };
    getMessages();
  }, [currentUser, targetUser]);

  // 2. Listen for Incoming Messages (Real-time)
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (data) => {
      // Only append if the message is from the person we are currently chatting with
      if (data.senderId === targetUser._id) {
        setMessages((prev) => [
          ...prev,
          {
            sender: data.senderId,
            text: data.text,
            createdAt: Date.now(),
          },
        ]);
      }
    };

    socket.on("getMessage", handleMessage);

    return () => {
      socket.off("getMessage", handleMessage);
    };
  }, [socket, targetUser]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send Message Function
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      sender: currentUser._id,   // NOTE: Must match Model schema 'sender'
      receiverId: targetUser._id,
      text: newMessage,
    };

    // A. Optimistic UI Update (Show it immediately)
    const optimisticMsg = { ...messageData, createdAt: Date.now() };
    setMessages([...messages, optimisticMsg]);
    setNewMessage("");

    try {
      // B. Save to Database (Crucial for Recent Chats list!)
      await axios.post("http://localhost:5000/api/messages", messageData);

      // C. Send via Socket (For Real-time)
      socket.emit("sendMessage", {
        senderId: currentUser._id,
        receiverId: targetUser._id,
        text: messageData.text,
      });

    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="fixed bottom-0 right-10 w-80 h-[450px] bg-white rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col z-50 font-sans">
      {/* HEADER */}
      <div className="bg-indigo-600 p-4 rounded-t-2xl flex justify-between items-center text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`} 
              className="w-10 h-10 rounded-full bg-white border-2 border-white"
              alt="avatar"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm">{targetUser.username}</h3>
            <span className="text-xs text-indigo-200 block">Online</span>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded-full transition">
          <X size={18} />
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex justify-center mt-10 text-gray-400">
            <Loader className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-xs mt-10">
            Say hello to {targetUser.username}! 👋
          </div>
        ) : (
          messages.map((m, index) => {
            // Check if message is from 'me' (current user)
            // We handle both 'sender' object (populated) or 'sender' string (ID)
            const isMe = (m.sender._id === currentUser._id) || (m.sender === currentUser._id);
            
            return (
              <div key={index} ref={scrollRef} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT AREA */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-gray-100 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;