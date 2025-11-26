import SequenceManager from "/src/modules/SequenceManager.js";
import {
  initWebcam,
  stopWebcam,
  showWebcam,
  setVideoPositionResponsive,
} from "/src/utils/webcam.js";

export default class Minigame3Scene extends Phaser.Scene {
  constructor() {
    super("Minigame3Scene");
    this.sequenceManager = null;
    this.videoElement = null;
    this.fireSprites = [];
    this.firesExtinguished = 0;
    this.roundsCompletedInMinigame = 0;
  }

  preload() {
    this.load.image("minigame3Bg", "assets/104.png");
    this.load.image("minigame3Fire", "assets/iconos/51.png");
    this.load.image("successFx", "assets/iconos/OK.png");
    this.load.image("failFx", "assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config;
    this.firesExtinguished = 0;
    this.roundsCompletedInMinigame = 0;

    // ⭐ AÑADIR ESTO: Reiniciar las estadísticas del juego si no estás en modo competición
    if (!this.registry.get("competitionMode")) {
      this.registry.set("gameStats", {
        correct: 0,
        incorrect: 0,
        total: 0,
        accuracy: 0,
      });
    }

    this.add
      .image(0, 0, "minigame3Bg")
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setDepth(-10);

    this.initPlayerWebcam();

    const difficulty = this.registry.get("selectedDifficulty") || "easy";

    this.sequenceManager = new SequenceManager(this, difficulty, (result) => {
      this.handleSequenceResult(result);
    });

    this.createFireSprites();

    // Contador regresivo 3, 2, 1 antes de iniciar
    this.startCountdown(() => {
      // Modo normal para nivel 3
      this.sequenceManager.start(false);
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

    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    this.registry.set("gameStats", stats);

    this.showResultFX(result.status);

    // ⭐ AÑADIR: Incrementar el contador local para este minijuego
    this.roundsCompletedInMinigame++;

    this.time.delayedCall(1000, () => {
      if (this.roundsCompletedInMinigame >= 10) {
        this.finishMinigame();
      } else {
        this.sequenceManager.start();
      }
    });
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

    if (result === "ok") {
      this.extinguishFire();
    }
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

        this.scene.stop(this.scene.key);

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

  createFireSprites() {
    const { width, height } = this.game.config;
    this.fireSprites = [];

    const columns = 4;
    const rows = 2;

    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        const sprite = this.add
          .image(
            (width * (col + 1)) / (columns + 1),
            height * 0.4 + row * 150,
            "minigame3Fire"
          )
          .setScale(Phaser.Math.FloatBetween(0.8, 1.4))
          .setDepth(-9)
          .setAlpha(0.9);

        this.fireSprites.push(sprite);
      }
    }

    this.firesExtinguished = 0;
  }

  extinguishFire() {
    const remaining = this.fireSprites.filter((sprite) => sprite.alpha > 0.1);
    if (remaining.length === 0) {
      this.createFireSprites();
      return;
    }

    const sprite = remaining[Phaser.Math.Between(0, remaining.length - 1)];

    this.tweens.add({
      targets: sprite,
      alpha: 0.1,
      scale: sprite.scale * 0.5,
      duration: 600,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          alpha: 0,
          duration: 400,
        });
      },
    });
  }
}
