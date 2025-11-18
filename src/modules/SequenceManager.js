// =============================================================
//  SequenceManager.js - Versión ajustada a tu servidor QDRANT
// =============================================================
import SocketClient from "/src/modules/socketClient.js";

import easy from "/src/data/easydiff.js";
import medium from "/src/data/normaldiff.js";
import hard from "/src/data/harddiff.js";

export default class SequenceManager {
  constructor(scene, difficulty = "easy", onResult = () => {}) {
    this.scene = scene;
    this.difficulty = difficulty;

    this.socket = new SocketClient("ws://localhost:7777", {
      onConnected: () => console.log("WS listo"),
      onValidationResult: (data) => this.handleValidation(data),
    });

    this.onResult = onResult;

    this.timerLimit =
      difficulty === "hard" ? 6 : difficulty === "medium" ? 8 : 10;

    this.currentItem = null;
    this.isWaitingResponse = false;
    this.timerEvent = null;

    // UI
    this.signImage = null;
    this.timerText = null;

    this.sequence = this.selectDataset();

    // Escucha mensajes del WebSocket
    this.socket.onMessage((msg) => this.handleSocketMessage(msg));
  }

  selectDataset() {
    switch (this.difficulty) {
      case "medium":
        return medium;
      case "hard":
        return hard;
      default:
        return easy;
    }
  }

  // ===========================
  // Iniciar ejercicio
  // ===========================
  start() {
    if (this.timerEvent) this.timerEvent.remove(false);

    this.currentItem =
      this.sequence[Math.floor(Math.random() * this.sequence.length)];

    this.showSign(this.currentItem);

    this.sendValidationRequest(this.currentItem.id);

    this.startTimer();
  }

  showSign(item) {
    const { width, height } = this.scene.game.config;

    if (!this.signImage) {
      this.signImage = this.scene.add
        .image(width * 0.5, height * 0.5, item.overlaySquare)
        .setOrigin(0.5)
        .setScale(0.85);
    } else {
      this.signImage.setTexture(item.overlaySquare);
    }

    if (!this.timerText) {
      this.timerText = this.scene.add.text(width * 0.5, height * 0.75, "", {
        fontFamily: "Arial",
        fontSize: "48px",
        color: "#ffffff",
      });
      this.timerText.setOrigin(0.5);
    }
  }

  // ===========================
  // Enviar solicitud de validación
  // ===========================
  sendValidationRequest(expectedId) {
    if (!this.socket) {
      console.error("Socket no inicializado");
      return;
    }

    this.isWaitingResponse = true;

    const payload = {
      type: "validate_sign",
      expected: expectedId,
    };

    this.socket.send(JSON.stringify(payload));
  }

  // ===========================
  // Procesar mensaje del servidor
  // ===========================
  handleSocketMessage(msg) {
    let data;

    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error("Mensaje inválido WS:", msg);
      return;
    }

    if (data.type !== "validation_result") return;

    if (!this.isWaitingResponse) return;

    this.isWaitingResponse = false;

    const result = {
      status: data.success ? "success" : "fail",
      message: data.message, // texto del servidor
      score: data.score, // número flotante
      expected: this.currentItem.id,
    };

    this.finishSequence(result);
  }

  // ===========================
  // Temporizador
  // ===========================
  startTimer() {
    let timeLeft = this.timerLimit;

    this.timerText.setText(timeLeft);

    this.timerEvent = this.scene.time.addEvent({
      delay: 1000,
      repeat: this.timerLimit - 1,
      callback: () => {
        timeLeft--;
        this.timerText.setText(timeLeft);

        if (timeLeft <= 0 && this.isWaitingResponse) {
          this.isWaitingResponse = false;

          const result = {
            status: "timeout",
            message: "Tiempo agotado",
            score: 0,
            expected: this.currentItem.id,
          };

          this.finishSequence(result);
        }
      },
    });
  }

  // ===========================
  // Terminar secuencia → devolver callback
  // ===========================
  finishSequence(result) {
    if (this.timerEvent) this.timerEvent.remove(false);

    // Pasar exactamente lo que la escena debe usar
    this.onResult(result);
  }
}
