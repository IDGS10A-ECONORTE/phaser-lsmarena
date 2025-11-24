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

    // Callbacks para mensajes personalizados
    this.messageCallbacks = [];
    
    // Callback para resultados de validación (inicializado como null)
    this._validationCallback = null;
    
    // Si hay un handler de validación en los handlers, registrarlo inmediatamente
    if (handlers.onValidationResult && typeof handlers.onValidationResult === 'function') {
      this._validationCallback = handlers.onValidationResult;
      console.log("[WS] Callback de validación registrado desde handlers");
    }

    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] Conectado al servidor");
      console.log("[WS] Callback de validación disponible:", !!this._validationCallback);
      this.onConnected();
    };

    this.ws.onclose = () => {
      console.warn("[WS] Desconectado del servidor");
      this.onDisconnected();

      if (this.shouldReconnect) {
        console.log("[WS] Reintentando conexión…");
        // El callback se mantiene porque es propiedad de la instancia
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    };

    this.ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      this.onError(err);
    };

    this.ws.onmessage = (msg) => {
      // Ejecutar todos los callbacks registrados
      this.messageCallbacks.forEach((callback) => {
        try {
          callback(msg.data);
        } catch (e) {
          console.error("[WS] Error en callback:", e);
        }
      });
      // Manejar el mensaje normalmente
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

  /**
   * Registra un callback para recibir todos los mensajes RAW del WebSocket
   * @param {Function} callback - Función que recibe el mensaje raw (string)
   */
  onMessage(callback) {
    if (typeof callback === "function") {
      this.messageCallbacks.push(callback);
    }
  }

  handleMessage(data) {
    try {
      const parsed = JSON.parse(data);
      console.log("[WS][PARSED]:", parsed);

      // RESPUESTA DE VALIDACIÓN DEL SERVIDOR (formato: result, feedback, target, score)
      if (parsed.hasOwnProperty("result") && parsed.hasOwnProperty("score")) {
        console.log("[WS] Callback registrado:", !!this._validationCallback);
        if (this._validationCallback) {
          console.log("[WS] Llamando callback de validación");
          this._validationCallback(parsed);
        } else {
          console.warn("[WS] No hay callback de validación registrado");
        }
      }
      // VALIDATION RESULT (formato alternativo)
      else if (parsed.type === "validation_result") {
        if (this._validationCallback) {
          this._validationCallback(parsed);
        }
      }
    } catch (e) {
      console.error("[WS] Error al parsear mensaje:", e, " RAW:", data);
    }
  }

  /**
   * Envía un frame (imagen base64) para validación de una seña
   * @param {string} signID - ID de la seña a validar
   * @param {string} base64Image - Imagen en formato base64
   */
  sendFrameForValidation(signID, base64Image) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const packet = {
      type: "validate_sign",
      sign: signID,
      image: base64Image,
    };

    console.log("[WS][SEND VALIDATION]:", {
      signID,
      imageLength: base64Image.length,
    });

    this.ws.send(JSON.stringify(packet));
  }

  /**
   * Envía una imagen desde un canvas al WebSocket
   * @param {HTMLCanvasElement} canvas - Canvas del cual extraer la imagen
   */
  sendImageToWS(canvas) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Obtener frame en base64 del canvas
    const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

    this.ws.send(
      JSON.stringify({
        type: "image",
        image_data: imageBase64,
      })
    );
  }

  /**
   * Establece una seña objetivo en el servidor
   * @param {string} signName - Nombre de la seña objetivo
   */
  setTargetSign(signName) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: "set_target",
        sign: signName,
      })
    );
  }

  /**
   * Detiene el objetivo actual en el servidor
   */
  stopTarget() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({ type: "stop_target" }));
  }

  /**
   * Permite registrar un callback para recibir resultados de validación
   */
  onValidationResult(callback) {
    if (typeof callback === "function") {
      console.log("[WS] Registrando callback de validación");
      this._validationCallback = callback;
    } else {
      console.warn("[WS] Intento de registrar callback no válido:", typeof callback);
    }
  }

  /**
   * Desconecta el WebSocket y detiene la reconexión automática
   */
  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
