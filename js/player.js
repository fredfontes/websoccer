// --- LOG INICIAL ---
console.log("Player.js: Iniciando carregamento...");
// --------------------

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- LOG PÓS-IMPORTS ---
console.log("Player.js: Imports THREE e CANNON OK.");
// -----------------------


// --- Constantes ---
const PLAYER_SPEED = 12.0;
const PLAYER_TURN_SPEED = Math.PI * 1.8;
const FIELD_WIDTH_HALF = 105 / 2;
const FIELD_HEIGHT_HALF = 68 / 2;
const KICK_STRENGTH = 18; // Mantendo valor do chute anterior
const KICK_THRESHOLD = 1.5;
const KICK_UP_ANGLE = 0.15;
const DRIBBLING_ACQUIRE_THRESHOLD = 1.0;
const DRIBBLING_LOSE_THRESHOLD = 1.5;
const PLAYER_HEIGHT = 1.8;
// --- LOG FIM CONSTANTES ---
console.log("Player.js: Constantes definidas OK.");
// -------------------------


export class Player {
    constructor(mesh) {
        console.log("Player.js: Executando constructor..."); // Log dentro da classe
        this.mesh = mesh;
        this.direction = new THREE.Vector3(1, 0, 0);
        if (this.mesh && this.mesh.position) { // Checagem de segurança
            this.mesh.lookAt(this.mesh.position.clone().add(this.direction));
        } else {
             console.warn("Player Constructor: mesh ou mesh.position indefinido ao tentar lookAt.");
        }
        this.velocity = new THREE.Vector3();
        this.canKick = true;
        this.hasPossession = false;
        this.isMoving = false;
        console.log("Player.js: Constructor finalizado.");
    }

    update(deltaTime, controls, ballBody, isBallAttached) {
        // (Conteúdo do método update como estava na última versão funcional - sem logs extras aqui)
        // --- INICIO update ---
        let moveForward = 0; let turnAmount = 0; let desiredAction = { action: 'NONE' };
        if (controls.isKeyPressed('KeyW') || controls.isKeyPressed('ArrowUp')) moveForward = 1; else if (controls.isKeyPressed('KeyS') || controls.isKeyPressed('ArrowDown')) moveForward = -1;
        if (controls.isKeyPressed('KeyA') || controls.isKeyPressed('ArrowLeft')) turnAmount = PLAYER_TURN_SPEED * deltaTime; else if (controls.isKeyPressed('KeyD') || controls.isKeyPressed('ArrowRight')) turnAmount = -PLAYER_TURN_SPEED * deltaTime;
        this.isMoving = moveForward !== 0 || Math.abs(turnAmount) > 0.01;
        if (turnAmount !== 0) { const rm = new THREE.Matrix4(); rm.makeRotationY(turnAmount); this.direction.applyMatrix4(rm).normalize(); this.mesh.rotateY(turnAmount); }
        if (moveForward !== 0) this.velocity.copy(this.direction).multiplyScalar(moveForward * PLAYER_SPEED); else this.velocity.set(0, 0, 0);
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime); this.mesh.position.add(deltaPosition);
        this.mesh.position.x = Math.max(-FIELD_WIDTH_HALF, Math.min(FIELD_WIDTH_HALF, this.mesh.position.x)); this.mesh.position.z = Math.max(-FIELD_HEIGHT_HALF, Math.min(FIELD_HEIGHT_HALF, this.mesh.position.z));
        this.mesh.position.y = PLAYER_HEIGHT / 2;
        const kickKeyPressed = controls.isKeyPressed('Space');
        if (ballBody) {
            const distanceVec = new THREE.Vector3().subVectors(ballBody.position, this.mesh.position);
            distanceVec.y = 0; const distance = distanceVec.length();
            if (this.hasPossession) {
                if (kickKeyPressed && this.canKick) { desiredAction = { action: 'KICK', impulse: this._calculateKickImpulse() }; this.canKick = false; this.hasPossession = false; }
                else if (distance > DRIBBLING_LOSE_THRESHOLD || !this.isMoving) { desiredAction = { action: 'DETACH' }; this.hasPossession = false; }
            } else {
                if (this.isMoving && !isBallAttached && distance < DRIBBLING_ACQUIRE_THRESHOLD) { desiredAction = { action: 'ATTACH' }; this.hasPossession = true; }
                else if (kickKeyPressed && this.canKick && distance < KICK_THRESHOLD) { desiredAction = { action: 'KICK', impulse: this._calculateKickImpulse() }; this.canKick = false; }
            }
        }
        if (!kickKeyPressed) this.canKick = true;
        if (isNaN(this.mesh.position.x+this.mesh.position.y+this.mesh.position.z)) { console.error("!!! Player Pos NaN!", this.mesh.position); }
        return desiredAction;
        // --- FIM update ---
    }

    _calculateKickImpulse() {
        // (Função _calculateKickImpulse como antes)
        const impulseDirection = new CANNON.Vec3(this.direction.x, 0, this.direction.z); impulseDirection.normalize();
        impulseDirection.y = KICK_UP_ANGLE; impulseDirection.normalize();
        return impulseDirection.scale(KICK_STRENGTH);
    }
}

// --- LOG FINAL ---
console.log("Player.js: Classe Player exportada e arquivo lido até o fim.");
// -----------------