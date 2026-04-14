#define LASER1 25
#define LASER2 26
#define LASER3 27
#define LASER4 14
#define LASER5 12
#define LASER6 13

#define SENSOR1 19
#define SENSOR2 18
#define SENSOR3 5
#define SENSOR4 4
#define SENSOR5 2
#define SENSOR6 15

void setup() {
  Serial.begin(115200);
  pinMode(LASER1, OUTPUT);
  pinMode(LASER2, OUTPUT);
  pinMode(LASER3, OUTPUT);
  pinMode(LASER4, OUTPUT);
  pinMode(LASER5, OUTPUT);
  pinMode(LASER6, OUTPUT);

  pinMode(SENSOR1, INPUT);
  pinMode(SENSOR2, INPUT);
  pinMode(SENSOR3, INPUT);
  pinMode(SENSOR4, INPUT);
  pinMode(SENSOR5, INPUT);
  pinMode(SENSOR6, INPUT);

  digitalWrite(LASER1, HIGH);
  digitalWrite(LASER2, HIGH);
  digitalWrite(LASER3, HIGH);
  digitalWrite(LASER4, HIGH);
  digitalWrite(LASER5, HIGH);
  digitalWrite(LASER6, HIGH);
}

void loop() {
  Serial.println("SENSOR1 = " + String(digitalRead(SENSOR1)));
  Serial.println("SENSOR2 = " + String(digitalRead(SENSOR2)));
  Serial.println("SENSOR3 = " + String(digitalRead(SENSOR3)));
  Serial.println("SENSOR4 = " + String(digitalRead(SENSOR4)));
  Serial.println("SENSOR5 = " + String(digitalRead(SENSOR5)));
  Serial.println("SENSOR6 = " + String(digitalRead(SENSOR6)));
  delay(1500);
}