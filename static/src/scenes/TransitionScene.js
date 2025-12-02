export default class TransitionScene extends Phaser.Scene {
  constructor() {
    super("TransitionScene");
  }

  init(data) {
    this.fromScene = data.fromScene;
    this.toScene = data.toScene;
  }

  preload() {
    this.load.image("transitionBg", "/static/assets/109.png");

    this.load.image("bebidas1", "/static/assets/transitions/bebidas1.png");
    this.load.image("bebidas2", "/static/assets/transitions/bebidas2.png");
    this.load.image("bebidas3", "/static/assets/transitions/bebidas3.png");

    this.load.image("casual1", "/static/assets/transitions/casual1.png");
    this.load.image("casual2", "/static/assets/transitions/casual2.png");
    this.load.image("casual3", "/static/assets/transitions/casual3.png");
    this.load.image("casual4", "/static/assets/transitions/casual4.png");
    this.load.image("casual5", "/static/assets/transitions/casual5.png");
    this.load.image("casual6", "/static/assets/transitions/casual6.png");

    this.load.image("colores1", "/static/assets/transitions/colores1.png");
    this.load.image("colores2", "/static/assets/transitions/colores2.png");
    this.load.image("colores3", "/static/assets/transitions/colores3.png");

    this.load.image("comidas1", "/static/assets/transitions/comidas1.png");
    this.load.image("comidas2", "/static/assets/transitions/comidas2.png");
    this.load.image("comidas3", "/static/assets/transitions/comidas3.png");

    this.load.image("cuerpo1", "/static/assets/transitions/cuerpo1.png");
    this.load.image("cuerpo2", "/static/assets/transitions/cuerpo2.png");
    this.load.image("cuerpo3", "/static/assets/transitions/cuerpo3.png");

    this.load.image("dias1", "/static/assets/transitions/dias1.png");

    this.load.image("frutas1", "/static/assets/transitions/frutas1.png");
    this.load.image("frutas2", "/static/assets/transitions/frutas2.png");
    this.load.image("frutas3", "/static/assets/transitions/frutas3.png");

    this.load.image("meses1", "/static/assets/transitions/meses1.png");

    this.load.image("numeros1", "/static/assets/transitions/numeros1.png");

    this.load.image("salud1", "/static/assets/transitions/salud1.png");
    this.load.image("salud2", "/static/assets/transitions/salud2.png");
    this.load.image("salud3", "/static/assets/transitions/salud3.png");
    this.load.image("salud4", "/static/assets/transitions/salud4.png");
    this.load.image("salud5", "/static/assets/transitions/salud5.png");

    this.load.image("saludos1", "/static/assets/transitions/saludos1.png");

    this.load.image("tiempo1", "/static/assets/transitions/tiempo1.png");
    this.load.image("tiempo2", "/static/assets/transitions/tiempo2.png");

    this.load.image("verbos1", "/static/assets/transitions/verbos1.png");
    this.load.image("verbos2", "/static/assets/transitions/verbos2.png");
    this.load.image("verbos3", "/static/assets/transitions/verbos3.png");
  }

  create() {
    const { width, height } = this.game.config;

    // -----------------------------
    // FONDO
    // -----------------------------
    this.add
      .image(0, 0, "transitionBg")
      .setOrigin(0)
      .setDisplaySize(width, height);

    // -----------------------------
    // Capa negra difuminada
    // -----------------------------
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

    // -----------------------------
    // Selección aleatoria de imagen + texto
    // -----------------------------
    const transitions = [
      // Bebidas
      { img: "bebidas1", text: "Refrescando tu experiencia..." },
      { img: "bebidas2", text: "Servimos diversión..." },
      { img: "bebidas3", text: "Momento de hidratación..." },

      // Casual
      { img: "casual1", text: "Preparando sorpresas..." },
      { img: "casual2", text: "Casi listos para jugar..." },
      { img: "casual3", text: "Un instante más..." },
      { img: "casual4", text: "Cargando diversión..." },
      { img: "casual5", text: "A punto de empezar..." },
      { img: "casual6", text: "¡Listos para la acción!" },

      // Colores
      { img: "colores1", text: "Pintando aventuras..." },
      { img: "colores2", text: "Colores que inspiran..." },
      { img: "colores3", text: "Arte en movimiento..." },

      // Comidas
      { img: "comidas1", text: "Sabores en camino..." },
      { img: "comidas2", text: "Cocinando diversión..." },
      { img: "comidas3", text: "Un bocado de emoción..." },

      // Cuerpo
      { img: "cuerpo1", text: "Activando músculos..." },
      { img: "cuerpo2", text: "Prepara tus gestos..." },
      { img: "cuerpo3", text: "Movimiento en acción..." },

      // Días
      { img: "dias1", text: "Cada día una aventura..." },

      // Frutas
      { img: "frutas1", text: "Dulces momentos..." },
      { img: "frutas2", text: "Vitaminas de diversión..." },
      { img: "frutas3", text: "Frutas y juegos..." },

      // Meses
      { img: "meses1", text: "El tiempo avanza..." },

      // Números
      { img: "numeros1", text: "Contando emociones..." },

      // Salud
      { img: "salud1", text: "Cuidando tu bienestar..." },
      { img: "salud2", text: "Momento saludable..." },
      { img: "salud3", text: "Salud y diversión..." },
      { img: "salud4", text: "Recargando energía..." },
      { img: "salud5", text: "Actívate y juega..." },

      // Saludos
      { img: "saludos1", text: "Un saludo especial..." },

      // Tiempo
      { img: "tiempo1", text: "El reloj avanza..." },
      { img: "tiempo2", text: "Tiempo de aventura..." },

      // Verbos
      { img: "verbos1", text: "Acción en marcha..." },
      { img: "verbos2", text: "Movimientos listos..." },
      { img: "verbos3", text: "¡A ejecutar!" },
    ];

    const randomIndex = Phaser.Math.Between(0, transitions.length - 1);
    const { img, text } = transitions[randomIndex];

    // -----------------------------
    // Texto tipo título en la parte superior
    // -----------------------------
    const titlePadding = 20;
    const titleStyle = {
      fontFamily: "Arial",
      fontSize: "48px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width * 0.9 },
    };

    const titleText = this.add
      .text(width / 2, height * 0.15, text, titleStyle)
      .setOrigin(0.5);

    // Fondo translúcido detrás del texto
    const bgTitle = this.add
      .rectangle(
        width / 2,
        titleText.y,
        titleText.width + titlePadding,
        titleText.height + titlePadding,
        0x000000,
        0.5
      )
      .setOrigin(0.5);

    titleText.setDepth(1);

    // -----------------------------
    // Imagen más pequeña centrada debajo del título
    // -----------------------------
    const imgSprite = this.add
      .image(width / 2, height * 0.5, img)
      .setOrigin(0.5);
    imgSprite.setDisplaySize(imgSprite.width * 1.3, imgSprite.height * 1.3); // 50% tamaño original

    // -----------------------------
    // Círculo de carga animado horizontal
    // -----------------------------
    const bottomMargin = 100;
    const centerX = width / 2;
    const circle = this.add.circle(
      centerX,
      height - bottomMargin,
      25,
      0xffffff,
      0.8
    );

    this.tweens.add({
      targets: circle,
      x: centerX + 600,
      repeat: -1,
      yoyo: true,
      duration: 500,
      ease: "Sine.easeInOut",
    });

    // -----------------------------
    // Pasar a la escena destino después de 1.2 segundos
    // -----------------------------
    this.time.delayedCall(3500, () => {
      if (this.toScene) {
        this.scene.start(this.toScene);
      } else {
        console.warn("No se especificó escena destino para la transición.");
      }
    });
  }
}
