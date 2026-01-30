// URLs relativas (funciona tanto no PC quanto acessando pelo celular na mesma rede)
const API_URL = ""; 

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    setInterval(checkHealth, 5000); // Check a cada 5s
    document.getElementById('sendBtn').addEventListener('click', sendData);
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

async function sendData() {
    const input = document.getElementById('jsonInput').value;
    const btn = document.getElementById('sendBtn');
    const output = document.getElementById('responseOutput');
    
    // UI Feedback
    btn.disabled = true;
    btn.innerText = "Enviando...";
    output.style.display = 'none';
    output.className = 'response-area';

    try {
        let parsedBody;
        try {
            parsedBody = JSON.parse(input);
        } catch (e) {
            throw new Error("JSON inválido! Verifique aspas e vírgulas.");
        }

        const res = await fetch(`${API_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedBody)
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.error || "Erro no servidor");

        output.innerHTML = `<strong>Sucesso!</strong><br>${JSON.stringify(result, null, 2)}`;
        output.style.display = 'block';

    } catch (err) {
        output.innerHTML = `<strong>Erro:</strong> ${err.message}`;
        output.className = 'response-area error';
        output.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerText = "Enviar Comando 🚀";
    }
}