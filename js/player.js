import * as THREE from 'three';

// Constantes de movimento (ajuste conforme necessário)
const PLAYER_SPEED = 15.0; // Unidades por segundo
const PLAYER_TURN_SPEED = Math.PI * 1.5; // Radianos por segundo

export class Player {
    constructor(mesh, startPosition = new THREE.Vector3(-10, mesh.geometry.parameters.height / 2 , 0)) {
        this.mesh = mesh; // A representação visual (THREE.Mesh)
        this.mesh.position.copy(startPosition);

        // Vetor para indicar a direção para onde o jogador está olhando/se movendo
        this.direction = new THREE.Vector3(1, 0, 0); // Começa olhando para frente (eixo X+)

        // Estado (simplificado)
        this.velocity = new THREE.Vector3(); // Velocidade atual
    }

    /**
     * Atualiza a posição e rotação do jogador com base nos inputs.
     * @param {number} deltaTime - O tempo decorrido desde o último frame.
     * @param {object} controls - O objeto de controles (com isKeyPressed).
     */
    update(deltaTime, controls) {
        const moveDirection = new THREE.Vector3(0, 0, 0);
        let isMoving = false;
        let turnAmount = 0; // Quanto virar neste frame

        // Input de Movimento (WASD)
        if (controls.isKeyPressed('KeyW') || controls.isKeyPressed('ArrowUp')) {
            moveDirection.add(this.direction); // Mover na direção atual
            isMoving = true;
        }
        if (controls.isKeyPressed('KeyS') || controls.isKeyPressed('ArrowDown')) {
            moveDirection.sub(this.direction); // Mover na direção oposta
            isMoving = true;
        }

        // Input de Rotação (A/D)
        if (controls.isKeyPressed('KeyA') || controls.isKeyPressed('ArrowLeft')) {
            turnAmount += PLAYER_TURN_SPEED * deltaTime;
        }
        if (controls.isKeyPressed('KeyD') || controls.isKeyPressed('ArrowRight')) {
            turnAmount -= PLAYER_TURN_SPEED * deltaTime;
        }

        // Aplicar Rotação
        if (turnAmount !== 0) {
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationY(turnAmount); // Cria matriz de rotação em torno do eixo Y
            this.direction.applyMatrix4(rotationMatrix); // Rotaciona o vetor de direção
            this.mesh.rotateY(turnAmount); // Rotaciona o mesh visual
        }

        // Normaliza a direção do movimento se houve input
        if (isMoving) {
             // Define a velocidade na direção do movimento
             this.velocity.copy(moveDirection.normalize().multiplyScalar(PLAYER_SPEED));
        } else {
            this.velocity.set(0, 0, 0); // Parar se nenhuma tecla de movimento for pressionada
        }


        // Aplicar Movimento (posição += velocidade * tempo)
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(deltaPosition);

        // Simples colisão com as bordas do campo (aproximado)
        const fieldWidthHalf = 105 / 2;
        const fieldHeightHalf = 68 / 2;
        this.mesh.position.x = Math.max(-fieldWidthHalf, Math.min(fieldWidthHalf, this.mesh.position.x));
        this.mesh.position.z = Math.max(-fieldHeightHalf, Math.min(fieldHeightHalf, this.mesh.position.z));

        // TODO: Implementar lógica de chute, passe, carrinho, etc.
        // if (controls.isKeyPressed('Space')) { /* Chutar */ }
        // if (controls.isKeyPressed('KeyX')) { /* Passar */ }
    }

    // --- Outros métodos potenciais ---
    // shoot() {}
    // pass() {}
    // tackle() {}
}