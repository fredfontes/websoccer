import * as THREE from 'three';
import { createScene, createCamera, createRenderer, createLights, handleResize } from './sceneSetup.js';
import { createField, createBall, createPlayerPlaceholder } from './assets.js';
import * as controls from './controls.js'; // Importa tudo de controls
import { Player } from './player.js';

// --- Variáveis Globais ---
let scene, camera, renderer, field, ball, player, opponent;
let clock; // Para calcular o deltaTime

// --- Inicialização ---
function init() {
    const container = document.getElementById('game-container');
    if (!container) {
        console.error("Erro: Container do jogo não encontrado!");
        return;
    }

    clock = new THREE.Clock();

    // Configuração da Cena
    scene = createScene();
    camera = createCamera(container);
    renderer = createRenderer(container);
    createLights(scene);

    // Criação dos Assets
    field = createField();
    ball = createBall();
    const playerMesh = createPlayerPlaceholder(false); // Jogador (azul)
    const opponentMesh = createPlayerPlaceholder(true); // Oponente (vermelho)

    scene.add(field);
    scene.add(ball);
    scene.add(playerMesh);
    scene.add(opponentMesh);

    // Criação do Jogador Controlável
    player = new Player(playerMesh); // Passa o mesh para a classe Player

    // Oponente (apenas visual por enquanto)
    opponent = { mesh: opponentMesh }; // Simples objeto para guardar a referência

    // Configurar listener de redimensionamento
    window.addEventListener('resize', () => handleResize(camera, renderer, container));

    // Inicia o loop do jogo
    animate();
}

// --- Loop do Jogo (Animação) ---
function animate() {
    requestAnimationFrame(animate); // Chama o próximo frame

    const deltaTime = clock.getDelta(); // Tempo desde o último frame

    // --- Atualização da Lógica do Jogo ---

    // 1. Atualizar Controles (já feito pelos event listeners em controls.js)

    // 2. Atualizar Jogador Controlado
    if (player) {
        player.update(deltaTime, controls);
    }

    // 3. Atualizar IA (Placeholder)
    // TODO: Implementar lógica de movimento e decisão do oponente (ai.js)
    // Exemplo muito simples: fazer o oponente olhar para a bola
    if (opponent && ball) {
         opponent.mesh.lookAt(ball.position.x, opponent.mesh.position.y, ball.position.z);
    }

    // 4. Atualizar Física (Placeholder)
    // TODO: Integrar motor de física (physics.js)
    // - Atualizar posição/rotação da bola com base na física
    // - Detectar colisões (bola <-> jogador, jogador <-> jogador)
    // - Sincronizar meshes (ball.mesh.position.copy(physicsBall.position))

    // 5. Atualizar Câmera
    // Exemplo: Fazer a câmera seguir o jogador suavemente
    if (player) {
        const targetPosition = new THREE.Vector3();
        // Posição desejada da câmera (atrás e acima do jogador)
        targetPosition.set(player.mesh.position.x, camera.position.y, player.mesh.position.z + 30); // Ajuste o offset Z
        // Interpola suavemente a posição atual para a posição alvo
        camera.position.lerp(targetPosition, deltaTime * 2.0); // O valor 2.0 controla a velocidade da interpolação
        // Faz a câmera continuar olhando um pouco à frente do jogador ou para o centro
         const lookAtTarget = player.mesh.position.clone().add(player.direction.clone().multiplyScalar(15)); // Olhar 15 unidades à frente
         // Ou simplesmente: const lookAtTarget = player.mesh.position;
         camera.lookAt(lookAtTarget);
    }


    // --- Renderização ---
    renderer.render(scene, camera);
}

// --- Iniciar o Jogo ---
init();