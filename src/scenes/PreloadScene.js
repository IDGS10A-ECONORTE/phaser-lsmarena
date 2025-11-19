import getSignAssets from "/src/data/signAssets.js";

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        // Color del fondo mientras carga
        this.cameras.main.setBackgroundColor("#000000");

        // Texto de carga
        this.add.text(20, 20, "Cargando assets...", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff"
        });

        // ===============================
        //  CARGAR SIGNOS DINÁMICAMENTE
        // ===============================
        const assets = getSignAssets();

        assets.forEach(a => {
            this.load.image(a.key, a.path);
        });

        console.log(">> Sign assets cargados:", assets.length);
    }

    create() {
        // Pasa a tu siguiente escena — cambia esto si tu flujo es distinto
        this.scene.start("IntroScene");
    }
}
