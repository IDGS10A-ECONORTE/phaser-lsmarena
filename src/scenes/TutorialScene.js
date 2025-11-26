import { tutorialDialogs } from "/src/scenes/dialogs/tutorialdialog.js";
import SequenceManager from "/src/modules/SequenceManager.js";

import {
  initWebcam,
  stopWebcam,
  showWebcam,
  hideWebcam,
  setVideoPositionResponsive,
} from "/src/utils/webcam.js";

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super("TutorialScene");

    this.currentStep = 0;
    this.videoElement = null;
    this.sequenceManager = null;
    this.sequenceCount = 0;
    this.startPractice = false;
    this.dialogTimerEvent = null;

    // Propiedades para referencias de limpieza (NECESARIO para evitar bugs de reinicio)
    this.resizeListener = null;
    this.fullscreenListener = null;
  }

  preload() {
    // Fondo tutorial
    this.load.image("tutorialBg", "assets/105.png"); // Cinemática

    this.load.video(
      "tutorialIntro",
      "assets/cinematicas/Tutorial.mp4",
      "loadeddata",
      false,
      true
    ); // Imágenes de diálogos

    tutorialDialogs.forEach((step) => {
      step.characterImgs.forEach((img) =>
        this.load.image(img, `assets/personajes/Xochitl/${img}.png`)
      );
      step.signImgs.forEach((img) =>
        this.load.image(img, `assets/signos/${img}.png`)
      );
    }); // Feedback visual

    this.load.image("successFx", "assets/iconos/OK.png");
    this.load.image("failFx", "assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config; // Fondo negro inicial

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0); // Introducción en video

    const introVideo = this.add
      .video(width / 2, height / 2, "tutorialIntro")
      .setOrigin(0.5);

    introVideo.setMute(true);
    introVideo.play(false);

    // ⭐ CORRECCIÓN PRINCIPAL: Usar el evento 'complete' de Phaser.
    introVideo.on("complete", () => {
      // Aseguramos la limpieza del listener de salto (clic)
      this.input.removeAllListeners("pointerdown");
      introVideo.destroy();
      this.initTutorial();
    }); // Listener para saltar el video (clic/touch)

    this.input.once("pointerdown", () => {
      // Detenemos el evento 'complete' si el usuario salta el video
      introVideo.off("complete");
      introVideo.stop();
      introVideo.destroy(); // Delay de 50ms para evitar la doble activación del primer diálogo
      this.time.delayedCall(50, () => {
        this.initTutorial();
      });
    }); // Webcam jugador

    this.initPlayerWebcam(); // Listener de pausa (ESC)

    this.escKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    this.escKey.on("down", () => {
      if (this.scene.isPaused()) return;

      this.scene.pause();

      this.scene.launch("PauseMenuScene", {
        fromSceneKey: this.scene.key,
      });
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
      showWebcam(); // ⭐ MODIFICACIÓN: Almacenar las funciones de listener para limpieza

      this.resizeListener = () => {
        setVideoPositionResponsive(camW, camH, margin);
      };

      this.fullscreenListener = () => {
        setVideoPositionResponsive(camW, camH, margin);
      }; // se adapta al redimensionar la ventana

      window.addEventListener("resize", this.resizeListener); // se adapta al cambiar a fullscreen

      document.addEventListener("fullscreenchange", this.fullscreenListener);
    });
  }

  initTutorial() {
    const { width, height } = this.game.config; // Fondo tutorial

    this.add
      .image(0, 0, "tutorialBg")
      .setOrigin(0)
      .setDisplaySize(width, height); // UI de diálogo

    this.tutorialContainer = this.add.container(0, 0);

    this.showStep(this.currentStep); // Clic → siguiente línea

    this.input.on("pointerdown", () => this.nextStep());
  }

  showStep(stepIndex) {
    const step = tutorialDialogs[stepIndex];

    if (this.dialogTimerEvent) {
      this.dialogTimerEvent.remove();
      this.dialogTimerEvent = null;
    }

    const charImg =
      step.characterImgs[Math.floor(Math.random() * step.characterImgs.length)];
    const signImg =
      step.signImgs[Math.floor(Math.random() * step.signImgs.length)];

    const { width, height } = this.game.config;
    const characterX = width * 0.18;
    const characterY = height * 0.6;
    const dialogWidth = width * 0.38;
    const dialogHeight = height * 0.28;
    const dialogX = width * 0.42;
    const dialogY = height * 0.62;
    const wrapWidth = dialogWidth - 80;
    const rightX = width * 0.74;

    if (!this.characterSprite) {
      // Personaje
      this.characterSprite = this.add
        .sprite(characterX, characterY, charImg)
        .setOrigin(0.5, 0.5)
        .setScale(Math.min(width, height) / 1400);

      this.tutorialContainer.add(this.characterSprite); // Fondo y texto de diálogo

      this.dialogueBg = this.add
        .rectangle(dialogX, dialogY, dialogWidth, dialogHeight, 0x000000, 0.65)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xffff88, 0.4);

      this.dialogueText = this.add
        .text(dialogX, dialogY, step.dialogue, {
          fontFamily: "Montserrat",
          fontSize: "30px",
          color: "#ffffff",
          lineSpacing: 6,
          align: "left",
          wordWrap: { width: wrapWidth },
        })
        .setOrigin(0.5);

      this.tutorialContainer.add([this.dialogueBg, this.dialogueText]); // Seña

      this.signImg = this.add
        .image(rightX, height * 0.45, signImg)
        .setOrigin(0.5)
        .setScale(Math.min(width, height) / 1300);

      this.transcriptionText = this.add
        .text(
          rightX,
          this.signImg.y + this.signImg.displayHeight / 2 + 30,
          step.transcription,
          {
            fontFamily: "Montserrat",
            fontSize: "30px",
            color: "#ffff00",
            align: "center",
            wordWrap: { width: width * 0.22 },
          }
        )
        .setOrigin(0.5, 0);

      this.tutorialContainer.add([this.signImg, this.transcriptionText]);
    } else {
      this.characterSprite
        .setTexture(charImg)
        .setPosition(characterX, characterY)
        .setScale(Math.min(width, height) / 1400);

      this.dialogueBg
        .setPosition(dialogX, dialogY)
        .setSize(dialogWidth, dialogHeight);

      this.dialogueText
        .setText(step.dialogue)
        .setPosition(dialogX, dialogY)
        .setFontFamily("Montserrat")
        .setFontSize(30)
        .setWordWrapWidth(wrapWidth);

      this.signImg
        .setTexture(signImg)
        .setPosition(rightX, height * 0.45)
        .setScale(Math.min(width, height) / 1300);

      this.transcriptionText
        .setText(step.transcription)
        .setPosition(
          rightX,
          this.signImg.y + this.signImg.displayHeight / 2 + 30
        );
    }

    this.dialogTimerEvent = this.time.delayedCall(3500, () => {
      this.nextStep();
    });
  }

  nextStep() {
    if (this.dialogTimerEvent) {
      this.dialogTimerEvent.remove();
      this.dialogTimerEvent = null;
    }
    this.currentStep++;

    if (this.currentStep >= tutorialDialogs.length) {
      this.startSequenceExercise();
      return;
    }

    this.showStep(this.currentStep);
  } // 🔥 Donde inicia el SequenceManager

  startSequenceExercise() {
    // Ocultar diálogo
    this.tutorialContainer.setVisible(false);

    // Limpieza de temporizador final del diálogo
    if (this.dialogTimerEvent) {
      this.dialogTimerEvent.remove();
      this.dialogTimerEvent = null;
    } // IMPORTANTE: remover los eventos que pasan de diálogos

    this.input.removeAllListeners(); // Inicializar práctica

    this.startPractice = true;
    this.sequenceCount = 0;

    const difficulty = this.registry.get("selectedDifficulty") || "easy"; // Crear SequenceManager

    this.sequenceManager = new SequenceManager(this, difficulty, (result) => {
      this.handleSequenceResult(result);
    });

    this.sequenceManager.start();
  }

  handleSequenceResult(result) {
    console.log("[Sequence Result]", result); // Incrementar contador de secuencias

    if (this.startPractice) {
      this.sequenceCount++;
      console.log(
        `[TutorialScene] Secuencias completadas: ${this.sequenceCount}/10`
      );
    } // Reusar exactamente los FX visuales ya existentes

    this.onSequenceResult(result.status, result.resultScore);
  } // 🔥 Efectos visuales dependiendo del resultado

  onSequenceResult(result, score = 0) {
    let fxKey = "failFx";

    if (result === "ok") fxKey = "successFx";
    else if (result === "timeout") fxKey = "timeoutFx";

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

    const nextActionDelay = 1000;

    if (this.startPractice) {
      if (result === "ok") {
        this.time.delayedCall(nextActionDelay, () => {
          console.log(
            `[TutorialScene] Captura enviada al servidor después de ${nextActionDelay}ms (Score: ${score})`
          );

          if (this.sequenceCount >= 10) {
            this.showContinueDialog();
          } else {
            this.sequenceManager.start();
          }
        });
      } else {
        this.time.delayedCall(nextActionDelay, () => {
          if (this.sequenceCount >= 10) {
            this.showContinueDialog();
          } else {
            this.sequenceManager.start();
          }
        });
      }
    }
  } // ... (showContinueDialog, continuePractice, goToMinigameHub sin cambios) ...

  showContinueDialog() {
    const { width, height } = this.game.config; // Pausar el SequenceManager
    if (this.sequenceManager) {
      this.sequenceManager.isWaitingResponse = false;
      if (this.sequenceManager.frameInterval) {
        clearInterval(this.sequenceManager.frameInterval);
        this.sequenceManager.frameInterval = null;
      }
      if (this.sequenceManager.timerEvent) {
        this.sequenceManager.timerEvent.remove(false);
        this.sequenceManager.timerEvent = null;
      }
    } // Fondo semitransparente

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setOrigin(0.5)
      .setInteractive(); // Contenedor del diálogo

    const dialogContainer = this.add.container(width / 2, height / 2); // Fondo del diálogo

    const dialogBg = this.add
      .rectangle(0, 0, 600, 300, 0x1a1a1a, 0.95)
      .setStrokeStyle(3, 0xffff00)
      .setOrigin(0.5); // Texto principal

    const mainText = this.add
      .text(0, -80, "¿Deseas seguir practicando?", {
        fontFamily: "Arial",
        fontSize: "36px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5); // Texto secundario

    const subText = this.add
      .text(0, -30, "Completaste 10 secuencias", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffff00",
        align: "center",
      })
      .setOrigin(0.5); // Botón SÍ

    const yesBg = this.add
      .rectangle(-150, 60, 200, 80, 0x00aa00, 0.8)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0.5)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", () => {
        this.continuePractice();
        overlay.destroy();
        dialogContainer.destroy();
      })
      .on("pointerover", () => yesBg.setFillStyle(0x00ff00, 0.9))
      .on("pointerout", () => yesBg.setFillStyle(0x00aa00, 0.8));

    const yesText = this.add
      .text(-150, 60, "SÍ", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5); // Botón NO

    const noBg = this.add
      .rectangle(150, 60, 200, 80, 0xaa0000, 0.8)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0.5)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", () => {
        this.goToMinigameHub();
        overlay.destroy();
        dialogContainer.destroy();
      })
      .on("pointerover", () => noBg.setFillStyle(0xff4444, 0.9))
      .on("pointerout", () => noBg.setFillStyle(0xaa0000, 0.8));

    const noText = this.add
      .text(150, 60, "NO", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    dialogContainer.add([
      dialogBg,
      mainText,
      subText,
      yesBg,
      yesText,
      noBg,
      noText,
    ]);
  } // ... (continuePractice, goToMinigameHub sin cambios) ...
  shutdown() {
    // Detener la webcam y limpiar el stream
    stopWebcam();

    // ⭐ LIMPIEZA VITAL: Remover los listeners globales de la ventana/documento
    // (Asegúrate de que initPlayerWebcam almacene estas referencias)
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
      this.resizeListener = null;
    }
    if (this.fullscreenListener) {
      document.removeEventListener("fullscreenchange", this.fullscreenListener);
      this.fullscreenListener = null;
    }

    // Limpieza de temporizadores de diálogo
    if (this.dialogTimerEvent) {
      this.dialogTimerEvent.remove();
      this.dialogTimerEvent = null;
    }

    // Limpieza del SequenceManager
    if (this.sequenceManager && this.sequenceManager.destroy) {
      this.sequenceManager.destroy();
    }
  }
}
