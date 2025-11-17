// Importar escenas
import IntroScene from "./scenes/IntroScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import CharacterSelectScene from "./scenes/CharacterSelectScene.js";
// import TutorialSelectScene from "./scenes/TutorialSelectScene.js";
// import TutorialScene from "./scenes/TutorialScene.js";
import TransitionScene from "./scenes/TransitionScene.js";

// import MinigameHubScene from "./scenes/minigames/MinigameHubScene.js";
// import Minigame1Scene from "./scenes/minigames/Minigame1Scene.js";
// import Minigame2Scene from "./scenes/minigames/Minigame2Scene.js";
// import Minigame3Scene from "./scenes/minigames/Minigame3Scene.js";
// import Minigame4Scene from "./scenes/minigames/Minigame4Scene.js";
// import Minigame5Scene from "./scenes/minigames/Minigame5Scene.js";

// import PerformanceEvaluationScene from "./scenes/PerformanceScene.js";
// import VictoryScene from "./scenes/VictoryScene.js";
// import DefeatScene from "./scenes/DefeatScene.js";
// import StatsScene from "./scenes/StatsScene.js";
// import CreditsScene from "./scenes/CreditsScene.js";

const config = {
  type: Phaser.AUTO,
  title: "LSM Arena",
  description: "Coliseo anual de campeonatos de lengua de señas mexicana.",
  parent: "game-container",
  width: 1600,
  height: 900,
  backgroundColor: "#000000",
  pixelArt: false,
  scene: [
    IntroScene,
    MainMenuScene,
    TransitionScene,
    CharacterSelectScene,
    // TutorialSelectScene,
    // TutorialScene,
    // MinigameHubScene,
    // Minigame1Scene,
    // Minigame2Scene,
    // Minigame3Scene,
    // Minigame4Scene,
    // Minigame5Scene,
    // PerformanceEvaluationScene,
    // VictoryScene,
    // DefeatScene,
    // StatsScene,
    // CreditsScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Crear el juego
new Phaser.Game(config);
