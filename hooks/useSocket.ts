import { useEffect, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(socketInstance);
    const [isConnected, setIsConnected] = useState(socketInstance?.connected || false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    useEffect(() => {
        if (!socketInstance) {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
            // console.log("Initializing shared Socket URL:", socketUrl);

            socketInstance = ClientIO(socketUrl, {
                path: "/socket.io/",
                transports: ["polling", "websocket"],
                secure: true,
            });
        }

        setSocket(socketInstance);

        const onConnect = () => {
            setIsConnected(true);
            setConnectionError(null);
        };

        const onDisconnect = (reason: string) => {
            setIsConnected(false);
            setConnectionError(`Disconnected: ${reason}`);
        };

        const onConnectError = (err: Error) => {
            setConnectionError(`Connection Failed: ${err.message}`);
        };

        if (socketInstance.connected) {
            onConnect();
        }

        socketInstance.on("connect", onConnect);
        socketInstance.on("disconnect", onDisconnect);
        socketInstance.on("connect_error", onConnectError);

        return () => {
            socketInstance?.off("connect", onConnect);
            socketInstance?.off("disconnect", onDisconnect);
            socketInstance?.off("connect_error", onConnectError);
        };
    }, []);

    return { socket, isConnected, connectionError };
};
