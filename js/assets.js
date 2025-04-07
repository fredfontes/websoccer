import * as THREE from 'three';

const FIELD_WIDTH = 105;
const FIELD_HEIGHT = 68;
const PLAYER_RADIUS = 0.8;
const PLAYER_HEIGHT = 1.8; // Altura simbólica para o placeholder
const BALL_RADIUS = 0.22;

/**
 * Cria e retorna o mesh do campo de futebol.
 */
export function createField() {
    const fieldGeometry = new THREE.PlaneGeometry(FIELD_WIDTH, FIELD_HEIGHT);
    // Carregador de Textura (Substitua 'path/to/your/grass_texture.jpg' pelo caminho real)
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg'); // Exemplo
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(16, 10); // Repetição da textura

    const fieldMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        color: 0x559055, // Tonalidade verde por baixo da textura
        roughness: 0.8,
        metalness: 0.1
    });

    const fieldMesh = new THREE.Mesh(fieldGeometry, fieldMaterial);
    fieldMesh.rotation.x = -Math.PI / 2; // Deita o plano no eixo XZ
    fieldMesh.position.y = 0; // Nível do chão
    fieldMesh.receiveShadow = true; // Campo recebe sombras
    return fieldMesh;
}

/**
 * Cria e retorna o mesh da bola.
 */
export function createBall() {
    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // Branca básica
        roughness: 0.5,
        metalness: 0.2
    });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.position.set(0, BALL_RADIUS, 0); // Posição inicial no centro, acima do chão
    ballMesh.castShadow = true; // Bola projeta sombra
    return ballMesh;
}

/**
 * Cria e retorna um mesh placeholder para o jogador.
 * @param {boolean} isOpponent - Define a cor se for oponente.
 */
export function createPlayerPlaceholder(isOpponent = false) {
    // Usando uma cápsula como placeholder
    const playerGeometry = new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - (2 * PLAYER_RADIUS), 4, 10);
    const playerMaterial = new THREE.MeshStandardMaterial({
        color: isOpponent ? 0xff0000 : 0x0000ff, // Vermelho para oponente, Azul para jogador
        roughness: 0.6,
        metalness: 0.2
    });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    // Ajusta a posição inicial para que a base da cápsula toque y=0
    playerMesh.position.set(isOpponent ? 10 : -10, PLAYER_HEIGHT / 2, 0);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    return playerMesh;
}

// --- Funções futuras ---
// export function loadPlayerModel() { /* Lógica para carregar GLTF */ }
// export function loadStadiumModel() { /* Lógica para carregar estádio */ }