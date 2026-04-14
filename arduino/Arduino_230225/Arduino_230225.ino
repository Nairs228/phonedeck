#include <Wire.h>    // Библиотека для работы с аппаратной шиной I2C.
#include <SoftwareSerial.h> // Библиотека для программного Serial (UART).
#include <iarduino_I2C_4LED.h>   // Библиотека для работы с индикатором I2C-flash.
#include <iarduino_RTC.h>   // Библиотека часов реального времени (RTC).
#include <TimeLib.h> // Библиотека для преобразования Unix времени.

//#define station_id "0001" // id станции; в данный момент не используется

//Задание выводов, через которые будет происходить передача данных с Arduino.
constexpr uint8_t RX = 2;
constexpr uint8_t TX = 3;
SoftwareSerial espSerial(RX, TX); // Программный Serial (UART) для работы с ESP8266. Подключение к ESP8266 по схеме RX -> TX.

#define BUTTON_COUNT 6 // Количество концевиков, используемых в проекте.
constexpr uint8_t button_pin1 = 5;  // Объявляем выводы, в которые подключены концевики.
constexpr uint8_t button_pin2 = 7;  // В данной схеме можно использовать любые цифровые выводы, кроме выводов 0, 1, 2, 3.
constexpr uint8_t button_pin3 = 8;
constexpr uint8_t button_pin4 = 9;
constexpr uint8_t button_pin5 = 11;
constexpr uint8_t button_pin6 = 13;

/*
  Объявляем массив объектов dispLEDs для работы с функциями и методами библиотеки iarduino_I2C_4LED, указывая адрес модуля на шине I2C.
  Адреса модулей в hex идут от A до F включительно.
*/
iarduino_I2C_4LED dispLEDs[BUTTON_COUNT] = {
                                            iarduino_I2C_4LED(0x0E),
                                            iarduino_I2C_4LED(0x0C),
                                            iarduino_I2C_4LED(0x0D),
                                            iarduino_I2C_4LED(0x0F),
                                            iarduino_I2C_4LED(0x0A),
                                            iarduino_I2C_4LED(0x0B)
                                            };


iarduino_RTC watch(RTC_DS3231);   // Объявляем объект watch для модуля RTC на базе чипа DS3231.

/*
  Побайтовое выравнивание структуры, в которую записываются данные, отправляемые с Arduino.
  Выравнивание нужно для того, чтобы данные записались правильно.
  Если этого не делать, то все данные после первой переменной придут битыми.
  Возможно, это проблема со стороны Serial (UART).
  Передавать строки по Serial (UART) нельзя, потому что у них динамическая длина (особенности строк в Arduino).
  Из-за этого чтение данных с Arduino и последующая их запись в структуру может пройти неправильно.
*/
#pragma pack(push,1) // Побайтовое выравнивание структуры
struct MyData {  
  uint32_t start = 0; // Время начала отсчета в Unix формате.
  uint32_t stop = 0;  // Время конца отсчета в Unix формате.
  byte slot = 0;      // Номер слота, в котором производится отсчет.
  byte crc = 0;       // Байт для проверки контрольной суммы данных, которые отправляются с Arduino на ESP8266.
};
#pragma pack(pop)

MyData txData[BUTTON_COUNT]; // Массив структур, в который будут записываться данные из слотов.

enum ButtonState // Состояния концевика.
{
	Released, // Отпущен.
	Pressed // Нажат.
};

class Button{ // Класс для работы с концевиками.
  private:
          uint8_t pin; // Номер вывода, в который подключен концевик.
          ButtonState initialState; // Начальное состояние концевика.
          bool ButtonFlag = false; // Флаг состояния концевика (отпущен; нажат).
  public:
          bool TimeFlag = false; // Флаг фиксирования времени, в которое концевик был нажат.
          int temp = -1; // Переменная для хранения флага, возвращаемого с ESP8266 на Arduino.
          Button(const uint8_t &button_pin){ // Конструктор класса.
            pin = button_pin;
            pinMode(pin, INPUT_PULLUP); // Подключение резистора подтяжки для концевика.
            initialState = Released; // Явное указание начального состояния концевика.
          }

          ButtonState GetState(){ // Функция возвращает текущее состояние концевика.
            if (digitalRead(pin) == LOW)
              return Pressed;
            else
              return Released;
          }

          void Update(){ // Функция опрашивает состояние концевика и устанавливает/сбрасывает его флаг.
            ButtonState newState = this->GetState();

            if ((initialState != newState) && (newState == ButtonState::Pressed)){
              delay(50); // Простая защита от дребезга.
              newState = this->GetState();
              if (newState == ButtonState::Pressed)
                ButtonFlag = true;
            }
            if (newState == ButtonState::Released)
              ButtonFlag = false;
          }

          bool IsPressed(){ // Функция возвращает флаг состояния концевика.
            return ButtonFlag;
          }

          bool IsTimeStored(){ // Функция возвращает флаг фиксирования времени.
            return TimeFlag;
          }
};

