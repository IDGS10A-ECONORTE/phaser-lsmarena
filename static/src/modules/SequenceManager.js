// =============================================================
//  SequenceManager.js – versión con lógica de score por dificultad
// =============================================================
import SocketClient from "/static/src/modules/socketClient.js";
// import { captureWebcamFrame } from "/static/src/data/src/utils/webcam.js";

import easy from "/static/src/data/easydiff.js";
import medium from "/static/src/data/normaldiff.js";
import hard from "/static/src/data/harddiff.js";
import words from "/static/src/data/words.js";

export default class SequenceManager {
  constructor(
    scene,
    difficulty = "easy",
    onResult = () => {},
    spellingWordCallback = null
  ) {
    this.scene = scene;
    this.difficulty = difficulty;
    this.onResult = onResult;
    this.spellingWordCallback =
      typeof spellingWordCallback === "function" ? spellingWordCallback : null;
    
    // Modo deletreo
    this.spellingMode = false;
    this.currentWord = null;
    this.currentLetterIndex = 0;
    this.lettersSequence = [];

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
    this.wordText = null; // Para modo deletreo (interno)
    this.spellingHintText = null; // Para modo deletreo (interno)
    this.currentLetterText = null; // Para modo deletreo (interno)
    this.useExternalSignDisplay = false;

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
  async start(spellingMode = false, forcedItem = null) {
    // Limpiar eventos anteriores
    if (this.timerEvent) this.timerEvent.remove(false);
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Resetear el mejor score
    this.bestScore = 0;

    // Configurar modo deletreo
    this.spellingMode = spellingMode;

    // Asegurar que el callback esté registrado antes de empezar
    if (!this.socket._validationCallback) {
      console.warn("[SequenceManager] Callback no registrado, registrándolo ahora");
      this.socket.onValidationResult((data) => {
        console.log("[SequenceManager] Callback de validación recibido (registrado en start)");
        this.handleValidationResult(data);
      });
    }

    if (spellingMode) {
      // Modo deletreo: seleccionar palabra y preparar secuencia de letras
      await this.startSpelling();
    } else {
      // Modo normal: seleccionar item (forzado o aleatorio)
      this.currentItem =
        forcedItem ||
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
  }

  // =============================================================
  // Inicia el modo deletreo
  async startSpelling() {
    // Seleccionar palabra aleatoria
    this.currentWord = words[Math.floor(Math.random() * words.length)];
    console.log(`[SequenceManager] Palabra seleccionada para deletrear: ${this.currentWord}`);

    // Convertir palabra en secuencia de letras usando el dataset easy
    this.lettersSequence = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      const letter = this.currentWord[i].toUpperCase();
      // Buscar la letra en el dataset easy (puede ser número o letra)
      const letterItem = easy.find(item => {
        const itemId = item.id.toLowerCase();
        const itemWord = item.word.toUpperCase();
        return itemId === letter.toLowerCase() || itemWord === letter || itemWord.includes(letter);
      });
      if (letterItem) {
        this.lettersSequence.push(letterItem);
      } else {
        console.warn(`[SequenceManager] Letra "${letter}" no encontrada en el dataset`);
      }
    }

    if (this.lettersSequence.length === 0) {
      console.error("[SequenceManager] No se encontraron letras para deletrear");
      // Fallback: usar modo normal
      this.spellingMode = false;
      this.currentItem = this.sequence[Math.floor(Math.random() * this.sequence.length)];
      this.showSign(this.currentItem);
      await this.socket.waitForConnection();
      this.socket.setTargetSign(this.currentItem.id);
      this.startTimer();
      this.startFrameCapture();
      return;
    }

    // Mostrar la palabra completa primero
    if (this.spellingWordCallback || this.useExternalSignDisplay) {
      this.spellingWordCallback(this.currentWord);
    } else {
      this.showWord(this.currentWord);
    }

    // Esperar conexión WebSocket
    await this.socket.waitForConnection();
    
    // Iniciar deletreo después de 2 segundos
    this.scene.time.delayedCall(2000, () => {
      this.currentLetterIndex = 0;
      this.startNextLetter();
    });
  }

  // =============================================================
  // Muestra la palabra completa
  showWord(word) {
    const { width, height } = this.scene.game.config;

    // Mostrar la palabra completa
    if (this.spellingWordCallback || this.useExternalSignDisplay) {
      // UI manejada externamente
      return;
    }

    if (!this.wordText) {
      this.wordText = this.scene.add
        .text(width / 2, height * 0.3, word, {
          fontFamily: "Arial",
          fontSize: "64px",
          color: "#ffff00",
          align: "center",
        })
        .setOrigin(0.5);
    } else {
      this.wordText.setText(word);
    }

    // Texto indicador
    if (!this.spellingHintText) {
      this.spellingHintText = this.scene.add
        .text(width / 2, height * 0.4, "Deletrea la palabra", {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5);
    }
  }

  // =============================================================
  // Inicia la siguiente letra del deletreo
  async startNextLetter() {
    if (this.currentLetterIndex >= this.lettersSequence.length) {
      // Deletreo completado
      console.log("[SequenceManager] Deletreo completado");
      this.finishSpelling();
      return;
    }

    // Limpiar eventos anteriores
    if (this.timerEvent) this.timerEvent.remove(false);
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Resetear el mejor score para esta letra
    this.bestScore = 0;

    // Obtener la letra actual
    this.currentItem = this.lettersSequence[this.currentLetterIndex];
    
    // Mostrar la letra actual
    this.showSign(this.currentItem);

    // Mostrar indicador de letra actual
    if (!this.spellingWordCallback) {
      if (!this.currentLetterText) {
        const { width, height } = this.scene.game.config;
        this.currentLetterText = this.scene.add
          .text(
            width / 2,
            height * 0.5,
            `Letra ${this.currentLetterIndex + 1} de ${this.lettersSequence.length}`,
            {
              fontFamily: "Arial",
              fontSize: "28px",
              color: "#00ff00",
              align: "center",
            }
          )
          .setOrigin(0.5);
      } else {
        this.currentLetterText.setText(
          `Letra ${this.currentLetterIndex + 1} de ${this.lettersSequence.length}`
        );
      }
    }

    // Establecer la seña objetivo en el servidor
    this.socket.setTargetSign(this.currentItem.id);

    // Iniciar el timer
    this.startTimer();

    // Iniciar el envío de frames cada 400ms
    this.startFrameCapture();
  }

  // =============================================================
  // Finaliza el deletreo
  finishSpelling() {
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

    // Resultado del deletreo (por ahora siempre éxito si se completó)
    const result = {
      status: "ok",
      score: 100,
      expected: this.currentWord,
      spellingCompleted: true,
    };

    if (this.spellingWordCallback) {
      this.spellingWordCallback(null);
    }

    console.log("[SequenceManager] Deletreo finalizado:", result);
    this.onResult(result);
  }

  // =============================================================
  showSign(item) {
    if (this.useExternalSignDisplay) {
      if (this.signImage) {
        this.signImage.destroy();
        this.signImage = null;
      }
      if (this.signText) {
        this.signText.destroy();
        this.signText = null;
      }
      return;
    }

    const { width, height } = this.scene.game.config;

    const useSquare = Math.random() > 0.5;
    const textureKey = useSquare
      ? `sign_${item.id}_square`
      : `sign_${item.id}_circle`;

    if (!this.signImage) {
      this.signImage = this.scene.add
        .image(width / 2, height * 0.42, textureKey)
        .setOrigin(0.5)
        .setScale(0.85);
    } else {
      this.signImage
        .setTexture(textureKey)
        .setPosition(width / 2, height * 0.42);
    }

    if (!this.signText) {
      this.signText = this.scene.add
        .text(width / 2, height * 0.62, item.word, {
          fontFamily: "Montserrat",
          fontSize: "52px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 6,
          align: "center",
        })
        .setOrigin(0.5);
    } else {
      this.signText
        .setText(item.word)
        .setFontFamily("Montserrat")
        .setFontSize(52)
        .setStroke("#000000", 6)
        .setY(height * 0.62);
    }

    if (!this.timerText) {
      this.timerText = this.scene.add
        .text(width / 2, height * 0.15, "", {
          fontFamily: "Montserrat",
          fontSize: "56px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
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

      // Si está en modo deletreo, pasar a la siguiente letra
      if (this.spellingMode) {
        this.currentLetterIndex++;
        this.scene.time.delayedCall(500, () => {
          this.startNextLetter();
        });
        return;
      }

      // Modo normal: evaluar y terminar
      const result = this.evaluateResult(data);
      console.log("[SequenceManager] Resultado evaluado:", result);
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

    if (!this.timerText) {
      const { width, height } = this.scene.game.config;
      this.timerText = this.scene.add
        .text(width / 2, height * 0.15, "", {
          fontFamily: "Montserrat",
          fontSize: "56px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
          align: "center",
        })
        .setOrigin(0.5);
    }

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

          // Si está en modo deletreo, pasar a la siguiente letra aunque haya timeout
          if (this.spellingMode) {
            this.currentLetterIndex++;
            this.scene.time.delayedCall(500, () => {
              this.startNextLetter();
            });
            return;
          }

          // Modo normal: evaluar el mejor score recibido
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
  // Configura si una escena externa muestra la seña actual
  setExternalSignDisplay(flag = true) {
    this.useExternalSignDisplay = flag;
    if (flag) {
      if (this.signImage) {
        this.signImage.destroy();
        this.signImage = null;
      }
      if (this.signText) {
        this.signText.destroy();
        this.signText = null;
      }
    }
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
