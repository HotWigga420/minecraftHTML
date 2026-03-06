import * as THREE from 'three';
import { BLOCK_TYPES } from './constants.js';

const blocks = new Map(); // ключ "x y z" -> { type, mesh }

export function addBlock(x, y, z, type, scene) {
    const key = `${x} ${y} ${z}`;
    if (blocks.has(key)) return null;

    const blockInfo = BLOCK_TYPES[type];
    const color = blockInfo.color;

    const material = new THREE.MeshStandardMaterial({
        color: color,
        transparent: blockInfo.transparent || false,
        opacity: blockInfo.opacity || 1.0
    });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.position.set(x + 0.5, y + 0.5, z + 0.5);
    cube.userData = { type, position: { x, y, z } };

    scene.add(cube);
    blocks.set(key, { type, mesh: cube });
    return cube;
}

export function removeBlock(x, y, z, scene) {
    const key = `${x} ${y} ${z}`;
    if (blocks.has(key)) {
        const block = blocks.get(key);
        scene.remove(block.mesh);
        blocks.delete(key);
    }
}

export function getBlock(x, y, z) {
    return blocks.get(`${x} ${y} ${z}`);
}

export function getAllBlocks() {
    return Array.from(blocks.values()).map(b => b.mesh);
}

export function generateWorld(scene) {
    const worldSize = 24; // уменьшено для производительности
    const half = worldSize / 2;

    for (let x = -half; x < half; x++) {
        for (let z = -half; z < half; z++) {
            let noise = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 3;
            let extraLayers = Math.floor(noise + 2);

            addBlock(x, 0, z, 3, scene); // камень
            addBlock(x, 1, z, 2, scene); // земля
            addBlock(x, 2, z, 1, scene); // трава

            for (let i = 3; i < 3 + extraLayers; i++) {
                if (i === 3 + extraLayers - 1) {
                    addBlock(x, i, z, 1, scene); // трава сверху
                } else {
                    addBlock(x, i, z, 2, scene); // земля
                }
            }
        }
    }

    // Небольшой водоём для теста физики
    addBlock(0, 3, 0, 4, scene);
    addBlock(1, 3, 0, 4, scene);
    addBlock(0, 3, 1, 4, scene);
}