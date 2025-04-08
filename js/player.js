import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Constantes ---
const PLAYER_SPEED = 12.0; const PLAYER_SPRINT_SPEED = 20.0;
const SPRINT_DURATION = 1.0; const BOOST_DURATION = 0.15;
const PLAYER_TURN_SPEED = Math.PI * 1.8;
const FIELD_WIDTH_HALF = 105 / 2; const FIELD_HEIGHT_HALF = 68 / 2;
const KICK_STRENGTH = 18; const KICK_THRESHOLD = 1.5; const KICK_UP_ANGLE = 0.15;
const DRIBBLING_ACQUIRE_THRESHOLD = 1.0; const DRIBBLING_LOSE_THRESHOLD = 1.5;
const PLAYER_HEIGHT = 1.8;
// Novas Constantes do Drible Especial
const DRIBBLE_MOVE_DURATION = 0.2; // Duração curta do movimento lateral
const DRIBBLE_MOVE_SPEED = 15.0; // Velocidade do movimento lateral
// ------------------

export class Player {
    constructor(mesh) {
        this.mesh = mesh; this.direction = new THREE.Vector3(1, 0, 0);
        if (this.mesh.position) this.mesh.lookAt(this.mesh.position.clone().add(this.direction));
        this.velocity = new THREE.Vector3(); this.canKick = true; this.hasPossession = false; this.isMoving = false;
        this.sprintTimer = 0; this.boostTimer = 0; this.canSprint = true; this.wasShiftPressedLastFrame = false;

        // --- Novas Variáveis de Estado para Drible Especial ---
        this.isDribbleMoving = false;
        this.dribbleMoveTimer = 0;
        // THREE.Vector3 para guardar a direção do drible atual (relativa ao mundo)
        this.dribbleMoveDirection = new THREE.Vector3();
        // ----------------------------------------------------
    }

