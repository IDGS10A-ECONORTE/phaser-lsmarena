export default class SocketClient {
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

  waitForConnection() {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WS] No se puede enviar, socket no abierto");
      return;
    }

    this.ws.send(data);
  }

  /** NUEVO ➜ Permite registrar mensajes brutos */
  onMessage(callback) {
    const original = this.ws.onmessage;

    this.ws.onmessage = (msg) => {
      callback(msg.data);
      if (original) original(msg);
    };
  }

  handleMessage(data) {
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === "validation_result") {
        this.onValidationResult(parsed);
      }
    } catch (e) {
      console.error("[WS] Error al parsear mensaje:", e);
    }
  }

  sendFrameForValidation(signID, base64Image) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const packet = {
      type: "validate_sign",
      sign: signID,
      image: base64Image,
    };

    this.ws.send(JSON.stringify(packet));
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) this.ws.close();
  }
}
