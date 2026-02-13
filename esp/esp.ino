#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

// === Pinos ===
#define PIN_D4 4  // GPIO4 no ESP32

// === Tópico ===
const char* topic_control = "device/esp32/control";

WiFiClient espClient;
PubSubClient client(espClient);

// === Controle de execução ===
unsigned long executionStartTime = 0;
unsigned long executionDuration = 0;
bool isExecuting = false;

// =====================
// Função para parar execução
// =====================
void stopExecution() {
  if (isExecuting) {
    digitalWrite(PIN_D4, LOW);
    isExecuting = false;
    Serial.println("🛑 Execução INTERROMPIDA - D4 DESLIGADO");
  } else {
    Serial.println("⚠️ Nenhuma execução em andamento");
  }
}

// =====================
// WiFi
// =====================
void setup_wifi() {
  Serial.println();
  Serial.print("Conectando em ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("✅ WiFi conectado!");
  Serial.print("📍 IP: ");
  Serial.println(WiFi.localIP());
}

// =====================
// Callback MQTT
// =====================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Mensagem recebida [");
  Serial.print(topic);
  Serial.print("]: ");

  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println(message);

  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("⚠️ Não é JSON válido: ");
    Serial.println(error.c_str());
    return;
  }

  Serial.println("📦 JSON parseado com sucesso:");
  serializeJsonPretty(doc, Serial);
  Serial.println();

  // Verifica o modo
  const char* mode = doc["mode"];

  if (mode == nullptr) {
    Serial.println("⚠️ Campo 'mode' não encontrado");
    return;
  }

  // Modo STOP - interrompe execução
  if (strcmp(mode, "stop") == 0) {
    stopExecution();
    return;
  }

  // Modo EXECUTION - inicia execução
  if (strcmp(mode, "execution") == 0) {
    int duration = doc["duration"];

    if (duration <= 0) {
      Serial.println("⚠️ Duration inválido ou não encontrado");
      return;
    }

    // Se já está executando, interrompe a execução anterior
    if (isExecuting) {
      Serial.println("⚠️ Execução em andamento será substituída");
      digitalWrite(PIN_D4, LOW);
    }

    Serial.print("⚡ Iniciando execução por ");
    Serial.print(duration);
    Serial.println(" segundos...");

    // Ativa D4
    digitalWrite(PIN_D4, HIGH);
    
    // Registra o tempo de início e duração
    executionStartTime = millis();
    executionDuration = duration * 1000UL; // Converte para milissegundos
    isExecuting = true;

    Serial.println("✅ D4 LIGADO");
  }
}

// =====================
// Reconnect MQTT
// =====================
void reconnect() {
  while (!client.connected()) {
    Serial.print("🔄 Conectando MQTT...");

    if (client.connect(client_id, mqtt_user, mqtt_password)) {
      Serial.println(" ✅ Conectado!");
      client.subscribe(topic_control);
      Serial.print("📡 Inscrito em: ");
      Serial.println(topic_control);
    } else {
      Serial.print(" ❌ Falhou, rc=");
      Serial.print(client.state());
      Serial.println(" | Tentando novamente em 5s");
      delay(5000);
    }
  }
}

// =====================
// Setup
// =====================
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Configura o pino D4 como saída
  pinMode(PIN_D4, OUTPUT);
  digitalWrite(PIN_D4, LOW);

  Serial.println();
  Serial.println("============================");
  Serial.println("   ESP32 MQTT LISTENER");
  Serial.println("============================");
  Serial.println();

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  Serial.println("✅ Setup completo!");
}

// =====================
// Loop
// =====================
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Verifica se está em execução e se o tempo expirou
  if (isExecuting) {
    if (millis() - executionStartTime >= executionDuration) {
      digitalWrite(PIN_D4, LOW);
      isExecuting = false;
      
      Serial.println("⏹️ Execução finalizada - D4 DESLIGADO");
    }
  }
}