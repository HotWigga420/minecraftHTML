export const BLOCK_TYPES = {
    1: { name: 'Трава', color: 0x7cfc00, hex: '#7cfc00' },
    2: { name: 'Земля', color: 0x8b4513, hex: '#8b4513' },
    3: { name: 'Камень', color: 0x808080, hex: '#808080' },
    4: { name: 'Вода', color: 0x3366ff, hex: '#3366ff', transparent: true, opacity: 0.7 }
};

export const PLAYER_SETTINGS = {
    height: 1.8,
    width: 0.6,
    eyeHeight: 1.6,
    speed: 5.0,
    jumpSpeed: 8.0,
    gravity: 15.0,
    waterGravity: 5.0,
    waterSlowdown: 0.5,
    buoyancy: 2.0
};