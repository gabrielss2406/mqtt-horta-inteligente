// URLs relativas (funciona tanto no PC quanto acessando pelo celular na mesma rede)
const API_URL = ""; 
let activeTimer = null; // Guarda a referência do nosso setTimeout

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    setInterval(checkHealth, 5000); // Check a cada 5s
    document.getElementById('executeBtn').addEventListener('click', sendExecutionCommand);
    document.getElementById('stopBtn').addEventListener('click', sendStopCommand);
});

async function checkHealth() {
    const statusEl = document.getElementById('system-status');
    const textEl = document.getElementById('status-text');
    
    try {
        const res = await fetch(`${API_URL}/health`);
        const data = await res.json();
        
        if (data.mqtt) {
            statusEl.className = 'status-badge online';
            textEl.innerText = 'Online';
        } else {
            statusEl.className = 'status-badge offline';
            textEl.innerText = 'MQTT Offline';
        }
    } catch (error) {
        statusEl.className = 'status-badge offline';
        textEl.innerText = 'API Offline';
    }
}

// Função para centralizar a lógica de envio do comando
async function sendCommand(payload) {
    const output = document.getElementById('responseOutput');
    output.style.display = 'none';
    output.className = 'response-area';

    try {
        const res = await fetch(`${API_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.error || "Erro no servidor");

        output.innerHTML = `<strong>Sucesso!</strong><br>${JSON.stringify(result, null, 2)}`;
        output.style.display = 'block';

        return true; // Retorna sucesso
    } catch (err) {
        output.innerHTML = `<strong>Erro:</strong> ${err.message}`;
        output.className = 'response-area error';
        output.style.display = 'block';
        return false; // Retorna falha
    }
}

// Gerencia o estado visual dos botões
function setUiLockState(isLocked) {
    const executeBtn = document.getElementById('executeBtn');
    const stopBtn = document.getElementById('stopBtn');

    executeBtn.disabled = isLocked;
    stopBtn.disabled = !isLocked;
}

async function sendExecutionCommand() {
    const durationInput = document.getElementById('durationInput');
    const duration = parseInt(durationInput.value, 10);

    if (isNaN(duration) || duration <= 0) {
        const output = document.getElementById('responseOutput');
        output.innerHTML = "<strong>Erro:</strong> Duração inválida. Por favor, insira um número positivo.";
        output.className = 'response-area error';
        output.style.display = 'block';
        return;
    }

    const payload = { mode: "execution", duration: duration };
    const success = await sendCommand(payload);

    if (success) {
        setUiLockState(true);

        // Se já existir um timer, limpa para evitar múltiplos timers
        if (activeTimer) clearTimeout(activeTimer);

        // Cria um novo timer que reverte o estado da UI após a duração
        activeTimer = setTimeout(() => {
            setUiLockState(false);
            activeTimer = null;
        }, duration * 1000);
    }
}

async function sendStopCommand() {
    const payload = { mode: "stop" };
    const success = await sendCommand(payload);

    if (success) {
        // Limpa o timer pendente, se houver
        if (activeTimer) {
            clearTimeout(activeTimer);
            activeTimer = null;
        }
        setUiLockState(false);
    }
}