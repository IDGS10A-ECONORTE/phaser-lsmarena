export default class PerformanceScene extends Phaser.Scene {
  constructor() {
    super("PerformanceScene");
  }

  create() {
    const { width, height } = this.game.config;

    // Fondo negro
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

    // Obtener estadísticas del registry
    const stats = this.registry.get("gameStats") || {
      correct: 0,
      incorrect: 0,
      total: 0,
      accuracy: 0,
      levelsCompleted: 0,
      isCompetition: false,
    };

    // Título
    const title = this.add
      .text(width / 2, height * 0.15, "ESTADÍSTICAS", {
        fontFamily: "Arial",
        fontSize: "56px",
        color: "#ffff00",
        align: "center",
      })
      .setOrigin(0.5);

    // Contenedor de estadísticas
    const statsY = height * 0.35;
    const lineHeight = 60;
    const fontSize = "36px";

    // Precisión
    const accuracyText = this.add
      .text(
        width / 2,
        statsY,
        `Precisión: ${stats.accuracy.toFixed(1)}%`,
        {
          fontFamily: "Arial",
          fontSize: fontSize,
          color: "#ffffff",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Correctas
    const correctText = this.add
      .text(
        width / 2,
        statsY + lineHeight,
        `Correctas: ${stats.correct}`,
        {
          fontFamily: "Arial",
          fontSize: fontSize,
          color: "#00ff00",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Incorrectas
    const incorrectText = this.add
      .text(
        width / 2,
        statsY + lineHeight * 2,
        `Incorrectas: ${stats.incorrect}`,
        {
          fontFamily: "Arial",
          fontSize: fontSize,
          color: "#ff0000",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Total
    const totalText = this.add
      .text(
        width / 2,
        statsY + lineHeight * 3,
        `Total: ${stats.total}`,
        {
          fontFamily: "Arial",
          fontSize: fontSize,
          color: "#ffffff",
          align: "center",
        }
      )
      .setOrigin(0.5);

    // Si es competencia, mostrar niveles completados
    if (stats.isCompetition) {
      const levelsText = this.add
        .text(
          width / 2,
          statsY + lineHeight * 4,
          `Niveles Completados: ${stats.levelsCompleted}/5`,
          {
            fontFamily: "Arial",
            fontSize: fontSize,
            color: "#ffff00",
            align: "center",
          }
        )
        .setOrigin(0.5);
    }

    // Timeout de 10 segundos y luego ir a CreditsScene
    this.time.delayedCall(10000, () => {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "CreditsScene",
      });
    });

    // Mostrar contador regresivo
    let timeLeft = 10;
    const countdownText = this.add
      .text(width / 2, height * 0.85, `Siguiente en ${timeLeft}...`, {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#888888",
        align: "center",
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        timeLeft--;
        countdownText.setText(`Siguiente en ${timeLeft}...`);
      },
    });

    // Permitir saltar con clic
    this.input.once("pointerdown", () => {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "CreditsScene",
      });
    });
  }
}

