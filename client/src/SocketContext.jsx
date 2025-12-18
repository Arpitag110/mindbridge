import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Get user from local storage
    const currentUser = JSON.parse(localStorage.getItem("user"));
    setUser(currentUser);

    if (currentUser) {
      // 2. Connect to Backend
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      // 3. Register the user online
      newSocket.emit("newUser", currentUser.username);

      // 4. Listen for incoming notifications
      newSocket.on("getNotification", (data) => {
        setNotifications((prev) => [data, ...prev]);
      });

      return () => newSocket.disconnect();
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, user }}>
      {children}
    </SocketContext.Provider>
  );
};