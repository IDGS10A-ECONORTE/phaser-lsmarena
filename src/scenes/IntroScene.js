export default class IntroScene extends Phaser.Scene {

    constructor() {
        super('IntroScene');
    }

    preload() {
        this.load.image('background', 'assets/space.png');
        this.load.image('logo', 'assets/phaser.png');
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
    }

    create() {
        this.background = this.add.tileSprite(800, 450, 1600, 900, 'background');

        const logo = this.add.image(800, 300, 'logo');

        const ship = this.add.sprite(800, 450, 'ship');

        ship.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
            frameRate: 15,
            repeat: -1
        });

        ship.play('fly');

        this.tweens.add({
            targets: ship,
            y: 400,
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            loop: -1
        });
    }

    update() {
        this.background.tilePositionX += 2;
    }
    
}
