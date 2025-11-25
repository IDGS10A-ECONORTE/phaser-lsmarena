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
    this.completedSpellingRounds = 0;
    this.maxSpellingRounds = 4;
  }

  preload() {
    this.load.image("minigame1Bg", "assets/105.png");
    // Feedback visual (mismos que TutorialScene)
    this.load.image("successFx", "assets/iconos/OK.png");
    this.load.image("failFx", "assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo
    this.add
      .image(0, 0, "minigame1Bg")
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setDepth(-10);

    // Inicializar webcam
    this.initPlayerWebcam();

    // Obtener dificultad del registry
    const difficulty = this.registry.get("selectedDifficulty") || "easy";

    // ⭐ AÑADIR: Reinicio de estadísticas para partidas no-competición
    if (!this.registry.get("competitionMode")) {
      this.registry.set("gameStats", {
        correct: 0,
        incorrect: 0,
        total: 0,
        accuracy: 0,
      });
    }

    // Crear SequenceManager
    this.sequenceManager = new SequenceManager(
      this,
      difficulty,
      (result) => {
        this.handleSequenceResult(result);
      },
      (word) => this.updateSpellingWordDisplay(word)
    );

    this.createSpellingWordDisplay();

    this.completedSpellingRounds = 0;

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
    // En modo deletreo, se ejecuta por cada letra/secuencia.
    if (this.sequenceManager.spellingMode) {
      // Mostrar FX por letra
      // La información del comando actual (letra) debería estar en 'result'
      // Si la letra es correcta, muestra 'successFx'
      if (result.status === "ok") {
        // ⭐ CAMBIO 1: Mostrar FX por cada letra correcta
        this.showResultFX(
          result.status,
          result.currentLetter || result.expectedSign
        );
      } else {
        this.showResultFX(result.status);
      }

      if (result.spellingCompleted) {
        // Palabra completada en modo deletreo

        // **Actualización de Estadísticas (Solo cuando la palabra se completa)**
        const stats = this.registry.get("gameStats") || {
          correct: 0,
          incorrect: 0,
          total: 0,
          accuracy: 0,
        };

        stats.total++;
        // NOTA: Asumo que el 'result.status' final de la palabra es "ok" si se completó correctamente,
        // o "fail" si hubo errores en alguna letra. El SequenceManager debe dar este status final.
        if (result.status === "ok") {
          stats.correct++;
        } else {
          stats.incorrect++;
        }

        stats.accuracy =
          stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        this.registry.set("gameStats", stats);

        // ⭐ CAMBIO 2: Mostrar FX de éxito de la palabra completa, incluyendo la palabra
        // Nota: El `result.word` debe ser la palabra que se deletreó.
        const wordCompleted = this.sequenceManager.currentWord; // Asumo que el manager tiene la palabra actual
        this.showResultFX(result.status, wordCompleted);

        this.completedSpellingRounds++;

        // Continuar o terminar (con delay de 1000ms después del FX)
        this.time.delayedCall(1000, () => {
          if (this.completedSpellingRounds >= this.maxSpellingRounds) {
            this.finishMinigame();
          } else {
            // Reiniciar con nueva palabra
            this.sequenceManager.start(true);
          }
        });
        return;
      }

      // ⭐ AÑADIR: Delay de 1 segundo después de cada comando completado
      // Si la letra no completó la palabra, añade el delay y continúa.
      this.time.delayedCall(1000, () => {
        this.sequenceManager.start(true);
      });
      return;
    }

    // Modo normal (sin cambios relevantes solicitados)
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
      stats.accuracy =
        stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

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

  // ⭐ CAMBIO 3: La función ahora acepta un texto opcional (la palabra)
  showResultFX(result, optionalText = null) {
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

    let textFx = null;
    if (optionalText) {
      textFx = this.add
        .text(width / 2, height / 2, optionalText.toUpperCase(), {
          fontFamily: "Arial",
          fontSize: "64px",
          color: "#00ff00",
          stroke: "#000000",
          strokeThickness: 5,
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(9)
        .setAlpha(0);

      // Mover el texto ligeramente por debajo del FX de imagen
      textFx.y += 100;
    }

    this.tweens.add({
      targets: fx,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => {
        fx.destroy();
        if (textFx) textFx.destroy();
      },
    });

    // Animación para el texto opcional (si existe)
    if (textFx) {
      this.tweens.add({
        targets: textFx,
        alpha: 1,
        duration: 300,
        yoyo: true,
        hold: 400,
      });
    }
  }

  finishMinigame() {
    const stats = this.registry.get("gameStats");
    const competitionMode = this.registry.get("competitionMode");

    // Limpiar recursos
    if (this.sequenceManager) {
      this.sequenceManager.destroy();
      this.sequenceManager = null;
    }

    // ⭐ AÑADIR: Detener la escena antes de empezar la transición
    this.scene.stop(this.scene.key);

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

  createSpellingWordDisplay() {
    const { width, height } = this.game.config;
    this.wordDisplay = this.add
      .text(width / 2, height * 0.15, "", {
        fontFamily: "Arial",
        fontSize: "72px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);
    this.wordDisplayTween = null;
  }

  updateSpellingWordDisplay(word) {
    if (!this.wordDisplay) return;

    if (this.wordDisplayTween) {
      this.wordDisplayTween.stop();
      this.wordDisplayTween = null;
    }

    if (word) {
      this.wordDisplay
        .setText(`DELETREA: ${word}`.toUpperCase())
        .setAlpha(1)
        .setScale(1);

      this.wordDisplayTween = this.tweens.add({
        targets: this.wordDisplay,
        alpha: 0,
        delay: 1500,
        duration: 400,
        ease: "Quad.easeOut",
      });
    } else {
      this.wordDisplay.setAlpha(0);
    }
  }
}