Button buttons[BUTTON_COUNT] = {  // Объявляем массив объектов buttons, который обслуживает концевики.
                                  Button(button_pin1), 
                                  Button(button_pin2),
                                  Button(button_pin3),
                                  Button(button_pin4),
                                  Button(button_pin5),
                                  Button(button_pin6)
                                };

/*
  Функция для вычисления контрольной суммы.
  Взял её у AlexGyver (https://alexgyver.ru/lessons/crc/). Свою работу выполняет, а большего здесь и не нужно.
  Если очень хочется, то можно взять полноценные библиотеки по типу:
  1. CRC32 (https://github.com/bakercp/CRC32).
  2. Алгоритм Хэмминга (https://github.com/GyverLibs/Hamming).
  Но я не вижу в этом смысла, если в будущем станцию будет обслуживать только одно устройство (ESP32S, например).
  Сейчас обмен данными между Arduino и ESP8266 происходит на скорости 9600 бод (перевод бод в байты можно найти в интернете).
  Эта скорость имеет наименьший шанс ошибки для этих двух устройств. Менять её не рекомендуется.
  Нам же для подстраховки нужно только понимать, произошла ошибка при передаче или нет.
*/
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
                                             
void setup(){  // Код внутри этой функции выполняется один раз.
    // Инициализация аппаратного и программного Serial (UART) со скоростью 9600 бод.
    Serial.begin(9600);  // Аппаратный Serial (UART) для обмена данными с компьютером.
    espSerial.begin(9600);  // Программный Serial (UART) для обмена данными с ESP8266.
    watch.begin();  // Инициализируем RTC модуль.   
    for (uint8_t i = 0; i < BUTTON_COUNT; i++){
      dispLEDs[i].begin(); // Инициализируем индикатор.
      dispLEDs[i].blink(0,true); // Указываем двоеточию индикатора мигать, когда выводится время.
    }   
    /* 
      Задание соответствия слотов и структур.
      Инверсия получилась из-за способа подключения концевиков внутри станции.
    */
    txData[0].slot = 6;
    txData[1].slot = 5;
    txData[2].slot = 3;
    txData[3].slot = 4;
    txData[4].slot = 2;
    txData[5].slot = 1; 
}                                                         
                                                       
void loop(){  // Код внутри этой функции выполняется бесконечно. 
    for (uint8_t i = 0; i < BUTTON_COUNT; i++){
      buttons[i].Update(); // Опрос состояния концевика.

      if (buttons[i].IsPressed() && !buttons[i].IsTimeStored()){ // Если концевик нажат и время нажатия не записано.
        txData[i].start = watch.gettimeUnix(); // Записываем время нажатия концевика.
        buttons[i].TimeFlag = true; // Устанавливаем флаг записи времени нажатия концевика.
      }

      if (buttons[i].IsPressed()){ // Если концевик нажат.
        dispLEDs[i].print(minute(watch.gettimeUnix()-txData[i].start), second(watch.gettimeUnix()-txData[i].start), TIME); // Выводим время в формате ММ:СС на индикатор.
      }

      else { // Если концевик отжат.
        dispLEDs[i].clear(); // Отключаем индикатор.

        if (buttons[i].IsTimeStored()){ // Если записано время нажатия концевика.
          txData[i].stop = watch.gettimeUnix(); // Записываем время отжатия концевика.
          txData[i].crc = crc8((char*)&txData[i], sizeof(txData[i]) - 1); // Вычисление CRC структуры без последнего байта (последний байт это контрольная сумма).

          /* 
            Ниже представлен простой алгоритм отправки данных с Arduino на ESP8266.
            Он неудобен тем, что может вызывать зависания станции при отправке данных о нескольких слотах сразу.
            Например, на станции нажали 3 концевика и затем одновременно их отпустили.
            Тогда с этим алгоритмом станция зависнет, пока не отправит данные обо всех трех концевиках.
          */
          espSerial.write((char*)&txData[i], sizeof(txData[i])); // Побайтовая передача данных на ESP8266.
          while (buttons[i].TimeFlag){ // Пока установлен флаг записи времени нажатия концевика.
            if (espSerial.available() > 0){ // Ожидание ответа от ESP8266.
              buttons[i].temp = espSerial.read(); // Запись ответа.
              if (buttons[i].temp == 1){ // Если при передаче данных от Arduino к ESP8266 возникла ошибка.
                espSerial.write((char*)&txData[i], sizeof(txData[i])); // Отправляем данные ещё раз.
              }
              if (buttons[i].temp == 0){ // Если данные от Arduino успешно отправились на ESP8266.
                buttons[i].TimeFlag = false; // Сбрасываем флаг записи времени нажатия концевика.
              }
            }
          }
          // Возвращаем начальное состояние переменным.
          txData[i].start = 0;
          txData[i].stop = 0;
          txData[i].crc = 0;
          buttons[i].temp = -1;
        }
      }
    }                                          
}