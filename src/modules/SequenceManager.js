// =============================================================
//  SequenceManager.js – versión con lógica de score por dificultad
// =============================================================
import SocketClient from "/src/modules/socketClient.js";
import { captureWebcamFrame } from "/src/utils/webcam.js";

import easy from "/src/data/easydiff.js";
import medium from "/src/data/normaldiff.js";
import hard from "/src/data/harddiff.js";

export default class SequenceManager {
  constructor(scene, difficulty = "easy", onResult = () => {}) {
    this.scene = scene;
    this.difficulty = difficulty;
    this.onResult = onResult;

    // Crear el socket y registrar el callback ANTES de que se conecte
    // Usar handlers para registrar el callback inmediatamente
    this.socket = new SocketClient("ws://localhost:7777", {
      onConnected: () => {
        console.log("[SequenceManager] WS listo");
      },
      // Registrar el callback desde los handlers para que esté disponible desde el inicio
      onValidationResult: (data) => {
        console.log("[SequenceManager] Callback de validación recibido (desde handlers)");
        this.handleValidationResult(data);
      },
    });

    // También registrar con el método explícito por si acaso
    this.socket.onValidationResult((data) => {
      console.log("[SequenceManager] Callback de validación recibido (método explícito)");
      this.handleValidationResult(data);
    });
    
    console.log("[SequenceManager] Callback registrado después de constructor:", !!this.socket._validationCallback);

    // Timer según dificultad
    this.timerLimit =
      difficulty === "hard" ? 6 : difficulty === "medium" ? 8 : 10;

    // Score mínimo según dificultad (en porcentaje: easy=91, medium=93, hard=95)
    this.scoreThreshold =
      difficulty === "hard" ? 95 : difficulty === "medium" ? 93 : 91;

    this.currentItem = null;
    this.isWaitingResponse = false;
    this.timerEvent = null;
    this.frameInterval = null; // Intervalo para enviar frames cada 400ms
    
    // Mejor score recibido durante el intento (para evaluar al final si no se alcanzó el threshold)
    this.bestScore = 0;

    this.signImage = null;
    this.signText = null;
    this.timerText = null;

    this.sequence = this.selectDataset();

    // Log raw WS messages
    this.socket.onMessage((msg) => this.handleSocketMessage(msg));
  }

  // =============================================================
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

  // =============================================================
  async start() {
    // Limpiar eventos anteriores
    if (this.timerEvent) this.timerEvent.remove(false);
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Resetear el mejor score
    this.bestScore = 0;

    // Asegurar que el callback esté registrado antes de empezar
    if (!this.socket._validationCallback) {
      console.warn("[SequenceManager] Callback no registrado, registrándolo ahora");
      this.socket.onValidationResult((data) => {
        console.log("[SequenceManager] Callback de validación recibido (registrado en start)");
        this.handleValidationResult(data);
      });
    }

    this.currentItem =
      this.sequence[Math.floor(Math.random() * this.sequence.length)];

    this.showSign(this.currentItem);

    // Esperar conexión WebSocket
    await this.socket.waitForConnection();

    // Verificar que el callback sigue registrado después de la conexión
    console.log("[SequenceManager] Callback registrado después de conexión:", !!this.socket._validationCallback);

    // Establecer la seña objetivo en el servidor
    this.socket.setTargetSign(this.currentItem.id);

    // Iniciar el timer
    this.startTimer();

    // Iniciar el envío de frames cada 400ms
    this.startFrameCapture();
  }

