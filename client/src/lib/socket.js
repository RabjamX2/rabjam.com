import { io } from "socket.io-client";
import { browser } from "$app/environment";
import { PUBLIC_API_URL } from "$lib/config";

let socket = null;

export function getSocket(accessToken) {
    if (!browser) {
        return { emit: () => {}, on: () => {}, off: () => {}, connect: () => {}, disconnect: () => {} };
    }
    if (!socket) {
        const socketUrl = PUBLIC_API_URL || undefined;
        socket = io(socketUrl, {
            autoConnect: false,
            auth: { token: accessToken },
        });

        socket.on("connect", () => console.log("Socket connected"));
        socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));
        socket.on("connect_error", (err) => console.error("Socket error:", err.message));
    } else if (accessToken) {
        // Update token if it changed (e.g. after refresh)
        socket.auth = { token: accessToken };
    }
    return socket;
}
