//В проекте используются адреса 0x0A…0x0F.
uint8_t newAddress = 0x09;       // Назначаемый модулю адрес (0x07 < адрес < 0x7F). 0x09 - адрес индикатора по умолчанию.
#include <Wire.h> // Подключаем библиотеку для работы с аппаратной шиной I2C.
#include <iarduino_I2C_4LED.h>  // Подключаем библиотеку для работы с индикатором I2C-flash.
iarduino_I2C_4LED dispLED;  // Объявляем объект dispLED для работы с функциями и методами библиотеки iarduino_I2C_4LED.
// Если при объявлении объекта указать адрес, например, dispLED(0xBB), то пример будет работать с тем модулем, адрес которого был указан.
void setup(){      
     Serial.begin(9600);    
     if( dispLED.begin() ){                               // Инициируем работу с индикатором.
         Serial.print("Найден LED индикатор 0x");         //
         Serial.println( dispLED.getAddress(), HEX );     // Выводим текущий адрес модуля.
         if( dispLED.changeAddress(newAddress) ){         // Меняем адрес модуля на newAddress.
             Serial.print("Адрес изменён на 0x");         //
             Serial.println(dispLED.getAddress(),HEX );   // Выводим текущий адрес модуля.
         }
      else{  
             Serial.println("Адрес не изменён!");
            }    
     }else{ 
         Serial.println("LED индикатор не найден!");  
     }   
}   

void loop(){} 