  // =============================================================
  showSign(item) {
    const { width, height } = this.scene.game.config;

    const useSquare = Math.random() > 0.5;
    const textureKey = useSquare
      ? `sign_${item.id}_square`
      : `sign_${item.id}_circle`;

    if (!this.signImage) {
      this.signImage = this.scene.add
        .image(width / 2, height * 0.45, textureKey)
        .setOrigin(0.5)
        .setScale(0.85);
    } else {
      this.signImage.setTexture(textureKey);
    }

    if (!this.signText) {
      this.signText = this.scene.add
        .text(width / 2, height * 0.75, item.word, {
          fontFamily: "Arial",
          fontSize: "42px",
          color: "#ffff00",
          align: "center",
        })
        .setOrigin(0.5);
    } else {
      this.signText.setText(item.word);
    }

    if (!this.timerText) {
      this.timerText = this.scene.add
        .text(width / 2, height * 0.15, "", {
          fontFamily: "Arial",
          fontSize: "56px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
    }
  }

  // =============================================================
  // Inicia el envío de frames cada 400ms
  startFrameCapture() {
    this.isWaitingResponse = true;

    // Enviar el primer frame inmediatamente
    this.sendFrame();

    // Continuar enviando frames cada 400ms
    this.frameInterval = setInterval(() => {
      if (this.isWaitingResponse) {
        this.sendFrame();
      } else {
        // Si ya no estamos esperando respuesta, detener el envío
        if (this.frameInterval) {
          clearInterval(this.frameInterval);
          this.frameInterval = null;
        }
      }
    }, 400);
  }

  // =============================================================
  // Captura y envía un frame de la webcam al servidor
  sendFrame() {
    if (!this.socket || !this.isWaitingResponse) return;

    // Obtener el elemento de video
    const videoElement = document.getElementById("player-webcam");
    if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      console.warn("[SequenceManager] Video no listo para capturar");
      return;
    }

    // Crear un canvas temporal para capturar el frame
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Enviar imagen al servidor (el servidor espera type: "image" con image_data)
    this.socket.sendImageToWS(canvas);
  }


  // =============================================================
  // Maneja los mensajes RAW del WebSocket (para logging)
  handleSocketMessage(msg) {
    // Solo para logging, el procesamiento real está en handleValidationResult
    try {
      const data = JSON.parse(msg);
      if (data.hasOwnProperty("result") && data.hasOwnProperty("score")) {
        console.log("[SequenceManager] Respuesta del servidor:", data);
      }
    } catch (err) {
      // Ignorar errores de parsing aquí
    }
  }

  // =============================================================
  // Maneja los resultados de validación del servidor
  handleValidationResult(data) {
    console.log("[SequenceManager] handleValidationResult llamado:", data);
    console.log("[SequenceManager] isWaitingResponse:", this.isWaitingResponse);

    if (!this.isWaitingResponse) {
      console.log("[SequenceManager] Ignorando respuesta, ya no estamos esperando");
      return;
    }

    // El servidor responde con: { result, feedback, target, score }
    // score es un porcentaje (0-100)
    const score = data.score || 0;

    console.log(
      `[SequenceManager] SCORE=${score}, threshold=${this.scoreThreshold}, comparación: ${score >= this.scoreThreshold ? "OK" : "NO OK"}`
    );

    // IMPORTANTE: Ignorar respuestas con score = 0 (mano no detectada)
    // Solo procesar cuando hay un score válido >= threshold
    if (score === 0) {
      console.log("[SequenceManager] Ignorando respuesta con score=0 (mano no detectada), continuando...");
      return; // Continuar esperando más respuestas
    }

    // Guardar el mejor score recibido (para evaluar al final si no se alcanza el threshold)
    if (score > this.bestScore) {
      this.bestScore = score;
      console.log(`[SequenceManager] Nuevo mejor score: ${this.bestScore}`);
    }

    // Solo procesar si el score es >= threshold (éxito) - terminar inmediatamente
    if (score >= this.scoreThreshold) {
      console.log("[SequenceManager] ✅ Score válido detectado, procesando resultado");
      
      // Evaluar el resultado
      const result = this.evaluateResult(data);

      console.log("[SequenceManager] Resultado evaluado:", result);

      // Detener el envío de frames y el timer
      this.isWaitingResponse = false;
      if (this.frameInterval) {
        clearInterval(this.frameInterval);
        this.frameInterval = null;
      }
      if (this.timerEvent) {
        this.timerEvent.remove(false);
        this.timerEvent = null;
      }

      this.finishSequence(result);
      return;
    }

    // Si el score es > 0 pero < threshold, seguimos intentando
    // Al final del tiempo, evaluaremos el bestScore para decidir OKNT o TIMEOUT
    if (score > 0 && score < this.scoreThreshold) {
      console.log(`[SequenceManager] Score insuficiente (${score} < ${this.scoreThreshold}), continuando intentos...`);
      // No terminamos, seguimos esperando más respuestas o timeout
      return;
    }
  }

  // =============================================================
  // AQUI SE DECIDE OK / OKNT / TIME
  // =============================================================
  evaluateResult(data) {
    // El servidor envía score como porcentaje (0-100)
    const score = data.score || 0;

    console.log(`[SequenceManager] Evaluando: score=${score}, threshold=${this.scoreThreshold}`);

    // OK: score >= threshold (easy=85, medium=90, hard=94)
    if (score >= this.scoreThreshold) {
      console.log("[SequenceManager] ✅ RESULTADO: OK");
      return {
        status: "ok",
        score,
        expected: this.currentItem.id,
      };
    }

    // OKNT: score > 0 pero < threshold (gesto detectado pero insuficiente)
    if (score > 0 && score < this.scoreThreshold) {
      console.log("[SequenceManager] ⚠️ RESULTADO: OKNT");
      return {
        status: "oknt",
        score,
        expected: this.currentItem.id,
      };
    }

    // TIMEOUT: score = 0 (no se detectó gesto o falla total)
    console.log("[SequenceManager] ❌ RESULTADO: TIMEOUT");
    return {
      status: "timeout",
      score: 0,
      expected: this.currentItem.id,
    };
  }

  // =============================================================
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
          console.log("[SequenceManager] ⏰ Tiempo agotado, finalizando secuencia");
          console.log(`[SequenceManager] Mejor score recibido: ${this.bestScore}`);
          
          // Detener el envío de frames
          this.isWaitingResponse = false;
          if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
          }

          // Al finalizar por timeout, evaluar el mejor score recibido
          let result;
          if (this.bestScore > 0 && this.bestScore < this.scoreThreshold) {
            // Hubo intentos pero no se alcanzó el threshold → OKNT
            result = {
              status: "oknt",
              score: this.bestScore,
              expected: this.currentItem.id,
            };
            console.log("[SequenceManager] ⚠️ Resultado final: OKNT (score insuficiente)");
          } else {
            // No hubo intentos válidos o score = 0 → TIMEOUT
            result = {
              status: "timeout",
              score: 0,
              expected: this.currentItem.id,
            };
            console.log("[SequenceManager] ❌ Resultado final: TIMEOUT (sin gestos válidos)");
          }

          this.finishSequence(result);
        }
      },
    });
  }

  // =============================================================
  finishSequence(result) {
    // Limpiar eventos
    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Detener el objetivo en el servidor
    this.socket.stopTarget();

    console.log("[SequenceManager] RESULT:", result);

    this.onResult(result);
  }

  // =============================================================
  // Limpiar recursos al destruir el SequenceManager
  destroy() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    if (this.timerEvent) {
      this.timerEvent.remove(false);
      this.timerEvent = null;
    }
    this.socket.stopTarget();
    this.socket.disconnect();
  }
}
