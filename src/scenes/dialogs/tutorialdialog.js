export const tutorialDialogs = [
  {
    id: "intro_1",
    dialogue:
      "Hola, soy Xochitl. Hoy aprenderás cómo funciona el sistema del LSM Arena.",
    characterImgs: ["1", "2"],
    signImgs: ["Z"],
    transcription: "ZETA",
    autoContinue: false, // esperará input del usuario
  },
  {
    id: "intro_2",
    dialogue:
      "Aquí verás ejemplos de señas. Imitarás la seña y tu cámara verificará tu gesto.",
    characterImgs: ["3", "4"],
    signImgs: ["B"],
    transcription: "BE",
    autoContinue: true,
  },
  {
    id: "intro_3",
    dialogue: "Cada seña tiene una transcripción que te ayudará a recordarla.",
    characterImgs: ["2"],
    signImgs: ["A"],
    transcription: "A",
    autoContinue: false,
  },
  {
    id: "intro_4",
    dialogue:
      "Ahora practicarás algunas señas básicas. ¡Haz tu mejor esfuerzo!",
    characterImgs: ["5"],
    signImgs: ["H"],
    transcription: "HACHE",
    autoContinue: false,
    startPractice: true,
    // 🔥 activa tu SequenceManager
  },
];
