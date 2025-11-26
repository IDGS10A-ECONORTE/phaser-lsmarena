export default class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super("PauseMenuScene");
    this.fromSceneKey = null; // Almacenará la clave de la escena del minijuego que lo llamó
  }

  // Inicialización al ser lanzada la escena
  init(data) {
    // Obtenemos la clave de la escena que lanzó el menú de pausa
    this.fromSceneKey = data.fromSceneKey;
    console.log(`[PauseMenuScene] Lanzada desde: ${this.fromSceneKey}`);
  }

  preload() {
    // Puedes precargar assets específicos para tu menú de pausa aquí (iconos, fondos, etc.)
    // Se asume que los assets de los botones ya están disponibles o se manejan con rectángulos.
  }

  create() {
    const { width, height } = this.game.config;

    // --- Fondo Semitransparente (Overlay) ---
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // --- Contenedor Principal del Menú ---
    const menuContainer = this.add.container(width / 2, height / 2);

    // Título
    const titleText = this.add
      .text(0, -180, "JUEGO PAUSADO", {
        fontFamily: "Arial",
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#ffcc00",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    menuContainer.add(titleText);

    // --- Botones del Menú ---
    const buttonConfig = [
      { text: "CONTINUAR", callback: this.onResume.bind(this) },
      { text: "REINICIAR NIVEL", callback: this.onRestart.bind(this) },
      {
        text: "SELECCIÓN DE NIVEL",
        callback: this.onGoToLevelSelect.bind(this),
      },
      { text: "MENÚ PRINCIPAL", callback: this.onGoToMainMenu.bind(this) },
    ];

    let yPos = -80;
    buttonConfig.forEach((config) => {
      const button = this.createButton(config.text, 0, yPos, config.callback);
      // Agregamos el botón (rectángulo y texto) al contenedor
      button.forEach((element) => menuContainer.add(element));
      yPos += 80;
    });

    // --- Listener para ESC (Continuar) ---
    this.input.keyboard.once("keydown-ESC", this.onResume, this);
  }

  // Método de utilidad para crear botones con feedback visual
  createButton(text, x, y, callback) {
    const buttonBg = this.add
      .rectangle(x, y, 300, 60, 0x444444)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0.5)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", callback)
      .on("pointerover", () => buttonBg.setFillStyle(0x666666))
      .on("pointerout", () => buttonBg.setFillStyle(0x444444));

    const buttonText = this.add
      .text(x, y, text, {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    return [buttonBg, buttonText];
  }

  // --- Lógica de Manejo de Botones ---

  onResume() {
    // Reanudar el minijuego de fondo
    this.scene.resume(this.fromSceneKey);
    // Detener y cerrar la escena de pausa
    this.scene.stop();
  }

  onRestart() {
    const minigameSceneKey = this.fromSceneKey;

    // 1. Detener la escena de pausa.
    this.scene.stop();

    // ⭐ CORRECCIÓN: Detener la escena del minijuego.
    // Esto es VITAL para llamar a su shutdown() y limpiar recursos/listeners.
    this.scene.stop(minigameSceneKey);

    // 2. Iniciar la transición, indicando que el destino es el mismo minijuego.
    this.scene.start("TransitionScene", {
      fromScene: minigameSceneKey,
      toScene: minigameSceneKey,
    });
  }

  onGoToLevelSelect() {
    const minigameSceneKey = this.fromSceneKey;

    // 1. Detener la escena de pausa
    this.scene.stop();

    // ⭐ CORRECCIÓN: Detener la escena del minijuego.
    this.scene.stop(minigameSceneKey);

    // 2. Iniciar la transición al selector de nivel/personaje
    this.scene.start("TransitionScene", {
      fromScene: minigameSceneKey,
      toScene: "MinigameHubScene", // Reemplazar con la clave de tu escena real
    });
  }

  onGoToMainMenu() {
    const minigameSceneKey = this.fromSceneKey;

    // 1. Detener la escena de pausa
    this.scene.stop();

    // ⭐ CORRECCIÓN: Detener la escena del minijuego.
    this.scene.stop(minigameSceneKey);

    // 2. Iniciar la transición al menú principal
    this.scene.start("TransitionScene", {
      fromScene: minigameSceneKey,
      toScene: "MainMenuScene", // Reemplazar con la clave de tu escena real
    });
  }
}
