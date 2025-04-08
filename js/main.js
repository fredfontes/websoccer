import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createScene, createCamera, createRenderer, createLights, handleResize } from './sceneSetup.js';
import { createField, createBall, createPlayerPlaceholder, createGoal } from './assets.js';
import { Player } from './player.js';
import { Opponent } from './opponent.js';
import * as controls from './controls.js';

// console.log("Iniciando js/main.js (Correção Placar)...");

// --- Constantes ---
const FIELD_WIDTH_HALF = 105 / 2; const FIELD_HEIGHT_HALF = 68 / 2;
const BALL_RADIUS = 0.22; const GOAL_WIDTH_HALF = 7.32 / 2; const GOAL_HEIGHT = 2.44;
const PLAYER_HEIGHT = 1.8; const PLAYER_RADIUS = 0.6;
const PLAYER_INITIAL_POS = new THREE.Vector3(-10, PLAYER_HEIGHT / 2, 0);
const OPPONENT_INITIAL_POS = new THREE.Vector3(10, PLAYER_HEIGHT / 2, 0);
const BALL_INITIAL_POS = new CANNON.Vec3(0, BALL_RADIUS + 0.1, 0);
const DRIBBLING_OFFSET = PLAYER_RADIUS + BALL_RADIUS + 0.1;
const GAME_DURATION_SECONDS = 2 * 60;
// ------------------

// Variáveis globais
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
let scoreElement, timerElement;
let gameTimeRemaining = GAME_DURATION_SECONDS;
let gameRunning = true;

// init - SEM ALTERAÇÕES (Mantém a versão anterior completa)
function init() { try { container = document.getElementById('game-container'); if (!container) { container = document.body; } clock = new THREE.Clock(); scoreElement = document.getElementById('score-display'); timerElement = document.getElementById('timer-display'); if (!scoreElement || !timerElement) console.error("UI elements not found!"); scene = createScene(); camera = createCamera(); renderer = createRenderer(container); createLights(scene); setupPhysics(); field = createField(); scene.add(field); ball = createBall(); scene.add(ball); createBallPhysics(); playerMesh = createPlayerPlaceholder(false, PLAYER_INITIAL_POS); scene.add(playerMesh); createPlayerPhysics(); opponentMesh = createPlayerPlaceholder(true, OPPONENT_INITIAL_POS); scene.add(opponentMesh); createOpponentPhysics(); goal1 = createGoal(); goal1.position.x = FIELD_WIDTH_HALF; scene.add(goal1); goal2 = createGoal(); goal2.position.x = -FIELD_WIDTH_HALF; goal2.rotation.y = Math.PI; scene.add(goal2); player = new Player(playerMesh); opponent = new Opponent(opponentMesh); updateScoreDisplay(); updateTimerDisplay(); console.log("Placar Inicial:", score); window.addEventListener('resize', () => handleResize(camera, renderer), false); animate(); } catch (error) { console.error("Erro GERAL durante a inicialização:", error); } }

