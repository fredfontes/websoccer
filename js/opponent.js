import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Constantes ---
const OPPONENT_SPEED = 10.0; const OPPONENT_TURN_SPEED = Math.PI * 1.5; const CHASE_THRESHOLD = 25; const STOPPING_DISTANCE = 1.5;
const AI_KICK_STRENGTH = 18; const AI_KICK_THRESHOLD = STOPPING_DISTANCE + 0.2; const AI_KICK_COOLDOWN_TIME = 1.0; const AI_KICK_UP_ANGLE = 0.1;
const TARGET_GOAL_POS = new CANNON.Vec3(-105 / 2, 2.44 / 2, 0); const FIELD_WIDTH_HALF = 105 / 2; const FIELD_HEIGHT_HALF = 68 / 2; const PLAYER_HEIGHT = 1.8;
// ------------------

export class Opponent {
    constructor(mesh) {
        this.mesh = mesh; this.direction = new THREE.Vector3(-1, 0, 0);
        if (this.mesh.position) this.mesh.lookAt(this.mesh.position.clone().add(this.direction));
        this.velocity = new THREE.Vector3(); this.state = 'IDLE'; this.canKick = true; this.kickCooldown = 0;
    }

    update(deltaTime, ballBody/*, playerBody*/) {
        if (this.kickCooldown > 0) this.kickCooldown -= deltaTime; else this.canKick = true;
        if (!ballBody || !this.mesh) return;

        const ballPos = ballBody.position; const myPos = this.mesh.position;
        const vecToBall = new CANNON.Vec3(ballPos.x - myPos.x, 0, ballPos.z - myPos.z);
        const distanceToBall = vecToBall.length();

        // Lógica de Estado
        if (distanceToBall < CHASE_THRESHOLD) this.state = 'CHASING'; else this.state = 'IDLE';

        let moveTowardsTarget = false; let threeTargetDirection = new THREE.Vector3();

        // Ações baseadas no Estado
        if (this.state === 'CHASING') {
            if (distanceToBall < AI_KICK_THRESHOLD && this.canKick) { // Chute IA
                // console.log("IA Tentando Chutar!"); // Log opcional
                const kickDirection = TARGET_GOAL_POS.vsub(ballPos); kickDirection.y=0; kickDirection.normalize(); kickDirection.y = AI_KICK_UP_ANGLE; kickDirection.normalize();
                const impulse = kickDirection.scale(AI_KICK_STRENGTH); ballBody.applyImpulse(impulse, ballPos);
                this.canKick = false; this.kickCooldown = AI_KICK_COOLDOWN_TIME;
                this.velocity.set(0,0,0); moveTowardsTarget = false;
                if(distanceToBall > 0.1){ vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); }
            } else if (distanceToBall > STOPPING_DISTANCE) { // Perseguir
                moveTowardsTarget = true;
                if(distanceToBall > 0.1){ vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); } else { moveTowardsTarget = false; }
            } else { // Perto, parar
                moveTowardsTarget = false; this.velocity.set(0,0,0);
                if(distanceToBall > 0.1){ vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); }
            }
        } else if (this.state === 'IDLE') { // Parado
            moveTowardsTarget = false; this.velocity.set(0, 0, 0);
            if (distanceToBall > 0.1) { vecToBall.normalize(); threeTargetDirection.set(vecToBall.x, 0, vecToBall.z); }
        }

        // Define Velocidade
        if (moveTowardsTarget && threeTargetDirection.lengthSq() > 0.001) this.velocity.copy(threeTargetDirection).multiplyScalar(OPPONENT_SPEED);
        else this.velocity.set(0, 0, 0);

        // Aplica Rotação
        if (threeTargetDirection.lengthSq() > 0.001) {
            const angle = Math.atan2(threeTargetDirection.x, threeTargetDirection.z) - Math.atan2(this.direction.x, this.direction.z);
            let angleDiff = angle; if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI; if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), OPPONENT_TURN_SPEED * deltaTime);
            if (Math.abs(turn) > 0.01) { const rm = new THREE.Matrix4(); rm.makeRotationY(turn); this.direction.applyMatrix4(rm).normalize(); this.mesh.rotateY(turn); }
        }

        // Aplica Movimento
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(deltaPosition);

        // Limites e Altura
        this.mesh.position.x = Math.max(-FIELD_WIDTH_HALF, Math.min(FIELD_WIDTH_HALF, this.mesh.position.x));
        this.mesh.position.z = Math.max(-FIELD_HEIGHT_HALF, Math.min(FIELD_HEIGHT_HALF, this.mesh.position.z));
        this.mesh.position.y = PLAYER_HEIGHT / 2;
    }
}
// console.log("Classe Opponent definida (opponent.js)"); // Log opcional