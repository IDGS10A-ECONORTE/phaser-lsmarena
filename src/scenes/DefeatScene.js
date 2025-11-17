export default class DefeatScene extends Phaser.Scene {
  constructor() {
    super("DefeatScene");
  }

  preload() {
    // Carga el video
    this.load.video('defeatVideo', 'assets/cinematicas/derrota.mp4', 'loadeddata', false, true);
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo negro
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Reproducir video sin sonido
    const video = this.add.video(width / 2, height / 2, 'defeatVideo')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    video.setMute(true); // silenciar
    video.play(true);

    // Cuando termina el video, ir a la escena de transición
    video.on('complete', () => {
      this.scene.start('TransitionScene', {
        fromScene: this.scene.key,
        toScene: 'IntroScene', // o la escena deseada
      });
    });
  }
}
