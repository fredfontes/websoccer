const keysPressed = {};
function setupInputListeners() {
    window.addEventListener('keydown', (event) => { if (event.repeat) return; keysPressed[event.code] = true; });
    window.addEventListener('keyup', (event) => { keysPressed[event.code] = false; });
    window.addEventListener('blur', () => { for (let key in keysPressed) keysPressed[key] = false; });
}
export function isKeyPressed(keyCode) { return keysPressed[keyCode] === true; }
setupInputListeners();
// console.log("Controles inicializados."); // Log opcional