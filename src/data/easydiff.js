const easydiff = [

    // ====== ABECEDARIO A-Z y Numeros 0-9 ======
    ...[..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(letter => ({
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
