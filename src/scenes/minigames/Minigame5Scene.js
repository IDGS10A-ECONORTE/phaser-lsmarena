import SequenceManager from "/src/modules/SequenceManager.js";
import {
  initWebcam,
  stopWebcam,
  showWebcam,
  setVideoPositionResponsive,
} from "/src/utils/webcam.js";

export default class Minigame5Scene extends Phaser.Scene {
  constructor() {
    super("Minigame5Scene");
    this.sequenceManager = null;
    this.videoElement = null;
    this.targetWordText = null;
    this.optionSprites = [];
    this.currentTarget = null;
    this.roundsCompleted = 0;
    this.maxRounds = 10;
  }

  preload() {
    this.load.image("minigame5Bg", "assets/108.png");
    this.load.image("successFx", "assets/iconos/OK.png");
    this.load.image("failFx", "assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config;

    this.add
      .image(0, 0, "minigame5Bg")
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setDepth(-10);

    this.initPlayerWebcam();

    const difficulty = this.registry.get("selectedDifficulty") || "easy";

    this.sequenceManager = new SequenceManager(this, difficulty, (result) =>
      this.handleSequenceResult(result)
    );
    this.sequenceManager.setExternalSignDisplay(true);

    this.createSignOptionsUI();

    // Contador regresivo 3, 2, 1 antes de iniciar
    this.startCountdown(() => {
      this.startSignRound();
    });
  }

  startCountdown(onComplete) {
    const { width, height } = this.game.config;
    let count = 3;

    const countdownText = this.add
      .text(width / 2, height / 2, count.toString(), {
        fontFamily: "Arial",
        fontSize: "120px",
        color: "#ffff00",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(5);

    // Animación de entrada
    this.tweens.add({
      targets: countdownText,
      alpha: 1,
      scale: 1.5,
      duration: 200,
      yoyo: true,
      hold: 300,
    });

    const countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countdownText.setText(count.toString());
          this.tweens.add({
            targets: countdownText,
            alpha: 1,
            scale: 1.5,
            duration: 200,
            yoyo: true,
            hold: 300,
          });
        } else {
          // Mostrar "¡GO!" o desaparecer
          countdownText.setText("¡GO!");
          this.tweens.add({
            targets: countdownText,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              countdownText.destroy();
              onComplete();
            },
          });
        }
      },
    });
  }

  initPlayerWebcam() {
    initWebcam(320, 240).then((stream) => {
      if (!stream) return;
      this.videoElement = stream;
      const camW = 320;
      const camH = 240;
      const margin = 24;
      setVideoPositionResponsive(camW, camH, margin);
      showWebcam();
      window.addEventListener("resize", () => {
        setVideoPositionResponsive(camW, camH, margin);
      });
      document.addEventListener("fullscreenchange", () => {
        setVideoPositionResponsive(camW, camH, margin);
      });
    });
  }

  handleSequenceResult(result) {
    const stats = this.registry.get("gameStats") || {
      correct: 0,
      incorrect: 0,
      total: 0,
      accuracy: 0,
    };

    stats.total++;
    if (result.status === "ok") {
      stats.correct++;
    } else {
      stats.incorrect++;
    }

    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    this.registry.set("gameStats", stats);

    this.roundsCompleted++;

    this.showResultFX(result.status);

    this.time.delayedCall(1000, () => {
      if (this.roundsCompleted >= this.maxRounds) {
        this.finishMinigame();
      } else {
        this.startSignRound();
      }
    });
  }

  showResultFX(result) {
    const fxKey =
      result === "ok"
        ? "successFx"
        : result === "timeout"
        ? "timeoutFx"
        : "failFx";

    const { width, height } = this.game.config;

    const fx = this.add
      .image(width / 2, height / 2, fxKey)
      .setScale(0.8)
      .setAlpha(0)
      .setDepth(8);

    this.tweens.add({
      targets: fx,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => fx.destroy(),
    });
  }

  finishMinigame() {
    const stats = this.registry.get("gameStats");
    const competitionMode = this.registry.get("competitionMode");

    if (this.sequenceManager) {
      this.sequenceManager.destroy();
      this.sequenceManager = null;
    }

    const won = stats.accuracy >= 70;

    if (competitionMode) {
      stats.levelsCompleted++;
      this.registry.set("gameStats", stats);
    }

    if (won) {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "VictoryScene",
      });
    } else {
      this.scene.start("TransitionScene", {
        fromScene: this.scene.key,
        toScene: "DefeatScene",
      });
    }
  }

  shutdown() {
    stopWebcam();
    if (this.sequenceManager) {
      this.sequenceManager.destroy();
    }
  }

  createSignOptionsUI() {
    const { width, height } = this.game.config;

    this.targetWordText = this.add
      .text(width / 2, height * 0.18, "Replicando...", {
        fontFamily: "Arial",
        fontSize: "64px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(6);

    const positions = [width * 0.25, width * 0.5, width * 0.75];

    this.optionSprites = positions.map((xPos) =>
      this.add
        .image(xPos, height * 0.5, "successFx")
        .setScale(0.8)
        .setDepth(5)
    );
  }

  startSignRound() {
    const dataset = this.sequenceManager.sequence || [];
    if (!dataset.length) return;

    const target =
      dataset[Math.floor(Math.random() * dataset.length)];
    this.currentTarget = target;

    const decoys = Phaser.Utils.Array.Shuffle(
      dataset.filter((item) => item.id !== target.id)
    ).slice(0, 2);

    const options = Phaser.Utils.Array.Shuffle([target, ...decoys]);

    if (this.targetWordText) {
      this.targetWordText.setText(`Replica: ${target.word || target.id}`);
    }

    options.forEach((option, idx) => {
      const sprite = this.optionSprites[idx];
      if (!sprite) return;
      sprite.setTexture(`sign_${option.id}_square`);
      sprite.setScale(0.85);
      sprite.setAlpha(0.95);
      sprite.clearTint();
    });

    this.sequenceManager.start(false, target);
  }
}

