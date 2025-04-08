const keysPressed = {};
const keysJustPressed = {}; // <<< NOVO: Guarda teclas pressionadas neste quadro
const previousKeysPressed = {}; // <<< NOVO: Guarda teclas do quadro anterior

function setupInputListeners() {
    window.addEventListener('keydown', (event) => {
        // Não impede o processamento normal, mas podemos verificar 'repeat' se quisermos
        // if (event.repeat) return;
        keysPressed[event.code] = true;
    });

    window.addEventListener('keyup', (event) => {
        keysPressed[event.code] = false;
        // Limpa 'justPressed' também ao soltar, se necessário (mas updateKeys faz isso)
        // delete keysJustPressed[event.code];
    });

    window.addEventListener('blur', () => {
        // Limpa tudo se perder foco
        for (let key in keysPressed) { keysPressed[key] = false; }
        for (let key in keysJustPressed) { delete keysJustPressed[key]; }
        for (let key in previousKeysPressed) { delete previousKeysPressed[key]; }
    });
}

/**
 * <<< NOVA FUNÇÃO >>>
 * Atualiza o estado das teclas 'just pressed'. Deve ser chamada UMA VEZ por frame.
 */
export function updateKeys() {
    // Limpa as teclas 'just pressed' do quadro anterior
    for (let key in keysJustPressed) {
        delete keysJustPressed[key];
    }
    // Verifica quais teclas estão pressionadas AGORA mas NÃO estavam antes
    for (let key in keysPressed) {
        if (keysPressed[key] && !previousKeysPressed[key]) {
            keysJustPressed[key] = true;
             // console.log(key + " just pressed"); // Log para debug
        }
    }
    // Atualiza o estado anterior para o próximo quadro
    for (let key in keysPressed) {
        previousKeysPressed[key] = keysPressed[key];
    }
    // Limpa teclas que foram soltas do estado anterior
    for (let key in previousKeysPressed) {
        if(!keysPressed[key]){
             delete previousKeysPressed[key];
        }
    }
}

/** Verifica se uma tecla está sendo mantida pressionada. */
export function isKeyPressed(keyCode) {
    return keysPressed[keyCode] === true;
}

/** <<< NOVA FUNÇÃO >>> Verifica se uma tecla acabou de ser pressionada neste quadro. */
export function isKeyJustPressed(keyCode) {
    return keysJustPressed[keyCode] === true;
}

// Inicializa listeners
setupInputListeners();
console.log("Controles de input atualizados com 'just pressed' (controls.js)");