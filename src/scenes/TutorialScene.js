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
    this.sequenceCount = 0; // Contador de secuencias completadas
    this.startPractice = false; // Flag para indicar que comenzó la práctica
  }

  preload() {
    // Fondo tutorial
    this.load.image("tutorialBg", "assets/105.png");

    // Cinemática
    this.load.video(
      "tutorialIntro",
      "assets/cinematicas/Tutorial.mp4",
      "loadeddata",
      false,
      true
    );

    // Imágenes de diálogos
    tutorialDialogs.forEach((step) => {
      step.characterImgs.forEach((img) =>
        this.load.image(img, `assets/personajes/Xochitl/${img}.png`)
      );
      step.signImgs.forEach((img) =>
        this.load.image(img, `assets/signos/${img}.png`)
      );
    });

    // Feedback visual
    this.load.image("successFx", "assets/iconos/OK.png");
    this.load.image("failFx", "assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo negro inicial
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Introducción en video
    const introVideo = this.add
      .video(width / 2, height / 2, "tutorialIntro")
      .setOrigin(0.5);

    introVideo.setMute(true);
    introVideo.play(false);

    introVideo.video.onended = () => {
      introVideo.destroy();
      this.initTutorial();
    };

    this.input.once("pointerdown", () => {
      introVideo.stop();
      introVideo.destroy();
      this.initTutorial();
    });

    // Webcam jugador
    this.initPlayerWebcam();
  }

  initPlayerWebcam() {
    initWebcam(320, 240).then((stream) => {
      if (!stream) return;

      this.videoElement = stream;

      const camW = 320;
      const camH = 240;
      const margin = 24;

      // primera posición
      setVideoPositionResponsive(camW, camH, margin);
      showWebcam();

      // se adapta al redimensionar la ventana
      window.addEventListener("resize", () => {
        setVideoPositionResponsive(camW, camH, margin);
      });

      // se adapta al cambiar a fullscreen
      document.addEventListener("fullscreenchange", () => {
        setVideoPositionResponsive(camW, camH, margin);
      });
    });
  }

  initTutorial() {
    const { width, height } = this.game.config;

    // Fondo tutorial
    this.add
      .image(0, 0, "tutorialBg")
      .setOrigin(0)
      .setDisplaySize(width, height);

    // UI de diálogo
    this.tutorialContainer = this.add.container(0, 0);

    this.showStep(this.currentStep);

    // Clic → siguiente línea
    this.input.on("pointerdown", () => this.nextStep());
  }

  showStep(stepIndex) {
    const step = tutorialDialogs[stepIndex];

    const charImg =
      step.characterImgs[Math.floor(Math.random() * step.characterImgs.length)];
    const signImg =
      step.signImgs[Math.floor(Math.random() * step.signImgs.length)];

    const { width, height } = this.game.config;

    if (!this.characterSprite) {
      // Personaje
      this.characterSprite = this.add
        .sprite(100, height / 2, charImg)
        .setOrigin(0, 0.5)
        .setScale(0.8);

      this.tutorialContainer.add(this.characterSprite);

      // Fondo y texto de diálogo
      const dialogY =
        this.characterSprite.y + this.characterSprite.displayHeight / 2 - 20;

      this.dialogueBg = this.add
        .rectangle(
          this.characterSprite.x + this.characterSprite.displayWidth / 2,
          dialogY,
          400,
          100,
          0x000000,
          0.6
        )
        .setOrigin(0.5);

      this.dialogueText = this.add
        .text(this.dialogueBg.x, this.dialogueBg.y, step.dialogue, {
          fontFamily: "Arial",
          fontSize: "28px",
          color: "#ffffff",
          wordWrap: { width: 360 },
          align: "center",
        })
        .setOrigin(0.5);

      this.tutorialContainer.add([this.dialogueBg, this.dialogueText]);

      // Seña
      const rightX = width * 0.65;

      this.signImg = this.add
        .image(rightX, height / 2 - 50, signImg)
        .setOrigin(0.5);

      this.transcriptionText = this.add
        .text(
          rightX,
          this.signImg.y + this.signImg.displayHeight / 2 + 20,
          step.transcription,
          {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#ffff00",
            align: "center",
          }
        )
        .setOrigin(0.5, 0);

      this.tutorialContainer.add([this.signImg, this.transcriptionText]);
    } else {
      this.characterSprite.setTexture(charImg);

      const dialogY =
        this.characterSprite.y + this.characterSprite.displayHeight / 2 - 20;

      this.dialogueBg.setY(dialogY);
      this.dialogueText.setText(step.dialogue).setY(dialogY);

      this.signImg.setTexture(signImg);
      this.transcriptionText.setText(step.transcription);
    }
  }

  nextStep() {
    this.currentStep++;

    if (this.currentStep >= tutorialDialogs.length) {
      this.startSequenceExercise();
      return;
    }

    this.showStep(this.currentStep);
  }

  // 🔥 Donde inicia el SequenceManager
  startSequenceExercise() {
    // Ocultar diálogo
    this.tutorialContainer.setVisible(false);

    // IMPORTANTE: remover los eventos que pasan de diálogos
    this.input.removeAllListeners();
    
    // Inicializar práctica
    this.startPractice = true;
    this.sequenceCount = 0;
    
    const difficulty = this.registry.get("difficulty") || "easy";
    // Crear SequenceManager
    this.sequenceManager = new SequenceManager(this, difficulty, (result) => {
      this.handleSequenceResult(result);
    });

    this.sequenceManager.start();
  }

  handleSequenceResult(result) {
    console.log("[Sequence Result]", result);

    // Incrementar contador de secuencias
    if (this.startPractice) {
      this.sequenceCount++;
      console.log(`[TutorialScene] Secuencias completadas: ${this.sequenceCount}/10`);
    }

    // Reusar exactamente los FX visuales ya existentes
    this.onSequenceResult(result.status);
  }

  // 🔥 Efectos visuales dependiendo del resultado
  onSequenceResult(result) {
    let fxKey = "failFx"; // Por defecto OKNT

    // Mapear los estados del SequenceManager a los FX
    if (result === "ok") fxKey = "successFx";
    else if (result === "timeout") fxKey = "timeoutFx";
    // "oknt" usa failFx por defecto

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

    // Verificar si se completaron 10 secuencias
    if (this.startPractice && this.sequenceCount >= 10) {
      // Esperar un poco antes de mostrar el diálogo
      this.time.delayedCall(1500, () => {
        this.showContinueDialog();
      });
    } else {
      // Siguiente en la secuencia
      this.time.delayedCall(1000, () => {
        this.sequenceManager.start();
      });
    }
  }

  // 🔥 Diálogo para preguntar si desea continuar practicando
  showContinueDialog() {
    const { width, height } = this.game.config;

    // Pausar el SequenceManager
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
    }

    // Fondo semitransparente
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setOrigin(0.5)
      .setInteractive();

    // Contenedor del diálogo
    const dialogContainer = this.add.container(width / 2, height / 2);

    // Fondo del diálogo
    const dialogBg = this.add
      .rectangle(0, 0, 600, 300, 0x1a1a1a, 0.95)
      .setStrokeStyle(3, 0xffff00)
      .setOrigin(0.5);

    // Texto principal
    const mainText = this.add
      .text(0, -80, "¿Deseas seguir practicando?", {
        fontFamily: "Arial",
        fontSize: "36px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Texto secundario
    const subText = this.add
      .text(0, -30, "Completaste 10 secuencias", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffff00",
        align: "center",
      })
      .setOrigin(0.5);

    // Botón SÍ
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
      .on("pointerover", () => yesBg.setTint(0x00ff00))
      .on("pointerout", () => yesBg.clearTint());

    const yesText = this.add
      .text(-150, 60, "SÍ", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Botón NO
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
      .on("pointerover", () => noBg.setTint(0xff0000))
      .on("pointerout", () => noBg.clearTint());

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
  }

  // 🔥 Continuar practicando (resetear contador y continuar)
  continuePractice() {
    console.log("[TutorialScene] Continuando práctica...");
    this.sequenceCount = 0; // Resetear contador
    this.time.delayedCall(500, () => {
      this.sequenceManager.start();
    });
  }

  // 🔥 Ir al hub de minijuegos
  goToMinigameHub() {
    console.log("[TutorialScene] Finalizando práctica, yendo a MinigameHubScene");
    this.startPractice = false;
    
    // Limpiar recursos
    if (this.sequenceManager) {
      this.sequenceManager.destroy();
      this.sequenceManager = null;
    }
    
    // Ir a MinigameHubScene
    this.scene.start("MinigameHubScene");
  }

  shutdown() {
    stopWebcam();
  }
}
