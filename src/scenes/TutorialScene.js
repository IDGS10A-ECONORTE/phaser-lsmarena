import { tutorialDialogs } from "/src/scenes/dialogs/tutorialdialog.js";
import SequenceManager from "/src/modules/SequenceManager.js";

import {
  initWebcam,
  setVideoPosition,
  stopWebcam,
  showWebcam,
  hideWebcam,
} from "/src/utils/webcam.js";

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super("TutorialScene");

    this.currentStep = 0;
    this.videoElement = null;
    this.sequenceManager = null;
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
    this.load.image("successFx", "assets/OK.png");
    this.load.image("failFx", "assets/OKNT.png");
    this.load.image("timeoutFx", "assets/TIME.png");
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
      if (stream) {
        this.videoElement = stream;

        const { width, height } = this.game.config;
        setVideoPosition(width - 340, height - 260, 320, 240);
        showWebcam();
      }
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
    const { width, height } = this.game.config;

    // Ocultar diálogo
    this.tutorialContainer.setVisible(false);

    // Crear SequenceManager (dificultad easy)
    this.sequenceManager = new SequenceManager(
      this,
      "easy",
      (result) => this.onSequenceResult(result) // callback
    );

    this.sequenceManager.start();
  }

  // 🔥 Efectos visuales dependiendo del resultado
  onSequenceResult(result) {
    let fxKey = "failFx";

    if (result === "success") fxKey = "successFx";
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

    // Siguiente en la secuencia
    this.time.delayedCall(1000, () => {
      this.sequenceManager.start();
    });
  }

  shutdown() {
    stopWebcam();
  }
}
