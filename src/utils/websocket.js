let socket = null;

export function initWebSocket(url = "ws://localhost:7777") {
    return new Promise((resolve, reject) => {
        try {
            socket = new WebSocket(url);

            socket.onopen = () => {
                console.log("WebSocket connected:", url);
                resolve(socket);
            };

            socket.onerror = (err) => {
                console.error("WebSocket error:", err);
                reject(err);
            };

        } catch (err) {
            console.error("WebSocket initialization failed:", err);
            reject(err);
        }
    });
}

export function sendWS(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    } else {
        console.warn("WebSocket not connected");
    }
}

export function getSocket() {
    return socket;
}
