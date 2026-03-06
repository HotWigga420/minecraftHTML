import * as THREE from 'three';
import { generateWorld, getAllBlocks, removeBlock, addBlock, getBlock } from './world.js';
import { player, initControls, updatePlayer, setBlocksList } from './player.js';
import { updateUI } from './ui.js';
import { BLOCK_TYPES } from './constants.js';

// --- Сцена, камера, рендерер ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.width = 512;  // снижено качество теней
renderer.shadowMap.height = 512;
document.body.appendChild(renderer.domElement);

// --- Освещение упрощённое ---
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5d1, 1.0);
sunLight.position.set(20, 30, 10);
sunLight.castShadow = true;
sunLight.receiveShadow = true;
sunLight.shadow.mapSize.width = 512;
sunLight.shadow.mapSize.height = 512;
const d = 30;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 50;
scene.add(sunLight);

// --- Генерация мира ---
generateWorld(scene);

// --- Подготовка списка блоков для коллизий ---
function updateBlocksList() {
    setBlocksList(getAllBlocks());
}
updateBlocksList();

// --- Управление ---
initControls();

// --- Переменные для взаимодействия с блоками (мышь) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);

function onMouseDown(e) {
    if (document.pointerLockElement !== renderer.domElement) return;
    e.preventDefault();

    raycaster.setFromCamera(mouse, camera);
    raycaster.far = 5;

    const intersects = raycaster.intersectObjects(getAllBlocks());

    if (intersects.length > 0) {
        const hit = intersects[0];
        const blockMesh = hit.object;
        const blockPos = blockMesh.userData.position;

        if (e.button === 0) { // ЛКМ - разрушить
            removeBlock(blockPos.x, blockPos.y, blockPos.z, scene);
            updateBlocksList();
        } else if (e.button === 2) { // ПКМ - построить
            const normal = hit.face.normal.clone();
            const newPos = {
                x: blockPos.x + normal.x,
                y: blockPos.y + normal.y,
                z: blockPos.z + normal.z
            };
            if (!getBlock(newPos.x, newPos.y, newPos.z)) {
                addBlock(newPos.x, newPos.y, newPos.z, currentBlockType, scene);
                updateBlocksList();
            }
        }
    }
}

// --- Блокировка мыши ---
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
    } else {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mousedown', onMouseDown);
    }
});

let pitch = 0, yaw = 0;
const mouseSensitivity = 0.002;
function onMouseMove(e) {
    yaw -= e.movementX * mouseSensitivity;
    pitch -= e.movementY * mouseSensitivity;
    pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch, yaw, 0);
}

window.addEventListener('contextmenu', e => e.preventDefault());

// --- Инвентарь и выбор блока ---
let currentBlockType = 3;
window.setCurrentBlock = (type) => {
    currentBlockType = type;
    const block = BLOCK_TYPES[type];
    document.getElementById('block-type-text').innerText = block.name;
    document.getElementById('block-color-preview').style.backgroundColor = block.hex;
    // Подсветка в инвентаре...
};
window.setCurrentBlock(3);

// --- Цикл анимации ---
const clock = new THREE.Clock();

function animate() {
    const deltaTime = Math.min(clock.getDelta(), 0.1);
    updatePlayer(deltaTime, camera, getAllBlocks());
    updateUI();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// --- Ресайз ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Обработка клавиш для полёта и инвентаря (добавить в player.js, но для краткости оставим здесь) ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
        player.flying = !player.flying;
        document.getElementById('flight-mode').innerText = player.flying ? 'Полет' : 'Обычный';
        e.preventDefault();
    }
    if (e.code === 'KeyB') {
        const panel = document.getElementById('inventory-panel');
        if (panel.style.visibility === 'hidden') {
            panel.style.visibility = 'visible';
            panel.style.opacity = '1';
        } else {
            panel.style.visibility = 'hidden';
            panel.style.opacity = '0';
        }
        e.preventDefault();
    }
    // 1-4 выбор блока
    if (e.code === 'Digit1') setCurrentBlock(1);
    if (e.code === 'Digit2') setCurrentBlock(2);
    if (e.code === 'Digit3') setCurrentBlock(3);
    if (e.code === 'Digit4') setCurrentBlock(4);
});