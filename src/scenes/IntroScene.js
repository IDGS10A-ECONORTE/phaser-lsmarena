export default class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");

    this.videoKeys = ["intro1", "intro2"];
    this.currentIndex = 0;
  }

  preload() {
    this.load.video("intro1", "assets/cinematicas/Intro1.mp4");
    this.load.video("intro2", "assets/cinematicas/Intro2.mp4");
  }

  create() {
    this.cameras.main.setBackgroundColor("#000000");

    // Habilitar skip con clic
    this.input.on("pointerdown", () => this.skipVideo());

    this.playNextVideo();
  }

  playNextVideo() {
    const { width, height } = this.game.config;

    // Si ya no hay más videos → ir al menú
    if (this.currentIndex >= this.videoKeys.length) {
      this.goToMenu();
      return;
    }

    const key = this.videoKeys[this.currentIndex];

    // Destruir video anterior
    if (this.currentVideo) {
      this.currentVideo.stop();
      this.currentVideo.destroy();
      this.currentVideo = null;
    }

    // Crear video
    this.currentVideo = this.add
      .video(width / 2, height / 2, key)
      .setOrigin(0.5);

    const videoElement = this.currentVideo.video;

    // ❗ Silenciar
    videoElement.muted = true;
    videoElement.volume = 0;

    // Ajustar tamaño al canvas
    const setFillCanvasSize = () => {
      this.currentVideo.setDisplaySize(width, height);
    };

    videoElement.onloadedmetadata = setFillCanvasSize;
    setFillCanvasSize();

    // Cuando termine → pasar a siguiente video
    this.currentVideo.once("complete", () => {
      this.currentIndex++;
      this.playNextVideo();
    });

    this.currentVideo.play(false); // sin loop
  }

  /** Saltar video con clic */
  skipVideo() {
    // Si estamos en el último video → ir al menú
    if (this.currentIndex >= this.videoKeys.length - 1) {
      this.goToMenu();
      return;
    }

    // Sino, pasar al siguiente video
    this.currentIndex++;
    this.playNextVideo();
  }

  goToMenu() {
    if (this.currentVideo) {
      this.currentVideo.stop();
      this.currentVideo.destroy();
    }

    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "MainMenuScene",
      });
    });
  }
}
