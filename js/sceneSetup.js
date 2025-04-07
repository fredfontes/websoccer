import * as THREE from 'three';

// Cria a cena
export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
    console.log("Scene created (sceneSetup.js)");
    return scene;
}

// Cria a câmera
export function createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    camera.position.set(0, 75, 90); // Visão do campo
    camera.lookAt(0, 0, 0);
    console.log("Camera created (sceneSetup.js)");
    return camera;
}

// Cria o renderer
export function createRenderer(container) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // Usa tamanho da janela
    renderer.setPixelRatio(window.devicePixelRatio);
    // Poderíamos reativar sombras aqui se quiséssemos
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    console.log("Renderer created (sceneSetup.js)");
    return renderer;
}

// Cria as luzes
export function createLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-60, 80, 50);
    // directionalLight.castShadow = true; // Sombras depois
    scene.add(directionalLight);
    // scene.add(directionalLight.target); // Target padrão é (0,0,0)
    console.log("Lights created (sceneSetup.js)");
}

// Lida com redimensionamento
export function handleResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}