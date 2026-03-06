import { player } from './player.js';

export function updateUI() {
    document.getElementById('coord-display').innerText = 
        `${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}, ${player.pos.z.toFixed(1)}`;
    
    // Обновление полосок здоровья, голода, опыта
    const healthPercent = (player.health / 20) * 100;
    const hungerPercent = (player.hunger / 20) * 100;
    const expPercent = player.exp; // предположим от 0 до 100

    document.getElementById('health-fill').style.width = healthPercent + '%';
    document.getElementById('hunger-fill').style.width = hungerPercent + '%';
    document.getElementById('exp-fill').style.width = expPercent + '%';
}