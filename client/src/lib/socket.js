import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: {
        token: localStorage.getItem("token")
    }
});

export const connectSocket = (token) => {
    socket.auth.token = token;
    socket.connect();
};

export const disconnectSocket = () => {
    socket.disconnect();
};
