export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  preload() {
    // Carga el video de victoria
    this.load.video(
      "victoryVideo",
      "assets/cinematicas/victoria.mp4",
      "loadeddata",
      false,
      true
    );
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo negro
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Reproducir video centrado sin escalar
    const video = this.add
      .video(width / 2, height / 2, "victoryVideo")
      .setOrigin(0.5); // no escalar

    video.setMute(true); // silenciar
    video.play(false); // reproducir solo una vez

    // Detectar fin del video
    video.video.onended = () => {
      video.destroy();
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "IntroScene", // o la escena que quieras
      });
    };

    // Permitir saltar el video con clic
    this.input.once("pointerdown", () => {
      video.stop();
      video.destroy();
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "IntroScene",
      });
    });
  }
}
