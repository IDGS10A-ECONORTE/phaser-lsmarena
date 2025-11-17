import { tutorialDialogs } from "/src/scenes/dialogs/tutorialdialog.js";
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
  }

  preload() {
    // Fondo y video introductorio
    this.load.image("tutorialBg", "assets/105.png");
    this.load.video(
      "tutorialIntro",
      "assets/cinematicas/Tutorial.mp4",
      "loadeddata",
      false,
      true // permitir autoplay en algunos navegadores
    );

    // Cargar imágenes de personajes y señas
    tutorialDialogs.forEach((step) => {
      step.characterImgs.forEach((img) =>
        this.load.image(img, `assets/personajes/Xochitl/${img}.png`)
      );
      step.signImgs.forEach((img) =>
        this.load.image(img, `assets/signos/${img}.png`)
      );
    });
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo negro mientras se reproduce el video
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Video introductorio centrado, tamaño original
    const introVideo = this.add
      .video(width / 2, height / 2, "tutorialIntro")
      .setOrigin(0.5);

    introVideo.setMute(true); // silenciar
    introVideo.play(false); // reproducir una sola vez

    // Detectar fin del video
    introVideo.video.onended = () => {
      introVideo.destroy();
      this.initTutorial();
    };

    // Permitir saltar el video con clic
    this.input.once("pointerdown", () => {
      introVideo.stop();
      introVideo.destroy();
      this.initTutorial();
    });
    // Inicializar webcam (async separado)
    this.initPlayerWebcam();
  }

  initPlayerWebcam() {
    initWebcam(320, 240).then((stream) => {
      if (stream) {
        this.videoElement = stream;
        const { width, height } = this.game.config;
        setVideoPosition(width - 340, height - 260, 320, 240); // esquina inferior derecha
        showWebcam();
      }
    });
  }

  initTutorial() {
    const { width, height } = this.game.config;

    // Fondo de la escena
    this.add
      .image(0, 0, "tutorialBg")
      .setOrigin(0)
      .setDisplaySize(width, height);

    // Contenedor principal
    this.tutorialContainer = this.add.container(0, 0);

    // Inicializar primer paso
    this.showStep(this.currentStep);

    // Avanzar con clic
    this.input.on("pointerdown", () => this.nextStep());
  }

  showStep(stepIndex) {
    const step = tutorialDialogs[stepIndex];

    // Selección aleatoria de imagen de personaje y seña
    const charImg =
      step.characterImgs[Math.floor(Math.random() * step.characterImgs.length)];
    const signImg =
      step.signImgs[Math.floor(Math.random() * step.signImgs.length)];

    const { width, height } = this.game.config;

    if (!this.characterSprite) {
      // Personaje Xochitl al 80% de escala, a la izquierda
      this.characterSprite = this.add
        .sprite(100, height / 2, charImg)
        .setOrigin(0, 0.5)
        .setScale(0.8);
      this.tutorialContainer.add(this.characterSprite);

      // Diálogo sobre las piernas de Xochitl
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
        .setOrigin(0.5, 0.5);

      this.dialogueText = this.add
        .text(this.dialogueBg.x, this.dialogueBg.y, step.dialogue, {
          fontFamily: "Arial",
          fontSize: "28px",
          color: "#ffffff",
          wordWrap: { width: 360 },
          align: "center",
        })
        .setOrigin(0.5, 0.5);

      this.tutorialContainer.add([this.dialogueBg, this.dialogueText]);

      // Signo y transcripción a la derecha
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
      // Actualizar imágenes y texto
      this.characterSprite.setTexture(charImg);

      const dialogY =
        this.characterSprite.y + this.characterSprite.displayHeight / 2 - 20;
      this.dialogueBg.setY(dialogY);
      this.dialogueText.setY(dialogY).setText(step.dialogue);

      this.signImg.setTexture(signImg);
      this.transcriptionText.setText(step.transcription);
    }
  }

  nextStep() {
    this.currentStep++;
    if (this.currentStep >= tutorialDialogs.length) {
      // Tutorial finalizado, usar TransitionScene
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "MinigameHubScene",
      });
      return;
    }

    this.showStep(this.currentStep);
  }

  shutdown() {
    stopWebcam();
  }
}
