import * as THREE from 'three';

// --- Constantes ---
const FIELD_WIDTH = 105; const FIELD_HEIGHT = 68; const BALL_RADIUS = 0.22;
const PLAYER_RADIUS = 0.6; const PLAYER_HEIGHT = 1.8;
const GOAL_WIDTH = 7.32; const GOAL_HEIGHT = 2.44; const GOAL_DEPTH = 1.5; const POST_RADIUS = 0.08;
// ------------------

// Cria o campo
export function createField() {
    const fieldGeometry = new THREE.PlaneGeometry(FIELD_WIDTH, FIELD_HEIGHT);
    const textureLoader = new THREE.TextureLoader(); // Mantém o loader

    // --- ALTERADO PARA CAMINHO LOCAL ---
    // Certifique-se que o caminho corresponde à sua estrutura de pastas e nome do arquivo
    const grassTexture = textureLoader.load('textures/grass.jpg'); // Ex: 'textures/grass.jpg' se renomeou
    // -----------------------------------

    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(20, 12); // Ajuste conforme necessário
    const fieldMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture, color: 0x66A066, roughness: 0.9, metalness: 0.0
    });
    const fieldMesh = new THREE.Mesh(fieldGeometry, fieldMaterial);
    fieldMesh.rotation.x = -Math.PI / 2;
    fieldMesh.position.y = 0;
    // console.log("Campo criado (assets.js)");
    return fieldMesh;
}

// Cria a bola
export function createBall() {
    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1 });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.position.set(0, BALL_RADIUS + 0.01, 0);
    return ballMesh;
}

// Cria o gol
export function createGoal() {
    const goalGroup = new THREE.Group();
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.2, metalness: 0.1 });
    const postGeometry = new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 12);
    const crossbarGeometry = new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, GOAL_WIDTH, 12);
    const leftPost = new THREE.Mesh(postGeometry, postMaterial); leftPost.position.set(0, GOAL_HEIGHT / 2, -GOAL_WIDTH / 2);
    const rightPost = new THREE.Mesh(postGeometry, postMaterial); rightPost.position.set(0, GOAL_HEIGHT / 2, GOAL_WIDTH / 2);
    const crossbar = new THREE.Mesh(crossbarGeometry, postMaterial); crossbar.rotation.x = Math.PI / 2; crossbar.position.set(0, GOAL_HEIGHT, 0);
    goalGroup.add(leftPost); goalGroup.add(rightPost); goalGroup.add(crossbar);
    return goalGroup;
}

// Cria placeholder visual para jogador OU oponente
export function createPlayerPlaceholder(isOpponent = false, initialPosition) {
    const playerGeometry = new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - (2 * PLAYER_RADIUS), 4, 10);
    const playerColor = isOpponent ? 0xff4444 : 0x0077ff; // Vermelho ou Azul
    const playerMaterial = new THREE.MeshStandardMaterial({ color: playerColor, roughness: 0.6, metalness: 0.2 });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    if (initialPosition) { playerMesh.position.copy(initialPosition); }
    else { playerMesh.position.set(-10, PLAYER_HEIGHT / 2, 0); } // Fallback
    return playerMesh;
}

// console.log("assets.js carregado."); // Log opcional