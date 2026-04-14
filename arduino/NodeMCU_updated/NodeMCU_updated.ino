//https://arduino.esp8266.com/stable/package_esp8266com_index.json
#include <Arduino.h>  // Библиотека с определением констант и типов данных.
#include <ESP8266WiFi.h> // Библиотека WiFi для ESP8266.
#include <ESP8266HTTPClient.h> // Библиотека для HTTP запросов.
#include <SoftwareSerial.h> // Библиотека программного Serial (UART).
#include <ArduinoJson.h> // Библиотека для формирования JSON.
#include <TimeLib.h> // Библиотека для преобразования Unix времени.

// ========== НАСТРОЙКИ WiFi ==========
// Впиши сюда название и пароль WiFi сети в аудитории
#define WIFI_SSID "VLAD"
#define WIFI_PASSWORD "12345678"

// ========== АДРЕС СЕРВЕРА (тот же хост, что API /save) ==========
#ifndef PHONEDECK_SERVER_HOST
#define PHONEDECK_SERVER_HOST "109.73.206.169"
#endif
const char serverPath[] = "http://" PHONEDECK_SERVER_HOST "/save";

WiFiClient client;
HTTPClient http;

constexpr int RX = D7;
constexpr int TX = D8;
SoftwareSerial espSerial(RX, TX);

JsonDocument doc;
String jsonMsg;

#pragma pack(push,1)
struct MyData {
  uint32_t start = 0;
  uint32_t stop = 0;
  byte slot = 0;
  byte crc = 0;
};
#pragma pack(pop)

byte crc8(char *buffer, byte size) {
  byte crc = 0;
  for (byte i = 0; i < size; i++) {
    byte data = buffer[i];
    for (int j = 8; j > 0; j--) {
      crc = ((crc ^ data) & 1) ? (crc >> 1) ^ 0x8C : (crc >> 1);
      data >>= 1;
    }
  }
  return crc;
}

void WiFi_Init(){
  int i = 0;
  Serial.println();
  Serial.print(F("Connecting..."));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED){
    Serial.print(F("."));
    i++;
    if (i == 50)
      return;
    delay(200);
  }
  Serial.println(F(""));
  Serial.println(F("WiFi connected."));
  Serial.println(F("IP address: "));
  Serial.println(WiFi.localIP());
  Serial.println();
}

String LeadingZeroCheck(int time_c){
  if ((time_c < 10) && (time_c >= 0))
    return "0" + String(time_c);
  else
    return String(time_c);
}

void JSONserialization(JsonDocument &doc, MyData &rxData, String &jsonMsg){
  doc["id"] = String(rxData.slot);
  doc["name"] = "Петров А.Д.";
  doc["model"] = "TCL";
  doc["charge"] = "71%";
  doc["connection_time"] = LeadingZeroCheck(hour(rxData.start)) + ":" + LeadingZeroCheck(minute(rxData.start));
  doc["disconnection_time"] = LeadingZeroCheck(hour(rxData.stop)) + ":" + LeadingZeroCheck(minute(rxData.stop));
  serializeJson(doc, jsonMsg);
}

bool Send_JSON(String &jsonMsg){
  int httpCode = 0;
  String payload = "";

  http.begin(client, serverPath);
  http.addHeader("Content-Type", "application/json; charset=UTF-8");

  httpCode = http.POST(jsonMsg);
  payload = http.getString();
  http.end();
  jsonMsg = "";

  if ((httpCode == 200) || (httpCode == 201))
    return true;
  else
    return false;
}

bool SendBufferData(MyData &BufferData){
  if (WiFi.status() == WL_CONNECTED){
    JSONserialization(doc, BufferData, jsonMsg);
    return Send_JSON(jsonMsg);
  }
  else
    return false;
}

class DATA_T {
  private:
          static const uint8_t max_data_count = 20;
          MyData StoredData[max_data_count];
          uint8_t write_index = 0;
          uint8_t read_index = 0;
  public:
          void WriteData(MyData &DataToWrite){
            if (write_index <= max_data_count - 1){
              StoredData[write_index] = DataToWrite;
              if (write_index < max_data_count - 1)
                write_index++;
            }
          }

          bool HasStoredData(){
            if ((write_index == 0) && (read_index == 0))
              return false;
            else
              return true;
          }

          bool SendStoredData(){
            for (uint8_t i = read_index; i < write_index; i++){
              if (WiFi.status() == WL_CONNECTED){
                JSONserialization(doc, StoredData[i], jsonMsg);
                if (Send_JSON(jsonMsg)) {
                  StoredData[i].start = 0;
                  StoredData[i].stop = 0;
                  StoredData[i].slot = 0;
                  StoredData[i].crc = 0;
                  read_index++;
                }
                else
                  return false;
                delay(200);
              }
              else {
                Serial.println(F("WiFi connection lost"));
                Serial.println(F("Trying to connect again"));
                WiFi_Init();
                return false;
              }
            }
            return true;
          }

          void ResetIndexes(){
            write_index = 0;
            read_index = 0;
          }
};

DATA_T DataContainer;

void setup(){
  Serial.begin(9600);
  espSerial.begin(9600);
  WiFi_Init();
  jsonMsg.reserve(300);
}

void loop(){
  MyData BufferData;

  if (espSerial.readBytes((char*)&BufferData, sizeof(BufferData))) {
    byte crc = crc8((char*)&BufferData, sizeof(BufferData));
    if (crc == 0){
      espSerial.write(0);
      if (!SendBufferData(BufferData))
        DataContainer.WriteData(BufferData);
    }
    else
      espSerial.write(1);
  }

  if (DataContainer.HasStoredData()){
    if (DataContainer.SendStoredData())
      DataContainer.ResetIndexes();
  }

  delay(50);
}
