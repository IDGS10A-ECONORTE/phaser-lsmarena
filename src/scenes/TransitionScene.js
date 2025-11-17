export default class TransitionScene extends Phaser.Scene {
  constructor() {
    super("TransitionScene");
  }

  init(data) {
    this.fromScene = data.fromScene;
    this.toScene = data.toScene;
  }

  preload() {
    this.load.image("transitionBg", "assets/109.png");
    this.load.image("loading1", "assets/iconos/35.png");
    this.load.image("loading2", "assets/iconos/36.png");
    this.load.image("loading3", "assets/iconos/37.png");
  }

  create() {
    const { width, height } = this.game.config;

    // -----------------------------
    // FONDO
    // -----------------------------
    this.add
      .image(0, 0, "transitionBg")
      .setOrigin(0)
      .setDisplaySize(width, height);

    // -----------------------------
    // Capa negra difuminada
    // -----------------------------
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

    // -----------------------------
    // Selección aleatoria de imagen + texto
    // -----------------------------
    const transitions = [
      { img: "loading1", text: "Cargando aventuras..." },
      { img: "loading2", text: "Preparando la acción..." },
      { img: "loading3", text: "Un momento, héroe..." },
    ];

    const randomIndex = Phaser.Math.Between(0, transitions.length - 1);
    const { img, text } = transitions[randomIndex];

    // -----------------------------
    // Texto tipo título en la parte superior
    // -----------------------------
    const titlePadding = 20;
    const titleStyle = {
      fontFamily: "Arial",
      fontSize: "48px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width * 0.9 },
    };

    const titleText = this.add
      .text(width / 2, height * 0.15, text, titleStyle)
      .setOrigin(0.5);

    // Fondo translúcido detrás del texto
    const bgTitle = this.add
      .rectangle(
        width / 2,
        titleText.y,
        titleText.width + titlePadding,
        titleText.height + titlePadding,
        0x000000,
        0.5
      )
      .setOrigin(0.5);

    titleText.setDepth(1);

    // -----------------------------
    // Imagen más pequeña centrada debajo del título
    // -----------------------------
    const imgSprite = this.add
      .image(width / 2, height * 0.5, img)
      .setOrigin(0.5);
    imgSprite.setDisplaySize(imgSprite.width * 0.5, imgSprite.height * 0.5); // 50% tamaño original

    // -----------------------------
    // Círculo de carga animado horizontal
    // -----------------------------
    const bottomMargin = 100;
    const centerX = width / 2;
    const circle = this.add.circle(
      centerX,
      height - bottomMargin,
      25,
      0xffffff,
      0.8
    );

    this.tweens.add({
      targets: circle,
      x: centerX + 600,
      repeat: -1,
      yoyo: true,
      duration: 500,
      ease: "Sine.easeInOut",
    });

    // -----------------------------
    // Pasar a la escena destino después de 1.2 segundos
    // -----------------------------
    this.time.delayedCall(1200, () => {
      if (this.toScene) {
        this.scene.start(this.toScene);
      } else {
        console.warn("No se especificó escena destino para la transición.");
      }
    });
  }
}
