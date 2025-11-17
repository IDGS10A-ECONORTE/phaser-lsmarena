export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");

    this.characters = [
      { id: "kael", name: "KAEL ARAN", x: 200, color: 0x00eaff },
      { id: "lira", name: "LIRA SOLIS", x: 420, color: 0xff4be0 },
      { id: "nox", name: "NOX VEGA", x: 640, color: 0xff9100 },
      { id: "draven", name: "DRAVEN CRUZ", x: 860, color: 0xc8ff1a },
      { id: "nahele", name: "NAHELE FLORES", x: 1080, color: 0xff3d3d },
      { id: "tula", name: "TULA RIVERA", x: 1300, color: 0x00eaff },
    ];

    this.selectedCharacter = 0;
    this.selectedDifficulty = "easy";
  }

  preload() {
    this.load.image("menuBgCharSelect", "assets/101.png");
    this.load.image("btnTransparent", "assets/blank.png");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo: los personajes ya vienen en la imagen
    const bg = this.add.image(0, 0, "menuBgCharSelect").setOrigin(0);
    bg.setDisplaySize(width, height);

    // ------------------------------
    // ZONAS INTERACTIVAS SOBRE CADA PERSONAJE
    // ------------------------------

    this.selectionFrames = [];

    const numCharacters = this.characters.length;
const boxWidth = 221;
const boxHeight = 378;
const separation = 36; // separación entre personajes
const marginLeft = 58; // margen izquierdo
const lastSeparation = 26; // margen derecho final
const baseY = 400 + 16; // desplazamiento vertical 16px

// Ancho total de la fila incluyendo separaciones y márgenes
const totalWidth = marginLeft + (boxWidth * numCharacters) + (separation * (numCharacters - 1)) + lastSeparation;

// Posición inicial X
const startX = marginLeft + boxWidth / 2;

this.selectionFrames = [];

this.characters.forEach((ch, index) => {
    let x = startX + index * (boxWidth + separation);

    // Ajustar la última posición para que termine con el margen derecho correcto
    if (index === numCharacters - 1) {
        x = totalWidth - lastSeparation - boxWidth / 2;
    }

    // Marco visual
    const frame = this.add.rectangle(x, baseY, boxWidth, boxHeight)
        .setStrokeStyle(6, ch.color, 0.0)
        .setOrigin(0.5);

    // Botón invisible encima
    const hitbox = this.add.image(x, baseY, "btnTransparent")
        .setOrigin(0.5)
        .setDisplaySize(boxWidth, boxHeight)
        .setInteractive({ cursor: "pointer" });

    hitbox.on("pointerdown", () => this.selectCharacter(ch.id));

    this.selectionFrames.push({ id: ch.id, frame });
});


    // ------------------------------
    // DIFICULTAD
    // ------------------------------

    this.add
      .text(width / 2, 700, "DIFICULTAD", {
        fontFamily: "Arial",
        fontSize: "42px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.createDifficultyButtons();

    // ------------------------------
    // CONFIRMAR
    // ------------------------------

    this.createButton(width / 2, 850, 400, 90, "CONFIRMAR", () =>
      this.confirmSelection()
    );
  }

  // ---------------------------------------------------
  // SELECCIONAR PERSONAJE
  // ---------------------------------------------------

  selectCharacter(id) {
    this.selectedCharacter = id;

    this.selectionFrames.forEach((c) => {
      c.frame.setStrokeStyle(4, 0xffffff, 0.15); // Apagado
    });

    const selected = this.selectionFrames.find((c) => c.id === id);
    selected.frame.setStrokeStyle(8, 0xffff00, 1); // Encendido
  }

  // ---------------------------------------------------
  // BOTONES DE DIFICULTAD
  // ---------------------------------------------------

  createDifficultyButtons() {
    const { width } = this.game.config;

    this.difficultyButtons = {
      easy: this.createButton(width / 2 - 260, 760, 220, 70, "FACIL", () =>
        this.setDifficulty("easy")
      ),
      normal: this.createButton(width / 2, 760, 220, 70, "NORMAL", () =>
        this.setDifficulty("normal")
      ),
      hard: this.createButton(width / 2 + 260, 760, 220, 70, "DIFICIL", () =>
        this.setDifficulty("hard")
      ),
    };

    this.updateDifficultyUI();
  }

  setDifficulty(diff) {
    this.selectedDifficulty = diff;
    this.updateDifficultyUI();
  }

  updateDifficultyUI() {
    Object.entries(this.difficultyButtons).forEach(([key, btn]) => {
      if (key === this.selectedDifficulty) {
        btn.bg.setFillStyle(0xffff00, 0.4);
      } else {
        btn.bg.setFillStyle(0xffffff, 0.12);
      }
    });
  }

  // ---------------------------------------------------
  // CREAR BOTONES ESTILIZADOS
  // ---------------------------------------------------

  createButton(x, y, w, h, label, cb) {
    const bg = this.add.rectangle(x, y, w, h, 0xffffff, 0.12).setOrigin(0.5);
    const border = this.add
      .rectangle(x, y, w, h)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xffffff, 0.5);

    const text = this.add
      .text(x, y, label, {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hitbox = this.add
      .image(x, y, "btnTransparent")
      .setDisplaySize(w, h)
      .setOrigin(0.5)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", cb);

    return { bg, border, text, btn: hitbox };
  }

  // ---------------------------------------------------
  // CONFIRMAR
  // ---------------------------------------------------

  confirmSelection() {
    if (!this.selectedCharacter) {
      alert("Selecciona un personaje primero");
      return;
    }

    this.scene.start("TutorialSelectScene", {
      character: this.selectedCharacter,
      difficulty: this.selectedDifficulty,
    });
  }
}
