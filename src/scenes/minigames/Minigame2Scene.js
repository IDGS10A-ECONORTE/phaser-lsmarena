import SequenceManager from "/src/modules/SequenceManager.js";
import {
  initWebcam,
  stopWebcam,
  showWebcam,
  setVideoPositionResponsive,
} from "/src/utils/webcam.js";

export default class Minigame2Scene extends Phaser.Scene {
  constructor() {
    super("Minigame2Scene");
    this.sequenceManager = null;
    this.videoElement = null;
    this.ballSprite = null;
    this.ballBasePosition = null;
  }

  preload() {
    this.load.image("minigame2Bg", "assets/minigames/40.png");
    this.load.image("minigame2Ball", "assets/iconos/49.png");
    this.load.image("successFx", "assets/iconos/OK.png");
    this.load.image("failFx", "assets/iconos/OKNT.png");
    this.load.image("timeoutFx", "assets/iconos/TIME.png");
  }

  create() {
    const { width, height } = this.game.config;

    this.add
      .image(0, 0, "minigame2Bg")
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setDepth(-10);

    this.initPlayerWebcam();

    const difficulty = this.registry.get("selectedDifficulty") || "easy";

    this.sequenceManager = new SequenceManager(this, difficulty, (result) => {
      this.handleSequenceResult(result);
    });

    this.createBall();

    // Contador regresivo 3, 2, 1 antes de iniciar
    this.startCountdown(() => {
      // Modo normal para nivel 2
      this.sequenceManager.start(false);
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

    this.showResultFX(result.status);

    this.time.delayedCall(1000, () => {
      if (stats.total >= 10) {
        this.finishMinigame();
      } else {
        this.sequenceManager.start();
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

    this.animateBall(result);
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

      if (competitionMode.currentLevel < competitionMode.endLevel) {
        competitionMode.currentLevel++;
        this.registry.set("competitionMode", competitionMode);
        this.scene.start("TransitionScene", {
          fromScene: this.scene.key,
          toScene: `Minigame${competitionMode.currentLevel}Scene`,
        });
        return;
      }
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

  createBall() {
    const { width, height } = this.game.config;
    const ballY = height - 180;

    this.ballSprite = this.add
      .image(width / 2, ballY, "minigame2Ball")
      .setOrigin(0.5, 1)
      .setDepth(-9)
      .setScale(0.12);

    this.ballBasePosition = { x: width / 2, y: ballY };
    this.ballBaseScale = 0.12;
  }

  animateBall(result) {
    if (!this.ballSprite) return;

    this.tweens.killTweensOf(this.ballSprite);
    this.ballSprite.setPosition(this.ballBasePosition.x, this.ballBasePosition.y);

    if (result === "ok") {
      // Lanzamiento a la portería
      const targetX =
        this.game.config.width / 2 +
        Phaser.Math.Between(-100, 100);
      this.tweens.add({
        targets: this.ballSprite,
        x: targetX,
        y: this.game.config.height * 0.2,
        scale: this.ballBaseScale * 0.6,
        duration: 600,
        ease: "Cubic.easeOut",
        yoyo: false,
        onComplete: () => {
          this.tweens.add({
            targets: this.ballSprite,
            x: this.ballBasePosition.x,
            y: this.ballBasePosition.y,
            scale: this.ballBaseScale,
            duration: 500,
            ease: "Cubic.easeIn",
          });
        },
      });
    } else {
      // Golpe que lo lanza por la parte superior
      this.tweens.add({
        targets: this.ballSprite,
        x: Phaser.Math.Between(100, this.game.config.width - 100),
        y: -100,
        rotation: Phaser.Math.DEG_TO_RAD * Phaser.Math.Between(180, 540),
        duration: 600,
        ease: "Quad.easeIn",
        onComplete: () => {
          this.ballSprite.setRotation(0);
          this.ballSprite.setPosition(
            this.ballBasePosition.x,
            this.ballBasePosition.y
          );
          this.ballSprite.setScale(this.ballBaseScale);
        },
      });
    }
  }
}