    update(deltaTime, controls, ballBody, isBallAttached) {
        let desiredAction = { action: 'NONE' };

        // --- Processa Drible Especial ATIVO ---
        if (this.isDribbleMoving) {
            this.dribbleMoveTimer -= deltaTime;
            if (this.dribbleMoveTimer <= 0) {
                this.isDribbleMoving = false;
                console.log("Fim do Drible Especial");
                this.velocity.set(0,0,0); // Para ao terminar
            } else {
                // Define a velocidade puramente lateral durante o drible
                this.velocity.copy(this.dribbleMoveDirection).multiplyScalar(DRIBBLE_MOVE_SPEED);
                 // Impede outras ações enquanto dribla
                this.isMoving = true; // Considera que está movendo
                // Não checa posse/chute aqui
            }
        }
        // ------------------------------------
        else { // Só processa movimento normal, sprint, posse, chute se NÃO estiver no drible especial
            let moveForward = 0; let turnAmount = 0;

            // --- Movimento e Rotação Input ---
            if (controls.isKeyPressed('KeyW') || controls.isKeyPressed('ArrowUp')) moveForward = 1;
            else if (controls.isKeyPressed('KeyS') || controls.isKeyPressed('ArrowDown')) moveForward = -1;
            if (controls.isKeyPressed('KeyA') || controls.isKeyPressed('ArrowLeft')) turnAmount = PLAYER_TURN_SPEED * deltaTime;
            else if (controls.isKeyPressed('KeyD') || controls.isKeyPressed('ArrowRight')) turnAmount = -PLAYER_TURN_SPEED * deltaTime;
            this.isMoving = moveForward !== 0 || Math.abs(turnAmount) > 0.01;
            // --- Fim Movimento Input ---

            // --- Gatilho do Drible Especial ---
            // Verifica se Control foi pressionado AGORA, se tem posse e não está já driblando
            const ctrlPressed = controls.isKeyJustPressed('ControlLeft') || controls.isKeyJustPressed('ControlRight');
            if (ctrlPressed && this.hasPossession && !this.isDribbleMoving) {
                console.log("Iniciando Drible Especial!");
                this.isDribbleMoving = true;
                this.dribbleMoveTimer = DRIBBLE_MOVE_DURATION;

                // Calcula direção lateral baseada em A/D (ou padrão Direita)
                const rightVec = new THREE.Vector3().crossVectors(this.direction, new THREE.Vector3(0,1,0)).normalize(); // Vetor para a direita do jogador
                if (controls.isKeyPressed('KeyA') || controls.isKeyPressed('ArrowLeft')) {
                    this.dribbleMoveDirection.copy(rightVec).negate(); // Vai para a Esquerda
                    console.log("Drible para Esquerda");
                } else { // Se D, ou nada, ou W/S apenas
                    this.dribbleMoveDirection.copy(rightVec); // Vai para a Direita (padrão)
                    console.log("Drible para Direita");
                }
                // Define a velocidade inicial do drible
                this.velocity.copy(this.dribbleMoveDirection).multiplyScalar(DRIBBLE_MOVE_SPEED);
                // Pula o resto da lógica de movimento/posse/chute neste frame
                moveForward = 0; // Garante que não haja movimento normal sobreposto
                turnAmount = 0; // Garante que não haja rotação normal sobreposta
            }
            // --- Fim Gatilho Drible ---

             // Só executa se NÃO iniciou um drible especial neste frame
            if (!this.isDribbleMoving) {
                // --- Lógica Sprint/Boost (como antes) ---
                const isShiftPressed = controls.isKeyPressed('ShiftLeft') || controls.isKeyPressed('ShiftRight');
                if (this.sprintTimer > 0) this.sprintTimer -= deltaTime;
                if (this.boostTimer > 0) this.boostTimer -= deltaTime;
                if (isShiftPressed && !this.wasShiftPressedLastFrame && this.canSprint) { this.sprintTimer = SPRINT_DURATION; this.boostTimer = BOOST_DURATION; this.canSprint = false; }
                let currentSpeed = PLAYER_SPEED;
                if (this.sprintTimer > 0 && isShiftPressed) currentSpeed = PLAYER_SPRINT_SPEED;
                else if (this.boostTimer > 0) currentSpeed = PLAYER_SPRINT_SPEED;
                else this.canSprint = true;
                this.wasShiftPressedLastFrame = isShiftPressed;
                // --- Fim Sprint/Boost ---

                // --- Rotação ---
                if (turnAmount !== 0) { const rm = new THREE.Matrix4(); rm.makeRotationY(turnAmount); this.direction.applyMatrix4(rm).normalize(); this.mesh.rotateY(turnAmount); }
                // --------------

                // --- Movimento Normal/Sprint ---
                if (moveForward !== 0) this.velocity.copy(this.direction).multiplyScalar(moveForward * currentSpeed);
                else this.velocity.set(0, 0, 0);
                // -----------------------------

                 // --- Lógica de Posse e Chute (como antes) ---
                 const kickKeyPressed = controls.isKeyPressed('Space');
                 if (ballBody) {
                     const distanceVec = new THREE.Vector3().subVectors(ballBody.position, this.mesh.position); distanceVec.y = 0; const distance = distanceVec.length();
                     if (this.hasPossession) { // Tem a posse
                         if (kickKeyPressed && this.canKick) { desiredAction = { action: 'KICK', impulse: this._calculateKickImpulse() }; this.canKick = false; this.hasPossession = false; }
                         else if (distance > DRIBBLING_LOSE_THRESHOLD || !this.isMoving) { desiredAction = { action: 'DETACH' }; this.hasPossession = false; }
                     } else { // Não tem posse
                         // Adicionado check !this.isDribbleMoving aqui também por segurança
                         if (this.isMoving && !isBallAttached && !this.isDribbleMoving && distance < DRIBBLING_ACQUIRE_THRESHOLD && currentSpeed < PLAYER_SPRINT_SPEED) { desiredAction = { action: 'ATTACH' }; this.hasPossession = true; }
                         else if (kickKeyPressed && this.canKick && distance < KICK_THRESHOLD) { console.log("Chute!"); desiredAction = { action: 'KICK', impulse: this._calculateKickImpulse() }; this.canKick = false; }
                     }
                 }
                 if (!kickKeyPressed) this.canKick = true;
                 // --- Fim Lógica Posse/Chute ---
            }
        } // Fim do else (!this.isDribbleMoving)

        // Aplica Movimento FINAL (seja normal, sprint ou drible especial)
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(deltaPosition);

        // Limites e Altura
        this.mesh.position.x = Math.max(-FIELD_WIDTH_HALF, Math.min(FIELD_WIDTH_HALF, this.mesh.position.x));
        this.mesh.position.z = Math.max(-FIELD_HEIGHT_HALF, Math.min(FIELD_HEIGHT_HALF, this.mesh.position.z));
        this.mesh.position.y = PLAYER_HEIGHT / 2;

        if (isNaN(this.mesh.position.x+this.mesh.position.y+this.mesh.position.z)) { console.error("!!! Player Pos NaN!", this.mesh.position); }
        return desiredAction;
    }

    _calculateKickImpulse() { const impulseDirection = new CANNON.Vec3(this.direction.x, 0, this.direction.z); impulseDirection.normalize(); impulseDirection.y = KICK_UP_ANGLE; impulseDirection.normalize(); return impulseDirection.scale(KICK_STRENGTH); }
}
console.log("Classe Player atualizada com Drible Especial definida (player.js)");