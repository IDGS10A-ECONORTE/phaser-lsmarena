// Importar escenas
import IntroScene from "/static/src/scenes/IntroScene.js";
import TransitionScene from "/static/src/scenes/TransitionScene.js";
import MainMenuScene from "/static/src/scenes/MainMenuScene.js";
import CharacterSelectScene from "/static/src/scenes/CharacterSelectScene.js";
import TutorialSelectScene from "/static/src/scenes/TutorialSelectScene.js";
import TutorialScene from "/static/src/scenes/TutorialScene.js";
import PreloadScene from "/static/src/scenes/PreloadScene.js";
import PauseMenuScene from "/static/src/scenes/PauseMenuScene.js";

import MinigameHubScene from "/static/src/scenes/minigames/MinigameHubScene.js";
import Minigame1Scene from "/static/src/scenes/minigames/Minigame1Scene.js";
import Minigame2Scene from "/static/src/scenes/minigames/Minigame2Scene.js";
import Minigame3Scene from "/static/src/scenes/minigames/Minigame3Scene.js";
import Minigame4Scene from "/static/src/scenes/minigames/Minigame4Scene.js";
import Minigame5Scene from "/static/src/scenes/minigames/Minigame5Scene.js";

import PerformanceScene from "/static/src/scenes/PerformanceScene.js";
import VictoryScene from "/static/src/scenes/VictoryScene.js";
import DefeatScene from "/static/src/scenes/DefeatScene.js";
import CreditsScene from "/static/src/scenes/CreditsScene.js";


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
    PreloadScene,
    IntroScene,
    MainMenuScene,
    TransitionScene,
    CharacterSelectScene,
    TutorialSelectScene,
    TutorialScene,
    MinigameHubScene,
    Minigame1Scene,
    Minigame2Scene,
    Minigame3Scene,
    Minigame4Scene,
    Minigame5Scene,
    PerformanceScene,
    PauseMenuScene,
    VictoryScene,
    DefeatScene,
    CreditsScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Crear el juego
new Phaser.Game(config);
