import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createScene, createCamera, createRenderer, createLights, handleResize } from './sceneSetup.js';
import { createField, createBall, createPlayerPlaceholder, createGoal } from './assets.js';
import { Player } from './player.js';
import { Opponent } from './opponent.js';
import * as controls from './controls.js';

// Log que sabemos que aparece:
console.log("Iniciando js/main.js (Debug Constantes)...");

// --- Constantes ---
console.log("main.js: Log 1 - Antes das constantes GEO...");
const FIELD_WIDTH_HALF = 105 / 2;
const FIELD_HEIGHT_HALF = 68 / 2;
const BALL_RADIUS = 0.22;
const GOAL_WIDTH_HALF = 7.32 / 2;
const GOAL_HEIGHT = 2.44;
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.6;

console.log("main.js: Log 2 - Antes das constantes VEC3...");
// Tenta criar vetor THREE. Se THREE falhou ao importar, pode parar aqui.
const PLAYER_INITIAL_POS = new THREE.Vector3(-10, PLAYER_HEIGHT / 2, 0);
console.log("main.js: Log 3 - PLAYER_INITIAL_POS OK.");

// Tenta criar outro vetor THREE.
const OPPONENT_INITIAL_POS = new THREE.Vector3(10, PLAYER_HEIGHT / 2, 0);
console.log("main.js: Log 4 - OPPONENT_INITIAL_POS OK.");

// Tenta criar vetor CANNON. Se CANNON falhou ao importar, pode parar aqui.
const BALL_INITIAL_POS = new CANNON.Vec3(0, BALL_RADIUS + 0.1, 0);
console.log("main.js: Log 5 - BALL_INITIAL_POS OK.");

// Cálculo simples.
const DRIBBLING_OFFSET = PLAYER_RADIUS + BALL_RADIUS + 0.1;
console.log("main.js: Log 6 - Constantes restantes OK.");
// ------------------

// Variáveis globais
console.log("main.js: Log 7 - Antes das variáveis globais..."); // Se chegar aqui, constantes OK.
let scene, camera, renderer, clock;
let field, ball, playerMesh, opponentMesh, goal1, goal2;
let container;
let world;
let groundBody, ballBody, playerBody, opponentBody;
let groundMaterial, ballMaterial, playerMaterial;
const fixedTimeStep = 1 / 60;
let player, opponent;
let score = { player1: 0, player2: 0 };
let isBallAttached = false; let attachedPlayer = null;
console.log("main.js: Log 8 - Variáveis globais definidas.");

function init() {
    console.log("main.js: Log 9 - Função init() iniciada."); // Se chegar aqui, tudo OK até agora.
    try {
        container = document.getElementById('game-container');
        if (!container) { container = document.body; }
        clock = new THREE.Clock();

        scene = createScene();
        camera = createCamera();
        renderer = createRenderer(container);
        createLights(scene);
        setupPhysics();

        // Assets
        field = createField(); scene.add(field);
        ball = createBall(); scene.add(ball); createBallPhysics();
        playerMesh = createPlayerPlaceholder(false, PLAYER_INITIAL_POS); scene.add(playerMesh); createPlayerPhysics();
        opponentMesh = createPlayerPlaceholder(true, OPPONENT_INITIAL_POS); scene.add(opponentMesh); createOpponentPhysics();
        goal1 = createGoal(); goal1.position.x = FIELD_WIDTH_HALF; scene.add(goal1);
        goal2 = createGoal(); goal2.position.x = -FIELD_WIDTH_HALF; goal2.rotation.y = Math.PI; scene.add(goal2);

        // Lógica
        player = new Player(playerMesh);
        opponent = new Opponent(opponentMesh);

        console.log("Placar Inicial:", score);
        window.addEventListener('resize', () => handleResize(camera, renderer), false);
        console.log("Inicialização completa. Iniciando loop...");
        animate();
    } catch (error) {
        console.error("Erro GERAL durante a inicialização:", error);
    }
}

