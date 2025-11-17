export default class MinigameHubScene extends Phaser.Scene {
  constructor() {
    super("MinigameHubScene");

    // Lista de minijuegos / niveles (asigna imágenes manualmente)
    this.minigames = [
      { id: "level1", name: "Nivel 1", img: "" },
      { id: "level2", name: "Nivel 2", img: "" },
      { id: "level3", name: "Nivel 3", img: "" },
      { id: "level4", name: "Nivel 4", img: "" },
      { id: "level5", name: "Nivel 5", img: "" },
    ];
  }

  preload() {
    // Fondo de la escena (asigna tu asset)
    // this.load.image("hubBg", "ruta/a/tu/fondo.png");
    // Imagen transparente para hitbox si es necesario
    // this.load.image("btnTransparent", "assets/blank.png");
    // Botón de competencia (opcional imagen)
    // this.load.image("competitionBtn", "ruta/a/imagen.png");
  }

  create() {
    const { width, height } = this.game.config;

    // -----------------------------
    // Fondo (asignar manualmente)
    // -----------------------------
    // const bg = this.add.image(0, 0, "hubBg").setOrigin(0).setDisplaySize(width, height);

    // -----------------------------
    // Botón grande de competencia
    // -----------------------------
    const compWidth = 600;
    const compHeight = 120;
    const compX = width / 2;
    const compY = 120;

    const compContainer = this.add.container(compX, compY);

    const compBg = this.add
      .rectangle(0, 0, compWidth, compHeight, 0x000000, 0.6)
      .setOrigin(0.5);

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
      .setDisplaySize(compWidth, compHeight)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", () => this.startCompetition());

    compContainer.add([compBg, compText, compHitbox]);

    // -----------------------------
    // Crear botones de minijuegos
    // -----------------------------
    const margin = 80;
    const spacing = (width - margin * 2) / this.minigames.length;
    const buttonWidth = 200;
    const buttonHeight = 250;
    const yPos = height / 2;

    this.minigames.forEach((mg, index) => {
      const xPos = margin + spacing / 2 + index * spacing;

      const container = this.add.container(xPos, yPos);

      // Imagen del minijuego (asignar manualmente)
      const img = this.add
        .image(0, 0, mg.img)
        .setOrigin(0.5)
        .setDisplaySize(buttonWidth, buttonHeight);

      // Fondo negro translúcido para el texto
      const textBg = this.add
        .rectangle(0, buttonHeight / 2 - 30, buttonWidth, 50, 0x000000, 0.5)
        .setOrigin(0.5);

      // Texto del nivel
      const text = this.add
        .text(0, buttonHeight / 2 - 30, mg.name, {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: buttonWidth - 20 },
        })
        .setOrigin(0.5);

      // Hitbox para interactuar
      const hitbox = this.add
        .image(0, 0, "btnTransparent")
        .setDisplaySize(buttonWidth, buttonHeight)
        .setInteractive({ cursor: "pointer" })
        .on("pointerdown", () => this.selectMinigame(mg.id));

      container.add([img, textBg, text, hitbox]);
    });
  }

  /**
   * Inicia el minijuego
   * @param {boolean} isCompetition → true: iniciar del 1 al 5 / false: nivel individual
   * @param {string} levelId → id del nivel (si isCompetition es false)
   */
  startMinigame(isCompetition, levelId = null) {
    if (isCompetition) {
      console.log("Iniciando competencia de 5 niveles en secuencia...");
      this.scene.start("GameScene", {
        competition: true,
        startLevel: 1,
        endLevel: 5,
      });
    } else {
      console.log("Iniciando nivel individual:", levelId);
      this.scene.start("GameScene", { competition: false, levelId });
    }
  }
}
