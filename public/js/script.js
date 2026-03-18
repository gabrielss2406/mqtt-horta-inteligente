// URLs relativas
const API_URL = ""; 
let activeTimer = null; 

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    
    checkHealth();
    setInterval(checkHealth, 5000);

    // Auth
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Commands
    document.getElementById('executeBtn').addEventListener('click', sendExecutionCommand);
    document.getElementById('stopBtn').addEventListener('click', sendStopCommand);
    
    // History Modal
    const historyModal = document.getElementById('historyModal');
    document.getElementById('openHistoryBtn').addEventListener('click', () => {
        historyModal.style.display = 'flex';
        fetchHistory();
    });
    
    document.getElementById('closeHistoryBtn').addEventListener('click', () => {
        historyModal.style.display = 'none';
    });
    
    document.getElementById('refreshHistoryBtn').addEventListener('click', fetchHistory);
    
    // Fechar ao clicar fora do modal
    window.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });
});

// === Gerenciamento de Autenticação ===
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const loginSection = document.getElementById('login-section');
    const controlSection = document.getElementById('control-section');

    if (!token || token === 'null' || token === 'undefined') {
        loginSection.style.display = 'block';
        controlSection.style.display = 'none';
        return false;
    } else {
        loginSection.style.display = 'none';
        controlSection.style.display = 'block';
        return true;
    }
}

async function login() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value;
    const output = document.getElementById('responseOutput');

    if (!password) {
        output.innerHTML = "<strong>Erro:</strong> Digite uma senha.";
        output.className = 'response-area error';
        output.style.display = 'block';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erro ao fazer login");

        localStorage.setItem('token', data.token);
        passwordInput.value = "";
        checkAuthStatus();
        output.style.display = 'none';
    } catch (err) {
        output.innerHTML = `<strong>Erro:</strong> ${err.message}`;
        output.className = 'response-area error';
        output.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('token');
    checkAuthStatus();
}

// === API e Controle ===
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

async function fetchHistory() {
    const historyList = document.getElementById('historyList');
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erro ao carregar histórico");

        if (data.length === 0) {
            historyList.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">Nenhuma execução recente.</p>';
            return;
        }

        historyList.innerHTML = data.map(item => {
            const dateObj = new Date(item.timestamp);
            const dataStr = dateObj.toLocaleDateString('pt-BR');
            const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="history-item">
                    <div class="history-item-info">
                        <span style="color: #81c784;">🌱 Ativação (${item.duration}s)</span>
                        <span class="history-item-time">${dataStr} às ${horaStr}</span>
                    </div>
                    <span style="color: #555; font-size: 0.8rem;">#${item.timestamp.toString().slice(-4)}</span>
                </div>
            `;
        }).join('');
    } catch (err) {
        historyList.innerHTML = `<p style="color: #ff5252; text-align: center; margin-top: 20px;">Erro: ${err.message}</p>`;
    }
}

async function sendCommand(payload) {
    const output = document.getElementById('responseOutput');
    output.style.display = 'none';
    output.className = 'response-area';

    if (!checkAuthStatus()) {
        output.innerHTML = "<strong>Erro:</strong> Você precisa estar logado.";
        output.className = 'response-area error';
        output.style.display = 'block';
        return false;
    }

    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/send`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.status === 401 || res.status === 403) {
            logout();
            throw new Error("Sessão expirada ou inválida. Faça login novamente.");
        }

        if (!res.ok) throw new Error(result.error || "Erro no servidor");

        output.innerHTML = `<strong>Sucesso!</strong><br>${JSON.stringify(result, null, 2)}`;
        output.style.display = 'block';

        return true; 
    } catch (err) {
        output.innerHTML = `<strong>Erro:</strong> ${err.message}`;
        output.className = 'response-area error';
        output.style.display = 'block';
        return false;
    }
}

function setUiLockState(isLocked) {
    const executeBtn = document.getElementById('executeBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (executeBtn) executeBtn.disabled = isLocked;
    if (stopBtn) stopBtn.disabled = !isLocked;
}

async function sendExecutionCommand() {
    const durationInput = document.getElementById('durationInput');
    const duration = parseInt(durationInput.value, 10);

    if (isNaN(duration) || duration <= 0) {
        const output = document.getElementById('responseOutput');
        output.innerHTML = "<strong>Erro:</strong> Duração inválida.";
        output.className = 'response-area error';
        output.style.display = 'block';
        return;
    }

    const success = await sendCommand({ mode: "execution", duration });

    if (success) {
        setUiLockState(true);
        if (activeTimer) clearTimeout(activeTimer);
        activeTimer = setTimeout(() => {
            setUiLockState(false);
            activeTimer = null;
        }, duration * 1000);
    }
}

async function sendStopCommand() {
    const success = await sendCommand({ mode: "stop" });
    if (success) {
        if (activeTimer) {
            clearTimeout(activeTimer);
            activeTimer = null;
        }
        setUiLockState(false);
    }
}