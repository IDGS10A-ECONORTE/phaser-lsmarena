import SequenceManager from "/static/src/modules/SequenceManager.js";
import {
  initWebcam,
  stopWebcam,
  showWebcam,
  setVideoPositionResponsive,
} from "/static/src/utils/webcam.js";

export default class Minigame4Scene extends Phaser.Scene {
  constructor() {
    super("Minigame4Scene");
    this.sequenceManager = null;
    this.videoElement = null;
    this.completedSpellingRounds = 0;
    this.maxSpellingRounds = 10;
    this.wordDisplay = null;
    this.wordDisplayTween = null;
  }

  preload() {
    this.load.image("minigame4Bg", "/static/assets/110.png");
    this.load.image("successFx", "/static/assets/iconos/OK.png");
    this.load.image("failFx", "/static/assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "/static/assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config;

    this.add
      .image(0, 0, "minigame4Bg")
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setDepth(-10);

    this.initPlayerWebcam();

    const difficulty = this.registry.get("selectedDifficulty") || "easy";

    this.sequenceManager = new SequenceManager(this, difficulty, (result) =>
      this.handleSequenceResult(result)
    );
    this.sequenceManager.setExternalSignDisplay(true);

    this.completedSpellingRounds = 0;
    this.maxMemoryRounds = 10;
    this.createMemoryCardDisplay();

    // Contador regresivo 3, 2, 1 antes de iniciar
    this.startCountdown(() => {
      this.startMemoryRound();
    });

    // Este código va en la función create() de cada MinigameScene.
    this.escKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    this.escKey.on("down", () => {
      // Si ya estamos en pausa, ignorar
      if (this.scene.isPaused()) return;

      // Pausar la escena del minijuego
      this.scene.pause();

      // Lanzar la Escena de Pausa
      this.scene.launch("PauseMenuScene", {
        fromSceneKey: this.scene.key, // Envía la clave de la escena actual
      });
    });
  }

  startCountdown(onComplete) {
    const { width, height } = this.game.config;
    let count = 3;

    const instructionText = this.add
      .text(
        width / 2,
        height / 2 + 140,
        "Memoriza la seña y repítela cuando desaparezca",
        {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: width * 0.8 },
        }
      )
      .setOrigin(0.5)
      .setDepth(5);

    const countdownText = this.add
      .text(width / 2, height / 2, count.toString(), {
        fontFamily: "Arial",
        fontSize: "120px",
        color: "#ffff00",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(5);

    // Animación de entrada
    this.tweens.add({
      targets: countdownText,
      alpha: 1,
      scale: 1.5,
      duration: 200,
      yoyo: true,
      hold: 300,
    });

    const countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countdownText.setText(count.toString());
          this.tweens.add({
            targets: countdownText,
            alpha: 1,
            scale: 1.5,
            duration: 200,
            yoyo: true,
            hold: 300,
          });
        } else {
          // Mostrar "¡GO!" o desaparecer
          countdownText.setText("¡GO!");
          this.tweens.add({
            targets: countdownText,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              countdownText.destroy();
              instructionText.destroy();
              onComplete();
            },
          });
        }
      },
    });
  }

  initPlayerWebcam() {
    initWebcam(320, 240).then((stream) => {
      if (!stream) return;
      this.videoElement = stream;
      const camW = 320;
      const camH = 240;
      const margin = 24;
      setVideoPositionResponsive(camW, camH, margin);
      showWebcam();
      window.addEventListener("resize", () => {
        setVideoPositionResponsive(camW, camH, margin);
      });
      document.addEventListener("fullscreenchange", () => {
        setVideoPositionResponsive(camW, camH, margin);
      });
    });
  }

  handleSequenceResult(result) {
    if (this.isMemoryMode) {
      const stats = this.registry.get("gameStats") || {
        correct: 0,
        incorrect: 0,
        total: 0,
        accuracy: 0,
      };

      stats.total++;
      if (result.status === "ok") {
        stats.correct++;
      } else {
        stats.incorrect++;
      }

      stats.accuracy =
        stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      this.registry.set("gameStats", stats);

      // Mostrar FX visual
      this.showResultFX(result.status);

      this.completedSpellingRounds++;

      // Continuar o terminar
      this.time.delayedCall(1000, () => {
        if (this.completedSpellingRounds >= this.maxMemoryRounds) {
          this.finishMinigame();
        } else {
          this.startMemoryRound();
        }
      });
      return;
    }

    // Modo normal: actualizar estadísticas por cada secuencia
    if (!this.sequenceManager.spellingMode) {
      const stats = this.registry.get("gameStats") || {
        correct: 0,
        incorrect: 0,
        total: 0,
        accuracy: 0,
      };

      stats.total++;
      if (result.status === "ok") {
        stats.correct++;
      } else {
        stats.incorrect++;
      }

      stats.accuracy =
        stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      this.registry.set("gameStats", stats);

      this.showResultFX(result.status);

      this.time.delayedCall(1000, () => {
        if (stats.total >= 10) {
          this.finishMinigame();
        } else {
          this.sequenceManager.start(false);
        }
      });
    }
  }

  showResultFX(result) {
    const fxKey =
      result === "ok"
        ? "successFx"
        : result === "timeout"
        ? "timeoutFx"
        : "failFx";

    const { width, height } = this.game.config;

    const fx = this.add
      .image(width / 2, height / 2, fxKey)
      .setScale(0.8)
      .setAlpha(0)
      .setDepth(8);

    this.tweens.add({
      targets: fx,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => fx.destroy(),
    });
  }

  finishMinigame() {
    const stats = this.registry.get("gameStats");
    const competitionMode = this.registry.get("competitionMode");

    if (this.sequenceManager) {
      this.sequenceManager.destroy();
      this.sequenceManager = null;
    }

    const won = stats.accuracy >= 70;

    if (competitionMode) {
      stats.levelsCompleted++;
      this.registry.set("gameStats", stats);

      if (competitionMode.currentLevel < competitionMode.endLevel) {
        competitionMode.currentLevel++;
        this.registry.set("competitionMode", competitionMode);
        this.scene.start("TransitionScene", {
          fromScene: this.scene.key,
          toScene: `Minigame${competitionMode.currentLevel}Scene`,
        });
        return;
      }
    }

    if (won) {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "VictoryScene",
      });
    } else {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "DefeatScene",
      });
    }
  }

  shutdown() {
    stopWebcam();
    if (this.sequenceManager) {
      this.sequenceManager.destroy();
    }
  }

  createMemoryCardDisplay() {
    const { width, height } = this.game.config;
    this.cardTitle = this.add
      .text(width / 2, height * 0.18, "", {
        fontFamily: "Arial",
        fontSize: "64px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);
    this.cardImage = this.add
      .image(width / 2, height * 0.48, "successFx")
      .setDepth(6)
      .setAlpha(0);
    this.cardImageTween = null;
    this.isMemoryMode = true;
  }

  startMemoryRound() {
    const dataset = this.sequenceManager.sequence || [];
    if (!dataset.length) return;

    this.currentMemoryItem =
      dataset[Math.floor(Math.random() * dataset.length)];

    this.showMemoryCard(this.currentMemoryItem);

    this.time.delayedCall(1000, () => {
      this.hideMemoryCard();
      this.sequenceManager.start(false, this.currentMemoryItem);
    });
  }

  showMemoryCard(item) {
    const textureKey = `sign_${item.id}_square`;
    if (this.cardTitle) {
      this.cardTitle.setText(item.word || item.id).setAlpha(1);
    }

    if (this.cardImage) {
      this.cardImage.setTexture(textureKey);
      this.cardImage.setAlpha(1).setScale(0.9);
    }
  }

  hideMemoryCard() {
    if (this.cardTitle) {
      this.tweens.add({
        targets: this.cardTitle,
        alpha: 0,
        duration: 200,
      });
    }
    if (this.cardImage) {
      this.tweens.add({
        targets: this.cardImage,
        alpha: 0,
        duration: 200,
      });
    }
  }
}
