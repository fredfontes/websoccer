const keysPressed = {};

function setupInputListeners() {
    window.addEventListener('keydown', (event) => {
        keysPressed[event.code] = true;
    });

    window.addEventListener('keyup', (event) => {
        keysPressed[event.code] = false;
    });

    // TODO: Adicionar suporte a Gamepad API se necessário
}

/**
 * Verifica se uma tecla específica está pressionada.
 * @param {string} keyCode - O código da tecla (ex: 'KeyW', 'ArrowUp').
 * @returns {boolean} - True se a tecla estiver pressionada, false caso contrário.
 */
export function isKeyPressed(keyCode) {
    return keysPressed[keyCode] === true;
}

// Inicializa os listeners quando o módulo é carregado
setupInputListeners();