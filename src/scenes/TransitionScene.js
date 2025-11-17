export default class TransitionScene extends Phaser.Scene {
  constructor() {
    super("TransitionScene");
  }

  init(data) {
    this.fromScene = data.fromScene;
    this.toScene = data.toScene;
  }

  preload() {
    // -----------------------------
    // Assets de la transición
    // -----------------------------
    this.load.image("transitionBg", "assets/109.png"); // fondo único
    this.load.image("loadingCharSelect", "assets/iconos/35.png");
    this.load.image("loadingGame", "assets/iconos/35.png");
  }

  create() {
    const { width, height } = this.game.config;

    // -----------------------------
    // BACKGROUND ÚNICO
    // -----------------------------
    this.add
      .image(width / 2, height / 2, "transitionBg")
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // -----------------------------
    // CAPA NEGRA DIFUMINADA
    // -----------------------------
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

    // -----------------------------
    // IMAGEN + TEXTO SEGÚN ESCENA DESTINO
    // -----------------------------
    const transitionData = {
      CharacterSelectScene: {
        img: "loadingCharSelect",
        text: "Cargando personajes...",
      },
      GameScene: { img: "loadingGame", text: "Preparando partida..." },
    };

    const { img, text } = transitionData[this.toScene] || {
      img: null,
      text: "",
    };

    const centerY = height / 2 - 50;

    if (img) {
      this.add.image(width / 2, centerY, img).setOrigin(0.5);
    }

    this.add
      .text(width / 2, centerY + 100, text, {
        fontFamily: "Arial",
        fontSize: "40px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // -----------------------------
    // CÍRCULO DE CARGA ANIMADO HORIZONTAL
    // -----------------------------
    const bottomMargin = 100;
    const centerX = width / 2;
    const centerYCircle = height - bottomMargin;

    const circle = this.add.circle(centerX, centerYCircle, 25, 0xffffff, 0.8);

    this.tweens.add({
      targets: circle,
      x: centerX + 600, // se mueve 600px a la derecha
      repeat: -1,
      yoyo: true, // vuelve 600px a la izquierda
      duration: 500, // velocidad rápida
      ease: "Sine.easeInOut",
    });

    // -----------------------------
    // PASAR A LA ESCENA DESTINO
    // -----------------------------
    this.time.delayedCall(1200, () => {
      this.scene.start(this.toScene);
    });
  }
}
