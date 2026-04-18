import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);

    const pushEvent = (type, payload) => {
      setLiveEvents((prev) => [{ type, payload, ts: Date.now() }, ...prev].slice(0, 30));
    };

    s.on("order:created", (payload) => pushEvent("order", payload));
    s.on("sales:updated", (payload) => pushEvent("sales", payload));
    s.on("user:activity", (payload) => pushEvent("activity", payload));
    s.on("trending:updated", (payload) => pushEvent("trending", payload));

    return () => s.disconnect();
  }, []);

  const value = useMemo(() => ({ socket, liveEvents }), [socket, liveEvents]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketFeed = () => useContext(SocketContext);
