export default class TutorialSelectScene extends Phaser.Scene {
  constructor() {
    super("TutorialSelectScene");
    this.inactivityTimer = null;
    this.inactivityDelay = 180; // segundos
    this.remainingTime = this.inactivityDelay;
  }

  preload() {
    this.load.image("tutorialBg", "assets/102.png"); // Fondo
    this.load.image("btnTransparent", "assets/blank.png");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo
    const bg = this.add.image(0, 0, "tutorialBg").setOrigin(0);
    bg.setDisplaySize(width, height);

    // Caja central
    const boxWidth = 700;
    const boxHeight = 300;
    const box = this.add.rectangle(width / 2, height / 2, boxWidth, boxHeight, 0x000000, 0.6).setOrigin(0.5);

    // Texto de pregunta
    this.add.text(width / 2, height / 2 - 50, "¿Deseas jugar el tutorial?", {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    // Botón Sí
    this.createButton(width / 2 - 150, height / 2 + 70, 200, 70, "SÍ", () => {
      this.disableTimer();
      this.scene.start("TransitionScene", { fromScene: this.scene.key, toScene: "TutorialScene" });
    });

    // Botón No
    this.createButton(width / 2 + 150, height / 2 + 70, 200, 70, "NO", () => {
      this.disableTimer();
      this.scene.start("TransitionScene", { fromScene: this.scene.key, toScene: "MinigameHubScene" });
    });

    // Timer visible
    this.timerText = this.add.text(width / 2, 100, this.formatTime(this.remainingTime), {
      fontFamily: "Arial",
      fontSize: "48px",
      color: "#ffff00",
    }).setOrigin(0.5);

    this.resetInactivityTimer();

    // Reinicia el timer al interactuar
    this.input.on('pointerdown', () => this.resetInactivityTimer());
    this.input.keyboard.on('keydown', () => this.resetInactivityTimer());
  }

  createButton(x, y, w, h, label, cb) {
    const bg = this.add.rectangle(x, y, w, h, 0xffffff, 0.12).setOrigin(0.5).setInteractive({ cursor: "pointer" });
    const border = this.add.rectangle(x, y, w, h).setOrigin(0.5).setStrokeStyle(3, 0xffffff, 0.5);
    const text = this.add.text(x, y, label, { fontFamily: "Arial", fontSize: "32px", color: "#ffffff" }).setOrigin(0.5);

    bg.on("pointerover", () => {
      bg.setFillStyle(0xffffff, 0.25);
      border.setStrokeStyle(3, 0xffff00, 0.8);
      text.setScale(1.05);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0xffffff, 0.12);
      border.setStrokeStyle(3, 0xffffff, 0.5);
      text.setScale(1);
    });
    bg.on("pointerdown", cb);

    return { bg, border, text };
  }

  formatTime(seconds) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  resetInactivityTimer() {
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
      }
    });
  }

  disableTimer() {
    if (this.inactivityTimer) this.inactivityTimer.remove(false);
    if (this.timerText) {
      this.timerText.destroy();
      this.timerText = null;
    }
  }
}
