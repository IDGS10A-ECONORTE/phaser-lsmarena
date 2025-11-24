import { hideWebcam } from "/src/utils/webcam.js";

export default class DefeatScene extends Phaser.Scene {
  constructor() {
    super("DefeatScene");
  }

  preload() {
    // Carga el video
    this.load.video(
      "defeatVideo",
      "assets/cinematicas/derrota.mp4",
      "loadeddata",
      false,
      true
    );
  }

  create() {
    const { width, height } = this.game.config;

    // Ocultar la webcam
    hideWebcam();

    // Fondo negro
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Reproducir video centrado sin escalar
    const video = this.add
      .video(width / 2, height / 2, "defeatVideo")
      .setOrigin(0.5); // No escalar, mantener tamaño nativo

    video.setMute(true); // silenciar
    video.play(false); // reproducir solo una vez

    // Detectar fin del video
    video.video.onended = () => {
      video.destroy(); // limpiar
      this.goToPerformance();
    };

    // Opcional: permitir skip con clic
    this.input.once("pointerdown", () => {
      video.stop();
      video.destroy();
      this.goToPerformance();
    });
  }

  goToPerformance() {
    this.scene.start("TransitionScene", {
      fromScene: this.scene.key,
      toScene: "PerformanceScene",
    });
  }
}
