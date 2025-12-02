const normaldiff = [
  // ====== ABECEDARIO A-Z y Numeros 0-9 ======
  ...[..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => ({
    id: letter.toLowerCase(),
    word: letter,
    images: {
      square: `/static/assets/signos/${letter}.png`,
      circle: `/static/assets/signos2/${letter}.png`,
    },
    description: `Representación en LSM de la letra ${letter}.`,
    difficulty: "easy",
  })),
];

export default normaldiff;
