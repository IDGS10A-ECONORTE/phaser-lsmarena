import { tutorialDialogs } from "/src/scenes/dialogs/tutorialdialog.js";

export default class TutorialScene extends Phaser.Scene {
  constructor() {
    super("TutorialScene");
    this.currentStep = 0;
  }

  preload() {
    const { width, height } = this.game.config;

    // Fondo y video introductorio
    this.load.image("tutorialBg", "assets/105.png");
    this.load.video(
      "tutorialIntro",
      "assets/cinematicas/Tutorial.mp4",
      "loadeddata",
      false
    );

    // Cargar imágenes de personajes y señas desde tutorialDialogs
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

    // ----------------------
    // VIDEO INTRO
    // ----------------------
    const introVideo = this.add
      .video(width / 2, height / 2, "tutorialIntro")
      .setOrigin(0.5); // No escalar, mantener tamaño nativo

    // Reproducir el video HTML5 una sola vez
    introVideo.video.loop = false;
    introVideo.play();

    // Detectar fin del video usando el objeto HTMLVideoElement
    introVideo.video.onended = () => {
      introVideo.destroy();
      this.initTutorial();
    };

    // Opción: permitir saltar el video con clic
    this.input.once("pointerdown", () => {
      introVideo.stop();
      introVideo.destroy();
      this.initTutorial();
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
      // Personaje Xochitl
      this.characterSprite = this.add
        .sprite(150, height / 2 + 50, charImg)
        .setOrigin(0, 0.5);
      this.tutorialContainer.add(this.characterSprite);

      // Globo de diálogo
      this.dialogueBg = this.add
        .rectangle(400, height / 2 - 100, 600, 150, 0x000000, 0.6)
        .setOrigin(0, 0);
      this.dialogueText = this.add
        .text(420, height / 2 - 80, step.dialogue, {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#ffffff",
          wordWrap: { width: 560 },
        })
        .setOrigin(0, 0);
      this.tutorialContainer.add([this.dialogueBg, this.dialogueText]);

      // Seña y transcripción
      this.signImg = this.add
        .image(width - 300, height / 2, signImg)
        .setOrigin(0.5);
      this.transcriptionText = this.add
        .text(width - 300, height / 2 + 180, step.transcription, {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#ffff00",
        })
        .setOrigin(0.5, 0);
      this.tutorialContainer.add([this.signImg, this.transcriptionText]);
    } else {
      // Actualizar imágenes y texto
      this.characterSprite.setTexture(charImg);
      this.dialogueText.setText(step.dialogue);
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
}
