#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// === WiFi ===
const char* ssid = "Gabriel_2.4GHz";
const char* password = "senhasenha";

// === MQTT ===
const char* mqtt_server = "personal-mqtt-horta-inteligente.6v8shu.easypanel.host";
const int mqtt_port = 1883;
const char* mqtt_user = "esp32";
const char* mqtt_password = "x7ofHxxAHsHbXA9VUN15";
const char* client_id = "esp32-01";

// === Tópico ===
const char* topic_control = "device/esp32/control";

WiFiClient espClient;
PubSubClient client(espClient);

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

  // Tenta parsear JSON (opcional, só pra debug)
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
}