// --- Funções (setupPhysics, create...Physics, checkGoal, resetPositions, animate) ---
// Mantenha as versões completas e funcionais dessas funções das respostas anteriores aqui
// (O código completo delas não precisa ser repetido aqui se não foram alteradas)
function setupPhysics() { world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) }); groundMaterial = new CANNON.Material("ground"); ballMaterial = new CANNON.Material("ball"); playerMaterial = new CANNON.Material("player"); world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, ballMaterial, { friction: 0.4, restitution: 0.5 })); world.addContactMaterial(new CANNON.ContactMaterial(playerMaterial, ballMaterial, { friction: 0.1, restitution: 0.4 })); world.addContactMaterial(new CANNON.ContactMaterial(playerMaterial, groundMaterial, { friction: 0.3, restitution: 0.1 })); groundBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: groundMaterial }); groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); world.addBody(groundBody); }
function createBallPhysics() { if (!world) return; const ballShape = new CANNON.Sphere(BALL_RADIUS); ballBody = new CANNON.Body({ mass: 0.5, shape: ballShape, material: ballMaterial, linearDamping: 0.4, angularDamping: 0.4 }); ballBody.position.copy(BALL_INITIAL_POS); world.addBody(ballBody); }
function createPlayerPhysics() { if (!world) return; const shape = new CANNON.Cylinder(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 10); playerBody = new CANNON.Body({ mass: 70, shape: shape, material: playerMaterial, type: CANNON.Body.KINEMATIC, allowSleep: false }); if(playerMesh) playerBody.position.copy(playerMesh.position); else playerBody.position.copy(PLAYER_INITIAL_POS); world.addBody(playerBody); }
function createOpponentPhysics() { if (!world) return; const shape = new CANNON.Cylinder(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 10); opponentBody = new CANNON.Body({ mass: 70, shape: shape, material: playerMaterial, type: CANNON.Body.KINEMATIC, allowSleep: false }); if(opponentMesh) opponentBody.position.copy(opponentMesh.position); else opponentBody.position.copy(OPPONENT_INITIAL_POS); world.addBody(opponentBody); }
function checkGoal() { if (!ballBody) return; const bX=ballBody.position.x, bY=ballBody.position.y, bZ=ballBody.position.z; if (bX > FIELD_WIDTH_HALF + BALL_RADIUS && Math.abs(bZ) < GOAL_WIDTH_HALF && bY < GOAL_HEIGHT) { console.log("GOL! P1"); score.player1++; console.log(`Placar: ${score.player1}x${score.player2}`); resetPositions(); return; } if (bX < -FIELD_WIDTH_HALF - BALL_RADIUS && Math.abs(bZ) < GOAL_WIDTH_HALF && bY < GOAL_HEIGHT) { console.log("GOL! P2"); score.player2++; console.log(`Placar: ${score.player1}x${score.player2}`); resetPositions(); return; } }
function resetPositions() { console.log("Resetando..."); if(ballBody){ballBody.type = CANNON.Body.DYNAMIC; ballBody.position.copy(BALL_INITIAL_POS); ballBody.velocity.set(0,0,0); ballBody.angularVelocity.set(0,0,0);} if(ball){ball.position.copy(BALL_INITIAL_POS); ball.quaternion.set(0,0,0,1);} if(playerMesh){playerMesh.position.copy(PLAYER_INITIAL_POS); playerMesh.quaternion.set(0,0,0,1);} if(playerBody){playerBody.position.copy(PLAYER_INITIAL_POS); playerBody.velocity.set(0,0,0); playerBody.quaternion.set(0,0,0,1);} if(player){player.direction.set(1,0,0); player.hasPossession=false; if(player.mesh.position) player.mesh.lookAt(player.mesh.position.clone().add(player.direction)); if(playerBody && player.mesh) playerBody.quaternion.copy(player.mesh.quaternion);} if(opponentMesh){opponentMesh.position.copy(OPPONENT_INITIAL_POS); opponentMesh.quaternion.set(0,0,0,1);} if(opponentBody){opponentBody.position.copy(OPPONENT_INITIAL_POS); opponentBody.velocity.set(0,0,0); opponentBody.quaternion.set(0,0,0,1);} if(opponent){opponent.direction.set(-1,0,0); if(opponent.mesh.position) opponent.mesh.lookAt(opponent.mesh.position.clone().add(opponent.direction)); if(opponentBody && opponent.mesh) opponentBody.quaternion.copy(opponent.mesh.quaternion);} isBallAttached=false; attachedPlayer=null;}
function animate() { try { requestAnimationFrame(animate); const dt=clock.getDelta(); let pA={action:'NONE'}; if(player) pA=player.update(dt,controls,ballBody,isBallAttached && attachedPlayer===player); if(opponent) opponent.update(dt,ballBody,playerBody); if(pA.action==='ATTACH'&&!isBallAttached){isBallAttached=true; attachedPlayer=player; ballBody.type=CANNON.Body.KINEMATIC; ballBody.velocity.set(0,0,0); ballBody.angularVelocity.set(0,0,0);}else if(pA.action==='DETACH'&&isBallAttached&&attachedPlayer===player){isBallAttached=false; attachedPlayer=null; ballBody.type=CANNON.Body.DYNAMIC;}else if(pA.action==='KICK'){let wasAttached=false; if(isBallAttached&&attachedPlayer===player){isBallAttached=false; attachedPlayer=null; ballBody.type=CANNON.Body.DYNAMIC; wasAttached=true;} if(pA.impulse&&ballBody){if(wasAttached){const ownerM=player.mesh; const ownerD=player.direction; const tPos=ownerM.position.clone(); const oDir=ownerD.clone(); oDir.y=0; oDir.normalize().multiplyScalar(DRIBBLING_OFFSET); tPos.add(oDir); tPos.y=BALL_RADIUS+0.01; ballBody.position.copy(tPos);} ballBody.applyImpulse(pA.impulse, ballBody.position);}} if(isBallAttached&&attachedPlayer&&ballBody&&ballBody.type===CANNON.Body.KINEMATIC){ const oM=attachedPlayer.mesh; const oD=attachedPlayer.direction; const tP=oM.position.clone(); const oDr=oD.clone(); oDr.y=0; oDr.normalize().multiplyScalar(DRIBBLING_OFFSET); tP.add(oDr); tP.y=BALL_RADIUS+0.01; ballBody.position.copy(tP); ballBody.velocity.set(0,0,0); ballBody.angularVelocity.set(0,0,0);} if(world) world.step(fixedTimeStep, dt); if(ball&&ballBody){ball.position.copy(ballBody.position); if(!isBallAttached) ball.quaternion.copy(ballBody.quaternion);} if(playerMesh&&playerBody){playerBody.position.copy(playerMesh.position); playerBody.quaternion.copy(playerMesh.quaternion);} if(opponentMesh&&opponentBody){opponentBody.position.copy(opponentMesh.position); opponentBody.quaternion.copy(opponentMesh.quaternion);} checkGoal(); if(renderer&&scene&&camera) renderer.render(scene, camera); } catch (error) { console.error("Erro DENTRO do loop animate:", error); } }
// --- Fim Funções ---

// Inicia a aplicação
console.log("main.js: Log 10 - Antes de iniciar app.");
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // Chama init() se já carregado
}
console.log("main.js: Log 11 - Script lido até o fim.");