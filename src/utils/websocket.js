let ws = null;

export function initWebSocket(url = "ws://localhost:7777") {
    ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("WebSocket conectado a", url);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("WS recibido:", data);
            // Aquí podemos disparar eventos dentro de Phaser
            // ej: 'sign_correct', 'sign_incorrect', 'feedback'
        } catch (e) {
            console.error("WS parse error:", e);
        }
    };

    ws.onclose = () => console.log("WebSocket cerrado");
    ws.onerror = (err) => console.error("WebSocket error:", err);
}

export function sendImageToWS(canvas) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Obtener frame en base64 del canvas de la webcam
    const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

    ws.send(JSON.stringify({
        type: "image",
        image_data: imageBase64
    }));
}

export function setTargetSign(signName) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
        type: "set_target",
        sign: signName
    }));
}

export function stopTarget() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: "stop_target" }));
}
