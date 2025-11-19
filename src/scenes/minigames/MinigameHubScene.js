export default class MinigameHubScene extends Phaser.Scene {
  constructor() {
    super("MinigameHubScene");

    this.minigames = [
      { id: "level1", name: "Nivel 1", img: "icon112" },
      { id: "level2", name: "Nivel 2", img: "icon113" },
      { id: "level3", name: "Nivel 3", img: "icon114" },
      { id: "level4", name: "Nivel 4", img: "icon115" },
      { id: "level5", name: "Nivel 5", img: "icon116" },
    ];
  }

  preload() {
    this.load.image("hubBg", "assets/110.png");
    this.load.image("btnTransparent", "assets/blank.png");
    this.load.image("competitionBtn", "assets/111.png");

    // Minigames 112–116
    this.load.image("icon112", "assets/iconos/112.png");
    this.load.image("icon113", "assets/iconos/113.png");
    this.load.image("icon114", "assets/iconos/114.png");
    this.load.image("icon115", "assets/iconos/115.png");
    this.load.image("icon116", "assets/iconos/116.png");
  }

  create() {
    const { width, height } = this.game.config;

    this.add.image(0, 0, "hubBg").setOrigin(0).setDisplaySize(width, height);

    // -----------------------------
    // Minijuegos (centro de pantalla)
    // -----------------------------
    const totalButtons = this.minigames.length;
    const buttonWidth = 220;
    const buttonHeight = 220;
    const spacing = 250;

    const totalWidth = spacing * (totalButtons - 1);
    const startX = width / 2 - totalWidth / 2;
    const yPos = height * 0.45;

    this.minigames.forEach((mg, index) => {
      const xPos = startX + spacing * index;

      const container = this.add.container(xPos, yPos);

      // Imagen del minijuego
      const img = this.add
        .image(0, 0, mg.img)
        .setDisplaySize(buttonWidth, buttonHeight)
        .setOrigin(0.5);

      // Texto con fondo
      const textBg = this.add
        .rectangle(0, buttonHeight / 2 + 30, buttonWidth, 60, 0x000000, 0.55)
        .setOrigin(0.5);

      const text = this.add
        .text(0, buttonHeight / 2 + 30, mg.name, {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5);

      // Hitbox
      const hitbox = this.add
        .image(0, 0, "btnTransparent")
        .setDisplaySize(buttonWidth, buttonHeight)
        .setInteractive({ cursor: "pointer" })
        .on("pointerdown", () => this.startMinigame(false, mg.id));

      container.add([img, textBg, text, hitbox]);
    });

    // -----------------------------
    // Botón de competencia (ABBAJO)
    // -----------------------------
    const compContainer = this.add.container(width / 2, height * 0.82);

    const compImg = this.add
      .image(0, 0, "competitionBtn")
      .setOrigin(0.5)
      .setDisplaySize(500, 140);

    const compText = this.add
      .text(0, 0, "COMPETENCIA", {
        fontFamily: "Arial",
        fontSize: "48px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const compHitbox = this.add
      .image(0, 0, "btnTransparent")
      .setDisplaySize(500, 140)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", () => this.startMiniggame(true));

    compContainer.add([compImg, compText, compHitbox]);
  }

  // ----------------------------------------
  // Control de inicio
  // ----------------------------------------
  startMiniggame(isCompetition, levelId = null) {
    if (isCompetition) {
      this.scene.start("GameScene", {
        competition: true,
        startLevel: 1,
        endLevel: 5,
      });
    } else {
      this.scene.start("GameScene", {
        competition: false,
        levelId,
      });
    }
  }
}
