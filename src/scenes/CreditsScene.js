export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super("CreditsScene");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo negro
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Texto de créditos extendido
    const creditsText = `
PRODUCCIÓN: IDGS10A ECONORTE
JUEGO: LSM-Arena

DESARROLLADORES:
- José Miguel Ibarra

GRÁFICOS Y DISEÑO:
- Gemini AI

MÚSICA Y SONIDO:
- Sin sonido para incentivar la
inclusión de lengua de señas

AGRADECIMIENTOS ESPECIALES:
- Toda la comunidad de Phaser
- Recursos Open Source utilizados
- Páginas de referencia sobre Lengua de Señas Mexicana (LSM)
- Compañeros de grupo y colaboradores
- Modelos de IA para generación de imágenes y videos usados como assets

Y en especial a ti jugador por probar nuestro juego.
`;

    // Crear objeto de texto centrado al inicio fuera de pantalla
    const textObj = this.add.text(width / 2, height, creditsText, {
      fontFamily: "Arial",
      fontSize: "36px",
      color: "#ffff00",
      align: "center",
      lineSpacing: 20,
    }).setOrigin(0.5, 0);

    // Tween de desplazamiento vertical
    const creditsTween = this.tweens.add({
      targets: textObj,
      y: -textObj.height, // termina fuera de la pantalla
      duration: 25000, // duración total en ms (más largo para más texto)
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
      creditsTween.stop();
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "IntroScene",
      });
    };

    this.input.once("pointerdown", skipCredits);
    this.input.keyboard.once("keydown", skipCredits);
  }
}
