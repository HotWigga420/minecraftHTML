import * as THREE from 'three';
import { PLAYER_SETTINGS } from './constants.js';
import { getBlock } from './world.js';

export const player = {
    pos: new THREE.Vector3(8, 8, 8),
    vel: new THREE.Vector3(0, 0, 0),
    onGround: false,
    flying: false,
    inWater: false,
    health: 20,
    hunger: 20,
    exp: 0
};

const keyState = {
    w: false, a: false, s: false, d: false,
    space: false, shift: false
};

export function initControls() {
    window.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'KeyW': keyState.w = true; e.preventDefault(); break;
            case 'KeyA': keyState.a = true; e.preventDefault(); break;
            case 'KeyS': keyState.s = true; e.preventDefault(); break;
            case 'KeyD': keyState.d = true; e.preventDefault(); break;
            case 'Space': keyState.space = true; e.preventDefault(); break;
            case 'ShiftLeft': case 'ShiftRight': keyState.shift = true; e.preventDefault(); break;
        }
    });
    window.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'KeyW': keyState.w = false; e.preventDefault(); break;
            case 'KeyA': keyState.a = false; e.preventDefault(); break;
            case 'KeyS': keyState.s = false; e.preventDefault(); break;
            case 'KeyD': keyState.d = false; e.preventDefault(); break;
            case 'Space': keyState.space = false; e.preventDefault(); break;
            case 'ShiftLeft': case 'ShiftRight': keyState.shift = false; e.preventDefault(); break;
        }
    });
}

export function updatePlayer(deltaTime, camera, blocksList) {
    if (!deltaTime) return;

    const settings = PLAYER_SETTINGS;
    const isSneaking = keyState.shift && player.onGround && !player.flying;

    // Проверка нахождения в воде
    player.inWater = isPlayerInWater();

    // Выбор гравитации в зависимости от воды
    const currentGravity = player.inWater ? settings.waterGravity : settings.gravity;
    const speedFactor = player.inWater ? settings.waterSlowdown : 1.0;
    const currentSpeed = settings.speed * speedFactor * deltaTime;

    // --- Передвижение ---
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();

    let moveDir = new THREE.Vector3(0, 0, 0);
    if (keyState.w) moveDir.add(dir);
    if (keyState.s) moveDir.sub(dir);
    if (keyState.a) moveDir.add(right);
    if (keyState.d) moveDir.sub(right);
    if (moveDir.length() > 0) moveDir.normalize().multiplyScalar(currentSpeed);

    // Приседание: замедление и проверка края
    if (isSneaking) {
        moveDir.multiplyScalar(0.5);
        // Проверка блока под ногами после смещения
        const testPos = player.pos.clone();
        testPos.x += moveDir.x;
        testPos.z += moveDir.z;
        if (!blockUnderFeet(testPos)) {
            moveDir.x = 0;
            moveDir.z = 0;
        }
    }

    // Горизонтальное перемещение с коллизиями
    let newPos = player.pos.clone();
    newPos.x += moveDir.x;
    if (!playerCollides(newPos, blocksList)) player.pos.x = newPos.x;
    newPos.x = player.pos.x;
    newPos.z += moveDir.z;
    if (!playerCollides(newPos, blocksList)) player.pos.z = newPos.z;

    // --- Вертикаль и вода ---
    const groundCheckPos = player.pos.clone();
    groundCheckPos.y -= 0.05;
    player.onGround = playerCollides(groundCheckPos, blocksList);

    if (player.inWater) {
        // Плавучесть
        if (keyState.space) {
            player.vel.y += settings.buoyancy * deltaTime;
        }
        if (!keyState.shift && player.vel.y < 0.5) {
            player.vel.y += 0.5 * deltaTime; // медленное всплытие
        }
        // Ограничение скорости падения в воде
        if (player.vel.y < -2) player.vel.y = -2;
    }

    // Гравитация и прыжок
    if (player.onGround && !player.flying) {
        player.vel.y = 0;
        if (keyState.space && !isSneaking) {
            player.vel.y = player.inWater ? settings.jumpSpeed * 0.6 : settings.jumpSpeed;
            player.onGround = false;
        }
    } else if (!player.flying) {
        player.vel.y -= currentGravity * deltaTime;
    }

    // Применение вертикальной скорости
    newPos = player.pos.clone();
    newPos.y += player.vel.y * deltaTime;
    if (playerCollides(newPos, blocksList)) {
        if (player.vel.y > 0) {
            player.vel.y = 0;
        } else {
            player.vel.y = 0;
            player.onGround = true;
        }
    } else {
        player.pos.y = newPos.y;
    }

    camera.position.copy(player.pos.clone().add(new THREE.Vector3(0, settings.eyeHeight, 0)));
}

function playerCollides(pos, blocksList) {
    const half = PLAYER_SETTINGS.width / 2;
    const minX = pos.x - half;
    const maxX = pos.x + half;
    const minY = pos.y;
    const maxY = pos.y + PLAYER_SETTINGS.height;
    const minZ = pos.z - half;
    const maxZ = pos.z + half;

    for (let mesh of blocksList) {
        const b = mesh.userData.position;
        if (maxX > b.x && minX < b.x + 1 &&
            maxY > b.y && minY < b.y + 1 &&
            maxZ > b.z && minZ < b.z + 1) {
            return true;
        }
    }
    return false;
}

function blockUnderFeet(pos) {
    const underPos = pos.clone();
    underPos.y -= 0.1;
    return playerCollides(underPos, getAllBlocks()); // требуется доступ к блокам
}

function isPlayerInWater() {
    // Проверяем блок, в котором находится центр игрока (или голова)
    const center = player.pos.clone().add(new THREE.Vector3(0, PLAYER_SETTINGS.height/2, 0));
    const bx = Math.floor(center.x);
    const by = Math.floor(center.y);
    const bz = Math.floor(center.z);
    const block = getBlock(bx, by, bz);
    return block && block.type === 4;
}

// Вспомогательная функция для получения всех блоков (передаётся из main)
let globalBlocksList = [];
export function setBlocksList(list) {
    globalBlocksList = list;
}
function getAllBlocks() {
    return globalBlocksList;
}