export default class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");

    this.videoKeys = ["intro1", "intro2"];
    this.currentIndex = 0;
    this.extraImageKey = "extraImage";
    this.imageTimeout = null; // para el delayedCall
    this.imageSprite = null; // referencia a la imagen
  }

  preload() {
    this.load.video("intro1", "assets/cinematicas/Intro1.mp4");
    this.load.video("intro2", "assets/cinematicas/Intro2.mp4");
    this.load.image(this.extraImageKey, "assets/escenas/Diversidad.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#000000");

    // Habilitar skip con clic
    this.input.on("pointerdown", () => this.skipVideo());

    this.playNextVideo();
  }

  playNextVideo() {
    const { width, height } = this.game.config;

    if (this.currentIndex >= this.videoKeys.length) {
      this.showImageThenMenu();
      return;
    }

    const key = this.videoKeys[this.currentIndex];

    if (this.currentVideo) {
      this.currentVideo.stop();
      this.currentVideo.destroy();
      this.currentVideo = null;
    }

    this.currentVideo = this.add
      .video(width / 2, height / 2, key)
      .setOrigin(0.5);

    const videoElement = this.currentVideo.video;

    videoElement.muted = true;
    videoElement.volume = 0;

    const setFillCanvasSize = () => {
      this.currentVideo.setDisplaySize(width, height);
    };
    videoElement.onloadedmetadata = setFillCanvasSize;
    setFillCanvasSize();

    this.currentVideo.once("complete", () => {
      this.currentIndex++;
      this.playNextVideo();
    });

    this.currentVideo.play(false);
  }

  skipVideo() {
    // Si estamos mostrando la imagen, saltar imagen
    if (this.imageSprite) {
      this.skipImage();
      return;
    }

    if (this.currentIndex >= this.videoKeys.length - 1) {
      this.showImageThenMenu();
      return;
    }

    this.currentIndex++;
    this.playNextVideo();
  }

  showImageThenMenu() {
    const { width, height } = this.game.config;

    if (this.currentVideo) {
      this.currentVideo.stop();
      this.currentVideo.destroy();
      this.currentVideo = null;
    }

    this.imageSprite = this.add
      .image(width / 2, height / 2, this.extraImageKey)
      .setOrigin(0.5);

    this.imageSprite.setDisplaySize(width, height);

    // Hacer que clic en la imagen también salte
    this.input.once("pointerdown", () => this.skipImage());

    // delayedCall de 10 segundos
    this.imageTimeout = this.time.delayedCall(10000, () => this.skipImage());
  }

  skipImage() {
    if (this.imageTimeout) {
      this.imageTimeout.remove(false);
      this.imageTimeout = null;
    }

    if (this.imageSprite) {
      this.imageSprite.destroy();
      this.imageSprite = null;
    }

    this.goToMenu();
  }

  goToMenu() {
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "MainMenuScene",
      });
    });
  }
}
