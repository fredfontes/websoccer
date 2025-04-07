import * as THREE from 'three';

const FIELD_WIDTH = 105;
const FIELD_HEIGHT = 68;

/**
 * Cria e retorna a cena principal.
 */
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor do céu
    scene.fog = new THREE.Fog(0x87CEEB, 100, 300); // Névoa para dar profundidade
    return scene;
}

/**
 * Cria e retorna a câmera perspectiva.
 * @param {HTMLElement} container - O elemento container para obter as dimensões.
 */
export function createCamera(container) {
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    // Posição inicial da câmera (estilo isométrico/FIFA clássico)
    camera.position.set(0, 70, FIELD_HEIGHT * 1.1);
    camera.lookAt(0, 0, 0); // Olhar para o centro do campo
    return camera;
}

/**
 * Cria e retorna o renderer WebGL.
 * @param {HTMLElement} container - O elemento onde o canvas será adicionado.
 */
export function createRenderer(container) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Habilitar sombras
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    return renderer;
}

/**
 * Cria e adiciona luzes à cena.
 * @param {THREE.Scene} scene - A cena onde as luzes serão adicionadas.
 */
export function createLights(scene) {
    // Luz ambiente suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Luz direcional (simula o sol)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(-50, 80, 30);
    sunLight.castShadow = true;
    // Configurações de sombra (ajuste conforme necessário para performance)
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -FIELD_WIDTH * 1.5;
    sunLight.shadow.camera.right = FIELD_WIDTH * 1.5;
    sunLight.shadow.camera.top = FIELD_HEIGHT * 1.5;
    sunLight.shadow.camera.bottom = -FIELD_HEIGHT * 1.5;

    scene.add(sunLight);
    scene.add(sunLight.target); // Adiciona o alvo da luz direcional

    // Helper para visualizar a sombra (opcional, para debug)
    // const shadowHelper = new THREE.CameraHelper(sunLight.shadow.camera);
    // scene.add(shadowHelper);
}

/**
 * Lida com o redimensionamento da janela.
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @param {HTMLElement} container
 */
export function handleResize(camera, renderer, container) {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}