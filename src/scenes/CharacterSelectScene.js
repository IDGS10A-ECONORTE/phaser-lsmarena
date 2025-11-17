export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");

    this.characters = [
      { id: "kael", name: "KAEL ARAN", color: 0x00eaff },
      { id: "lira", name: "LIRA SOLIS", color: 0xff4be0 },
      { id: "nox", name: "NOX VEGA", color: 0xff9100 },
      { id: "draven", name: "DRAVEN CRUZ", color: 0xc8ff1a },
      { id: "nahele", name: "NAHELE FLORES", color: 0xff3d3d },
      { id: "tula", name: "TULA RIVERA", color: 0x00eaff },
    ];

    this.selectedCharacter = 0;
    this.selectedDifficulty = "easy";

    // Timer de inactividad
    this.inactivityTimer = null;
    this.inactivityDelay = 180; // segundos
    this.remainingTime = this.inactivityDelay;
  }

  preload() {
    this.load.image("menuBgCharSelect", "assets/101.png");
    this.load.image("btnTransparent", "assets/blank.png");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo
    const bg = this.add.image(0, 0, "menuBgCharSelect").setOrigin(0);
    bg.setDisplaySize(width, height);

    // ------------------------------
    // ZONAS INTERACTIVAS SOBRE CADA PERSONAJE
    // ------------------------------
    const numCharacters = this.characters.length;
    const boxWidth = 221;
    const boxHeight = 380;
    const separation = 38;
    const marginLeft = 58;
    const lastSeparation = 30;
    const baseY = 416;

    const totalWidth =
      marginLeft +
      boxWidth * numCharacters +
      separation * (numCharacters - 1) +
      lastSeparation;
    const startX = marginLeft + boxWidth / 2;

    this.selectionFrames = [];

    this.characters.forEach((ch, index) => {
      let x = startX + index * (boxWidth + separation);
      if (index === numCharacters - 1)
        x = totalWidth - lastSeparation - boxWidth / 2;

      const frame = this.add
        .rectangle(x, baseY, boxWidth, boxHeight)
        .setStrokeStyle(6, ch.color, 0.0)
        .setOrigin(0.5);

      const hitbox = this.add
        .image(x, baseY, "btnTransparent")
        .setOrigin(0.5)
        .setDisplaySize(boxWidth, boxHeight)
        .setInteractive({ cursor: "pointer" });

      hitbox.on("pointerdown", () => {
        this.selectCharacter(ch.id);
        this.resetInactivityTimer();
      });

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

    // ------------------------------
    // TIMER DE INACTIVIDAD VISIBLE
    // ------------------------------
    this.timerText = this.add
      .text(width / 2, 140, this.formatTime(this.remainingTime), {
        fontFamily: "Arial",
        fontSize: "48px",
        color: "#ffff00",
      })
      .setOrigin(0.5);

    this.resetInactivityTimer();

    // Reinicia el timer al interactuar
    this.input.on("pointerdown", () => this.resetInactivityTimer());
    this.input.keyboard.on("keydown", () => this.resetInactivityTimer());
  }

  formatTime(seconds) {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  }

  resetInactivityTimer() {
    // Si el timer ya fue deshabilitado, no hacemos nada
    if (!this.timerText) return;

    if (this.inactivityTimer) this.inactivityTimer.remove(false);
    this.remainingTime = this.inactivityDelay;
    this.timerText.setText(this.formatTime(this.remainingTime));

    this.inactivityTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.remainingTime--;
        this.timerText.setText(this.formatTime(this.remainingTime));
        if (this.remainingTime <= 0) {
          this.inactivityTimer.remove(false);
          this.scene.start("TransitionScene", {
            fromScene: this.scene.key,
            toScene: "IntroScene",
          });
        }
      },
    });
  }

  // ---------------------------------------------------
  // SELECCIONAR PERSONAJE
  // ---------------------------------------------------
  selectCharacter(id) {
    this.selectedCharacter = id;
    this.selectionFrames.forEach((c) =>
      c.frame.setStrokeStyle(4, 0xffffff, 0.15)
    );
    const selected = this.selectionFrames.find((c) => c.id === id);
    selected.frame.setStrokeStyle(8, 0xffff00, 1);
  }

  // ---------------------------------------------------
  // BOTONES DE DIFICULTAD
  // ---------------------------------------------------
  createDifficultyButtons() {
    const { width } = this.game.config;

    this.difficultyButtons = {
      easy: this.createButton(width / 2 - 260, 760, 220, 70, "FACIL", () => {
        this.setDifficulty("easy");
        this.resetInactivityTimer();
      }),
      normal: this.createButton(width / 2, 760, 220, 70, "NORMAL", () => {
        this.setDifficulty("normal");
        this.resetInactivityTimer();
      }),
      hard: this.createButton(width / 2 + 260, 760, 220, 70, "DIFICIL", () => {
        this.setDifficulty("hard");
        this.resetInactivityTimer();
      }),
    };

    this.updateDifficultyUI();
  }

  setDifficulty(diff) {
    this.selectedDifficulty = diff;
    this.updateDifficultyUI();
  }

  updateDifficultyUI() {
    Object.entries(this.difficultyButtons).forEach(([key, btn]) => {
      btn.bg.setFillStyle(
        key === this.selectedDifficulty ? 0xffff00 : 0xffffff,
        key === this.selectedDifficulty ? 0.4 : 0.12
      );
    });
  }

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

  showAlert(message) {
    const { width, height } = this.game.config;

    // Fondo semitransparente
    const alertBg = this.add
      .rectangle(width / 2, height / 2, 500, 80, 0x000000, 0.7)
      .setOrigin(0.5);

    // Texto de alerta
    const alertText = this.add
      .text(width / 2, height / 2, message, {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 460 },
      })
      .setOrigin(0.5);

    // Tween para desaparecer después de 2 segundos
    this.tweens.add({
      targets: [alertBg, alertText],
      alpha: 0,
      duration: 2000,
      ease: "Power1",
      onComplete: () => {
        alertBg.destroy();
        alertText.destroy();
      },
    });
  }

  // -----------------------------
  // Confirmar selección
  // -----------------------------
  confirmSelection() {
    if (!this.selectedCharacter) {
      this.showAlert("Selecciona un personaje primero");
      return;
    }

    // Deshabilitar timer al iniciar juego
    if (this.inactivityTimer) this.inactivityTimer.remove(false);
    if (this.timerText) {
      this.timerText.destroy();
      this.timerText = null;
    }

    this.scene.start("TutorialSelectScene", {
      character: this.selectedCharacter,
      difficulty: this.selectedDifficulty,
    });
  }
}
