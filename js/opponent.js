// --- LOG INICIAL ---
console.log("Opponent.js: Iniciando carregamento...");
// --------------------

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- LOG PÓS-IMPORTS ---
console.log("Opponent.js: Imports THREE e CANNON OK.");
// -----------------------

// --- Constantes da IA ---
const OPPONENT_SPEED = 10.0;
const OPPONENT_TURN_SPEED = Math.PI * 1.5;
const CHASE_THRESHOLD = 25;
const STOPPING_DISTANCE = 1.5;
const AI_KICK_STRENGTH = 18;
const AI_KICK_THRESHOLD = STOPPING_DISTANCE + 0.2;
const AI_KICK_COOLDOWN_TIME = 1.0;
const AI_KICK_UP_ANGLE = 0.1;
// --- LOG ANTES DE USAR CANNON ---
console.log("Opponent.js: Definindo TARGET_GOAL_POS...");
const TARGET_GOAL_POS = new CANNON.Vec3(-105 / 2, 2.44 / 2, 0); // <<< Ponto crítico se CANNON falhou
// --- LOG DEPOIS DE USAR CANNON ---
console.log("Opponent.js: TARGET_GOAL_POS definido OK:", TARGET_GOAL_POS);
// ---------------------------------
const FIELD_WIDTH_HALF = 105 / 2;
const FIELD_HEIGHT_HALF = 68 / 2;
const PLAYER_HEIGHT = 1.8;
// --- LOG FIM CONSTANTES ---
console.log("Opponent.js: Constantes definidas OK.");
// -------------------------

export class Opponent {
    constructor(mesh) {
        console.log("Opponent.js: Executando constructor..."); // Log dentro da classe
        this.mesh = mesh;
        this.direction = new THREE.Vector3(-1, 0, 0);
        // Verifica se mesh e position existem antes de lookAt
        if (this.mesh && this.mesh.position) {
            this.mesh.lookAt(this.mesh.position.clone().add(this.direction));
        } else {
             console.warn("Opponent Constructor: mesh ou mesh.position indefinido ao tentar lookAt.");
        }
        this.velocity = new THREE.Vector3();
        this.state = 'IDLE';
        this.canKick = true;
        this.kickCooldown = 0;
        console.log("Opponent.js: Constructor finalizado.");
    }

    update(deltaTime, ballBody/*, playerBody*/) {
        // (Código do update como na última versão corrigida, sem logs extras aqui por enquanto)
        // ... (copie o conteúdo do update da resposta anterior se necessário) ...
        // --- INICIO update ---
        if (this.kickCooldown > 0) this.kickCooldown -= deltaTime; else this.canKick = true;
        if (!ballBody || !this.mesh) return;
        const ballPos = ballBody.position; const myPos = this.mesh.position;
        const vecToBall = new CANNON.Vec3(ballPos.x - myPos.x, 0, ballPos.z - myPos.z);
        const distanceToBall = vecToBall.length();
        const previousState = this.state;
        if (distanceToBall < CHASE_THRESHOLD) this.state = 'CHASING'; else this.state = 'IDLE';
        let moveTowardsTarget = false; let threeTargetDirection = new THREE.Vector3();
        if (this.state === 'CHASING') {
            if (distanceToBall < AI_KICK_THRESHOLD && this.canKick) {
                console.log("IA Tentando Chutar!");
                const kickDirection = TARGET_GOAL_POS.vsub(ballPos); kickDirection.y=0; kickDirection.normalize(); kickDirection.y = AI_KICK_UP_ANGLE; kickDirection.normalize();
                const impulse = kickDirection.scale(AI_KICK_STRENGTH); ballBody.applyImpulse(impulse, ballPos);
                this.canKick = false; this.kickCooldown = AI_KICK_COOLDOWN_TIME;
                this.velocity.set(0,0,0); moveTowardsTarget = false;
                if(distanceToBall > 0.1){ vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); }
            } else if (distanceToBall > STOPPING_DISTANCE) {
                moveTowardsTarget = true;
                if(distanceToBall > 0.1){ vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); } else { moveTowardsTarget = false; }
            } else {
                moveTowardsTarget = false; this.velocity.set(0,0,0);
                if(distanceToBall > 0.1){ vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); }
            }
        } else if (this.state === 'IDLE') {
            moveTowardsTarget = false; this.velocity.set(0, 0, 0);
            if (distanceToBall > 0.1) { vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); }
        }
        if (moveTowardsTarget && threeTargetDirection.lengthSq() > 0.001) this.velocity.copy(threeTargetDirection).multiplyScalar(OPPONENT_SPEED);
        else this.velocity.set(0, 0, 0);
        if (threeTargetDirection.lengthSq() > 0.001) {
            const angle = Math.atan2(threeTargetDirection.x, threeTargetDirection.z) - Math.atan2(this.direction.x, this.direction.z);
            let angleDiff = angle; if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI; if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), OPPONENT_TURN_SPEED * deltaTime);
            if (Math.abs(turn) > 0.01) { const rm = new THREE.Matrix4(); rm.makeRotationY(turn); this.direction.applyMatrix4(rm).normalize(); this.mesh.rotateY(turn); }
        }
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime); this.mesh.position.add(deltaPosition);
        this.mesh.position.x = Math.max(-FIELD_WIDTH_HALF, Math.min(FIELD_WIDTH_HALF, this.mesh.position.x));
        this.mesh.position.z = Math.max(-FIELD_HEIGHT_HALF, Math.min(FIELD_HEIGHT_HALF, this.mesh.position.z));
        this.mesh.position.y = PLAYER_HEIGHT / 2;
        // --- FIM update ---
    }
}

// --- LOG FINAL ---
console.log("Opponent.js: Classe Opponent exportada e arquivo lido até o fim.");
// -----------------