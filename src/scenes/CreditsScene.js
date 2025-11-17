export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super("CreditsScene");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo negro
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Texto de créditos
    const creditsText = `
      PRODUCCIÓN: TU NOMBRE O ESTUDIO
      DESARROLLADORES:
      - Jose Ibarra
      - Equipo de Desarrollo
      GRÁFICOS Y DISEÑO:
      - Artista 1
      - Artista 2
      MÚSICA Y SONIDO:
      - Compositor 1
      AGRADECIMIENTOS ESPECIALES:
      - Toda la comunidad de Phaser
      - Familia y amigos
      FIN
    `;

    const textObj = this.add
      .text(width / 2, height, creditsText, {
        fontFamily: "Arial",
        fontSize: "48px",
        color: "#ffff00",
        align: "center",
        lineSpacing: 20,
      })
      .setOrigin(0.5, 0);

    // Tween de desplazamiento vertical
    const creditsTween = this.tweens.add({
      targets: textObj,
      y: -textObj.height, // termina fuera de la pantalla
      duration: 20000, // duración total en ms
      ease: "Linear",
      onComplete: () => {
        this.scene.start("TransitionScene", {
          fromScene: this.scene.key,
          toScene: "IntroScene",
        });
      },
    });

    // -----------------------------
    // SKIP CREDITS: click o tecla
    // -----------------------------
    const skipCredits = () => {
      // Detenemos el tween
      creditsTween.stop();
      // Pasamos a la transición
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "IntroScene",
      });
    };

    // Click o toque
    this.input.once("pointerdown", skipCredits);
    // Presionar cualquier tecla
    this.input.keyboard.once("keydown", skipCredits);
  }
}
