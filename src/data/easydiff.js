const easydiff = [
    // ====== NÚMEROS 0 - 9 ======
    {
        id: "0",
        word: "Cero (0)",
        images: {
            square: "assets/signos/0.png",
            circle: "assets/signos2/0.png"
        },
        description: "Representación en LSM del número 0.",
        difficulty: "easy"
    },
    {
        id: "1",
        word: "Uno (1)",
        images: {
            square: "assets/signos/1.png",
            circle: "assets/signos2/1.png"
        },
        description: "Representación en LSM del número 1.",
        difficulty: "easy"
    },
    {
        id: "2",
        word: "Dos (2)",
        images: {
            square: "assets/signos/2.png",
            circle: "assets/signos2/2.png"
        },
        description: "Representación en LSM del número 2.",
        difficulty: "easy"
    },
    {
        id: "3",
        word: "Tres (3)",
        images: {
            square: "assets/signos/3.png",
            circle: "assets/signos2/3.png"
        },
        description: "Representación en LSM del número 3.",
        difficulty: "easy"
    },
    {
        id: "4",
        word: "Cuatro (4)",
        images: {
            square: "assets/signos/4.png",
            circle: "assets/signos2/4.png"
        },
        description: "Representación en LSM del número 4.",
        difficulty: "easy"
    },
    {
        id: "5",
        word: "Cinco (5)",
        images: {
            square: "assets/signos/5.png",
            circle: "assets/signos2/5.png"
        },
        description: "Representación en LSM del número 5.",
        difficulty: "easy"
    },
    {
        id: "6",
        word: "Seis (6)",
        images: {
            square: "assets/signos/6.png",
            circle: "assets/signos2/6.png"
        },
        description: "Representación en LSM del número 6.",
        difficulty: "easy"
    },
    {
        id: "7",
        word: "Siete (7)",
        images: {
            square: "assets/signos/7.png",
            circle: "assets/signos2/7.png"
        },
        description: "Representación en LSM del número 7.",
        difficulty: "easy"
    },
    {
        id: "8",
        word: "Ocho (8)",
        images: {
            square: "assets/signos/8.png",
            circle: "assets/signos2/8.png"
        },
        description: "Representación en LSM del número 8.",
        difficulty: "easy"
    },
    {
        id: "9",
        word: "Nueve (9)",
        images: {
            square: "assets/signos/9.png",
            circle: "assets/signos2/9.png"
        },
        description: "Representación en LSM del número 9.",
        difficulty: "easy"
    },

    // ====== ABECEDARIO A-Z ======
    ...[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(letter => ({
        id: letter.toLowerCase(),
        word: letter,
        images: {
            square: `assets/signos/${letter}.png`,
            circle: `assets/signos2/${letter}.png`
        },
        description: `Representación en LSM de la letra ${letter}.`,
        difficulty: "easy"
    }))
];

export default easydiff;