// setupPhysics, create...Physics - SEM ALTERAÇÕES
function setupPhysics() { world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) }); groundMaterial = new CANNON.Material("ground"); ballMaterial = new CANNON.Material("ball"); playerMaterial = new CANNON.Material("player"); world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, ballMaterial, { friction: 0.4, restitution: 0.5 })); world.addContactMaterial(new CANNON.ContactMaterial(playerMaterial, ballMaterial, { friction: 0.1, restitution: 0.4 })); world.addContactMaterial(new CANNON.ContactMaterial(playerMaterial, groundMaterial, { friction: 0.3, restitution: 0.1 })); groundBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: groundMaterial }); groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); world.addBody(groundBody); }
function createBallPhysics() { const shape = new CANNON.Sphere(BALL_RADIUS); ballBody = new CANNON.Body({ mass: 0.5, shape: shape, material: ballMaterial, linearDamping: 0.4, angularDamping: 0.4 }); ballBody.position.copy(BALL_INITIAL_POS); world.addBody(ballBody); }
function createPlayerPhysics() { const shape = new CANNON.Cylinder(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 10); playerBody = new CANNON.Body({ mass: 70, shape: shape, material: playerMaterial, type: CANNON.Body.KINEMATIC, allowSleep: false }); if(playerMesh) playerBody.position.copy(playerMesh.position); else playerBody.position.copy(PLAYER_INITIAL_POS); world.addBody(playerBody); }
function createOpponentPhysics() { const shape = new CANNON.Cylinder(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 10); opponentBody = new CANNON.Body({ mass: 70, shape: shape, material: playerMaterial, type: CANNON.Body.KINEMATIC, allowSleep: false }); if(opponentMesh) opponentBody.position.copy(opponentMesh.position); else opponentBody.position.copy(OPPONENT_INITIAL_POS); world.addBody(opponentBody); }


// --- checkGoal - CORRIGIDA ---
function checkGoal() {
    if (!ballBody || !gameRunning) return;
    const ballX = ballBody.position.x; const ballY = ballBody.position.y; const ballZ = ballBody.position.z;
    let goalScored = false;

    // Gol no lado ESQUERDO (X < 0) -> Ponto para Jogador 2 (IA/Vermelho)
    if (ballX < -FIELD_WIDTH_HALF - BALL_RADIUS) {
        if (Math.abs(ballZ) < GOAL_WIDTH_HALF && ballY < GOAL_HEIGHT) {
            console.log("GOL! Jogador 2 marcou!"); // Log correto
            score.player2++; // <<< CORRIGIDO
            goalScored = true;
        }
    }

    // Gol no lado DIREITO (X > 0) -> Ponto para Jogador 1 (Humano/Azul)
    // Adicionado !goalScored para evitar dupla contagem no mesmo frame (improvável)
    if (!goalScored && ballX > FIELD_WIDTH_HALF + BALL_RADIUS) {
        if (Math.abs(ballZ) < GOAL_WIDTH_HALF && ballY < GOAL_HEIGHT) {
            console.log("GOL! Jogador 1 marcou!"); // Log correto
            score.player1++; // <<< CORRIGIDO
            goalScored = true;
        }
    }

    // Se houve gol, atualiza placar na tela e reseta
    if (goalScored) {
        updateScoreDisplay(); // Atualiza UI
        console.log(`Placar: P1 ${score.player1} x ${score.player2} P2`); // Loga placar correto
        resetPositions();
    }
}
// --- Fim checkGoal ---

// resetPositions - SEM ALTERAÇÕES
function resetPositions() { console.log("Resetando posições..."); if(ballBody){ballBody.type = CANNON.Body.DYNAMIC; ballBody.position.copy(BALL_INITIAL_POS); ballBody.velocity.set(0,0,0); ballBody.angularVelocity.set(0,0,0);} if(ball){ball.position.copy(BALL_INITIAL_POS); ball.quaternion.set(0,0,0,1);} if(playerMesh){playerMesh.position.copy(PLAYER_INITIAL_POS); playerMesh.quaternion.set(0,0,0,1);} if(playerBody){playerBody.position.copy(PLAYER_INITIAL_POS); playerBody.velocity.set(0,0,0); playerBody.quaternion.set(0,0,0,1);} if(player){player.direction.set(1,0,0); player.hasPossession=false; if(player.mesh.position) player.mesh.lookAt(player.mesh.position.clone().add(player.direction)); if(playerBody && player.mesh) playerBody.quaternion.copy(player.mesh.quaternion);} if(opponentMesh){opponentMesh.position.copy(OPPONENT_INITIAL_POS); opponentMesh.quaternion.set(0,0,0,1);} if(opponentBody){opponentBody.position.copy(OPPONENT_INITIAL_POS); opponentBody.velocity.set(0,0,0); opponentBody.quaternion.set(0,0,0,1);} if(opponent){opponent.direction.set(-1,0,0); if(opponent.mesh.position) opponent.mesh.lookAt(opponent.mesh.position.clone().add(opponent.direction)); if(opponentBody && opponent.mesh) opponentBody.quaternion.copy(opponent.mesh.quaternion);} isBallAttached=false; attachedPlayer=null; }
// updateScoreDisplay, updateTimerDisplay - SEM ALTERAÇÕES
function updateScoreDisplay() { if (scoreElement) scoreElement.innerText = `P1 ${score.player1} - ${score.player2} P2`; }
function updateTimerDisplay() { if (timerElement) { const t=Math.max(0, gameTimeRemaining); const m=Math.floor(t/60); const s=Math.floor(t%60); timerElement.innerText = `${m}:${s.toString().padStart(2,'0')}`; } }


