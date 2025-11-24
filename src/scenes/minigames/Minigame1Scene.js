import SequenceManager from "/src/modules/SequenceManager.js";
import {
  initWebcam,
  stopWebcam,
  showWebcam,
  setVideoPositionResponsive,
} from "/src/utils/webcam.js";

export default class Minigame1Scene extends Phaser.Scene {
  constructor() {
    super("Minigame1Scene");
    this.sequenceManager = null;
    this.videoElement = null;
  }

  preload() {
    // Feedback visual (mismos que TutorialScene)
    this.load.image("successFx", "assets/iconos/OK.png");
    this.load.image("failFx", "assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo (ajustar según assets disponibles)
    // this.add.image(0, 0, "minigame1Bg").setOrigin(0).setDisplaySize(width, height);

    // Inicializar webcam
    this.initPlayerWebcam();

    // Obtener dificultad del registry
    const difficulty = this.registry.get("selectedDifficulty") || "easy";

    // Crear SequenceManager
    this.sequenceManager = new SequenceManager(this, difficulty, (result) => {
      this.handleSequenceResult(result);
    });

    // Contador regresivo 3, 2, 1 antes de iniciar
    this.startCountdown(() => {
      // Modo deletreo para nivel 1
      this.sequenceManager.start(true);
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
      .setAlpha(0);

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
    // En modo deletreo, solo contar cuando se completa toda la palabra
    if (this.sequenceManager.spellingMode && result.spellingCompleted) {
      // Palabra completada en modo deletreo
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

      // Mostrar FX visual
      this.showResultFX(result.status);

      // Continuar o terminar
      this.time.delayedCall(1000, () => {
        if (stats.total >= 10) {
          this.finishMinigame();
        } else {
          // Reiniciar con nueva palabra
          this.sequenceManager.start(true);
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

      // Calcular precisión
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

      this.registry.set("gameStats", stats);

      // Mostrar FX visual
      this.showResultFX(result.status);

      // Continuar o terminar
      this.time.delayedCall(1000, () => {
        // Por ahora, después de 10 secuencias, terminar el minijuego
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
      .setAlpha(0);

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

    // Limpiar recursos
    if (this.sequenceManager) {
      this.sequenceManager.destroy();
      this.sequenceManager = null;
    }

    // Determinar si ganó o perdió (por ejemplo, si accuracy >= 70% gana)
    const won = stats.accuracy >= 70;

    if (competitionMode) {
      // Modo competencia: verificar si hay más niveles
      stats.levelsCompleted++;
      this.registry.set("gameStats", stats);

      if (competitionMode.currentLevel < competitionMode.endLevel) {
        // Pasar al siguiente nivel
        competitionMode.currentLevel++;
        this.registry.set("competitionMode", competitionMode);
        this.scene.start("TransitionScene", {
          fromScene: this.scene.key,
          toScene: `Minigame${competitionMode.currentLevel}Scene`,
        });
        return;
      }
    }

    // Terminar: ir a Victory o Defeat
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
}

