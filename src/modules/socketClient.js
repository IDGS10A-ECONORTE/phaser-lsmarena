// socketClient.js
export default class SocketClient {
    /**
     * @param {string} url - ws://localhost:7777
     * @param {object} handlers - callbacks opcionales
     */
    constructor(url, handlers = {}) {
        this.url = url;
        this.ws = null;

        this.onConnected = handlers.onConnected || (() => {});
        this.onDisconnected = handlers.onDisconnected || (() => {});
        this.onError = handlers.onError || (() => {});
        this.onValidationResult = handlers.onValidationResult || (() => {});

        this.reconnectDelay = 1500;
        this.shouldReconnect = true;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("[WS] Conectado al servidor");
            this.onConnected();
        };

        this.ws.onclose = () => {
            console.warn("[WS] Desconectado del servidor");
            this.onDisconnected();

            if (this.shouldReconnect) {
                console.log("[WS] Reintentando conexión…");
                setTimeout(() => this.connect(), this.reconnectDelay);
            }
        };

        this.ws.onerror = (err) => {
            console.error("[WS] Error:", err);
            this.onError(err);
        };

        this.ws.onmessage = (msg) => {
            this.handleMessage(msg.data);
        };
    }

    /**
     * Maneja mensajes entrantes desde el backend
     */
    handleMessage(data) {
        try {
            const parsed = JSON.parse(data);

            /*
                Esperado desde el backend:
                {
                    success: boolean,
                    message: "¡Seña Correcta! Similitud: 97%",
                    score: 97.0
                }
            */

            if (parsed.type === "validation_result") {
                this.onValidationResult(parsed);
            }
        } catch (e) {
            console.error("[WS] Error al parsear mensaje:", e);
        }
    }

    /**
     * Envía un frame o snapshot para validar la seña actual
     * @param {string} signID - "A", "B", "HOLA", etc.
     * @param {string} base64Image - Frame capturado
     */
    sendFrameForValidation(signID, base64Image) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const packet = {
            type: "validate_sign",
            sign: signID,
            image: base64Image
        };

        this.ws.send(JSON.stringify(packet));
    }

    /**
     * Cierra la conexión y detiene reconexiones automáticas
     */
    disconnect() {
        this.shouldReconnect = false;
        if (this.ws) this.ws.close();
    }
}
