// =============================================================
//  SequenceManager.js – versión con lógica de score por dificultad
// =============================================================
import SocketClient from "/src/modules/socketClient.js";

import easy from "/src/data/easydiff.js";
import medium from "/src/data/normaldiff.js";
import hard from "/src/data/harddiff.js";

export default class SequenceManager {
  constructor(scene, difficulty = "easy", onResult = () => {}) {
    this.scene = scene;
    this.difficulty = difficulty;
    this.onResult = onResult;

    this.socket = new SocketClient("ws://localhost:7777", {
      onConnected: () => console.log("WS listo"),
      onValidationResult: (data) => this.handleValidation(data),
    });

    // Timer según dificultad
    this.timerLimit =
      difficulty === "hard" ? 6 : difficulty === "medium" ? 8 : 10;

    // Score mínimo según dificultad
    this.scoreThreshold =
      difficulty === "hard" ? 0.80 : difficulty === "medium" ? 0.70 : 0.60;

    this.currentItem = null;
    this.isWaitingResponse = false;
    this.timerEvent = null;

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
    if (this.timerEvent) this.timerEvent.remove(false);

    this.currentItem =
      this.sequence[Math.floor(Math.random() * this.sequence.length)];

    this.showSign(this.currentItem);

    await this.socket.waitForConnection();

    this.sendValidationRequest(this.currentItem.id);

    this.startTimer();
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
  sendValidationRequest(expectedId) {
  if (!this.socket) {
    console.error("Socket no inicializado");
    return;
  }

  this.isWaitingResponse = true;

  console.log("[SequenceManager] SET TARGET:", expectedId);

  // 1) Primero decirle al servidor cuál es la seña objetivo
  this.socket.setTargetSign(expectedId);

  // 2) Luego mandar el comando de validación
  const payload = {
    type: "validate_sign",
    expected: expectedId,
  };

  console.log("[SequenceManager] SEND VALIDATION:", payload);

  this.socket.send(JSON.stringify(payload));
}


  // =============================================================
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

    const result = this.evaluateResult(data);

    this.finishSequence(result);
  }

  // =============================================================
  // AQUI SE DECIDE OK / OKNT / TIME
  // =============================================================
  evaluateResult(data) {
    const score = data.score || 0;

    console.log(
      `[SequenceManager] SCORE=${score}, threshold=${this.scoreThreshold}`
    );

    if (score >= this.scoreThreshold) {
      return {
        status: "ok",
        score,
        expected: this.currentItem.id,
      };
    }

    // score insuficiente pero hubo gesto
    if (score > 0 && score < this.scoreThreshold) {
      return {
        status: "oknt",
        score,
        expected: this.currentItem.id,
      };
    }

    // no hubo gesto o falla total
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
          this.isWaitingResponse = false;

          const result = {
            status: "timeout",
            score: 0,
            expected: this.currentItem.id,
          };

          this.finishSequence(result);
        }
      },
    });
  }

  // =============================================================
  finishSequence(result) {
    if (this.timerEvent) this.timerEvent.remove(false);

    console.log("[SequenceManager] RESULT:", result);

    this.onResult(result);
  }
}
