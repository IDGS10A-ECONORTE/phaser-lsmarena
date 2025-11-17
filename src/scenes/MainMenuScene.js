export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
    this.buttons = []; // Para guardar referencias y limpiar
    this.tweensList = []; // Para limpiar tweens
  }

  preload() {
    this.load.image("menuBgMain", "assets/100.png");
    this.load.image("btnTransparent", "assets/blank.png");
  }

  create() {
    const { width, height } = this.game.config;
    const scaleX = width / 1600;
    const scaleY = height / 900;

    function rel(v, scale) {
      return v * scale;
    }

    const createStyledButton = (scene, x, y, w, h, text, callback) => {
      const button = scene.add
        .image(rel(x, scaleX), rel(y, scaleY), "btnTransparent")
        .setDisplaySize(rel(w, scaleX), rel(h, scaleY))
        .setInteractive({ cursor: "pointer" });

      const bg = scene.add
        .rectangle(rel(x, scaleX), rel(y, scaleY), rel(w, scaleX), rel(h, scaleY), 0x000000, 0.35)
        .setOrigin(0.5);

      const border = scene.add
        .rectangle(rel(x, scaleX), rel(y, scaleY), rel(w, scaleX), rel(h, scaleY))
        .setStrokeStyle(4, 0xffffff, 0.6)
        .setOrigin(0.5)
        .setVisible(false);

      const btnText = scene.add.text(rel(x, scaleX), rel(y, scaleY), text, {
        fontFamily: "Arial",
        fontSize: `${rel(42, scaleY)}px`,
        color: "#ffffff",
      }).setOrigin(0.5);

      // HOVER
      const hoverTween = (targets, scale) =>
        scene.tweens.add({
          targets,
          scale,
          duration: 100,
          ease: "Power1",
        });

      const pointerOver = () => {
        bg.setFillStyle(0xffffff, 0.25);
        border.setVisible(true);
        this.tweensList.push(hoverTween([bg, btnText, border], 1.05));
      };

      const pointerOut = () => {
        bg.setFillStyle(0x000000, 0.35);
        border.setVisible(false);
        this.tweensList.push(hoverTween([bg, btnText, border], 1));
      };

      button.on("pointerover", pointerOver);
      button.on("pointerout", pointerOut);

      // CLICK
      button.on("pointerdown", () => {
        this.tweensList.push(
          scene.tweens.add({
            targets: [bg, btnText, border],
            alpha: 0.5,
            yoyo: true,
            duration: 120,
          })
        );
        callback();
      });

      // Guardamos referencias para limpiar
      this.buttons.push({ button, bg, border, btnText, pointerOver, pointerOut });

      return { button, bg, border, btnText };
    };

    // Fondo
    this.bg = this.add.image(0, 0, "menuBgMain").setOrigin(0);
    this.bg.setDisplaySize(width, height);

    // Botones
    createStyledButton(this, 800, 500, 450, 80, "JUGAR", () =>
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key, // la escena actual
        toScene: "CharacterSelectScene", // la escena destino
      })
    );
    createStyledButton(this, 800, 600, 450, 80, "OPCIONES", () => console.log("Opciones"));
    createStyledButton(this, 800, 700, 450, 80, "CRÉDITOS", () =>
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key, // la escena actual
        toScene: "CreditsScene", // la escena destino
      })
    );
    createStyledButton(this, 800, 800, 450, 80, "SALIR", () => console.log("Salir del juego"));

    // Evento shutdown para limpiar
    this.events.on("shutdown", this.cleanup, this);
  }

  // Limpiar tweens y eventos
  cleanup() {
    // Limpiar botones y listeners
    this.buttons.forEach(({ button, pointerOver, pointerOut }) => {
      button.off("pointerover", pointerOver);
      button.off("pointerout", pointerOut);
      button.removeAllListeners();
    });

    // Limpiar tweens activos
    this.tweensList.forEach((t) => t.stop());
    this.tweensList = [];

    // Limpiar fondo
    if (this.bg) {
      this.bg.destroy();
    }
  }
}