// animate - SEM ALTERAÇÕES
function animate() { try { requestAnimationFrame(animate); const dt=clock.getDelta(); controls.updateKeys(); if(gameRunning){gameTimeRemaining-=dt; updateTimerDisplay(); if(gameTimeRemaining<=0){console.log("FIM DE JOGO!"); gameRunning=false;}} if(gameRunning){let pA={action:'NONE'}; if(player) pA=player.update(dt,controls,ballBody,isBallAttached&&attachedPlayer===player); if(opponent) opponent.update(dt,ballBody,playerBody); if(pA.action==='ATTACH'&&!isBallAttached){isBallAttached=true; attachedPlayer=player; ballBody.type=CANNON.Body.KINEMATIC; ballBody.velocity.set(0,0,0); ballBody.angularVelocity.set(0,0,0);}else if(pA.action==='DETACH'&&isBallAttached&&attachedPlayer===player){isBallAttached=false; attachedPlayer=null; ballBody.type=CANNON.Body.DYNAMIC;}else if(pA.action==='KICK'){let wasAttached=false; if(isBallAttached&&attachedPlayer===player){isBallAttached=false; attachedPlayer=null; ballBody.type=CANNON.Body.DYNAMIC; wasAttached=true;} if(pA.impulse&&ballBody){if(wasAttached){const oM=player.mesh; const oD=player.direction; const tPos=oM.position.clone(); const oDr=oD.clone(); oDr.y=0; oDr.normalize().multiplyScalar(DRIBBLING_OFFSET); tPos.add(oDr); tPos.y=BALL_RADIUS+0.01; ballBody.position.copy(tPos);} ballBody.applyImpulse(pA.impulse, ballBody.position);}}} if(isBallAttached&&attachedPlayer&&ballBody&&ballBody.type===CANNON.Body.KINEMATIC){const oM=attachedPlayer.mesh; const oD=attachedPlayer.direction; const tP=oM.position.clone(); const oDr=oD.clone(); oDr.y=0; oDr.normalize().multiplyScalar(DRIBBLING_OFFSET); tP.add(oDr); tP.y=BALL_RADIUS+0.01; ballBody.position.copy(tP); ballBody.velocity.set(0,0,0); ballBody.angularVelocity.set(0,0,0);} if(world) world.step(fixedTimeStep, dt); if(ball&&ballBody){ball.position.copy(ballBody.position); if(!isBallAttached) ball.quaternion.copy(ballBody.quaternion);} if(playerMesh&&playerBody){playerBody.position.copy(playerMesh.position); playerBody.quaternion.copy(playerMesh.quaternion);} if(opponentMesh&&opponentBody){opponentBody.position.copy(opponentMesh.position); opponentBody.quaternion.copy(opponentMesh.quaternion);} if(gameRunning) checkGoal(); if(renderer&&scene&&camera) renderer.render(scene, camera); } catch (error) { console.error("Erro DENTRO do loop animate:", error); } }

// Inicia (sem alterações)
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }