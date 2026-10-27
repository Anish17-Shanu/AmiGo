import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);

  const clearEvents = useCallback(() => setLiveEvents([]), []);

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const connection = io(url, {
      auth: token ? { token } : {},
      transports: ["websocket", "polling"]
    });

    setSocket(connection);
    setLiveEvents([]);

    const pushEvent = (type, payload) => {
      setLiveEvents((current) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type,
            payload,
            ts: Date.now()
          },
          ...current
        ].slice(0, 50)
      );
    };

    connection.on("order:created", (payload) => pushEvent("order", payload));
    connection.on("sales:updated", (payload) => pushEvent("sales", payload));
    connection.on("user:activity", (payload) => pushEvent("activity", payload));
    connection.on("trending:updated", (payload) => pushEvent("trending", payload));
    connection.on("connect_error", (error) => {
      if (token && error.message === "Unauthorized") {
        window.dispatchEvent(new Event("amigo:unauthorized"));
      }
    });

    return () => {
      connection.disconnect();
    };
  }, [token]);

  const value = useMemo(
    () => ({ socket, liveEvents, clearEvents }),
    [socket, liveEvents, clearEvents]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketFeed = () => useContext(SocketContext);
