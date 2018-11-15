
#define PIC_TIMEOUT 300000     // максимальное время отклика от PIC по UART
#define INFO_LED 2             // нога со светодиодом 

#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <FS.h>   //Include File System Headers

//MDNSResponder mdns;


const char* ssid = "litos";
const char* password = "jlvGQXjlvGQX";
ESP8266WebServer server(100);
IPAddress ip(10, 0, 0, 66);     // адрес в вайфай сети коровника
IPAddress gateway(10, 0, 0, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(10, 0, 0, 1);

/*
const char* ssid = "BUZOVA";
const char* password = "1234567890";
ESP8266WebServer server(100);
IPAddress ip(192, 168, 0, 202);     // адрес в вайфай сети коровника
IPAddress gateway(192, 168, 0, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(192, 168, 0, 1);
*/



int temp[4] = { 0,0,0,0 }; 
const char* htmlfile = "/index.html";

char * UART_read_answer() {  // чтение ответа по UART, возвращает указатель на char array с ответом
  
  static char buffer[1024];    // буффер для приема строки ответа 
  char a;             // буффер для приема символа ответа
  int i = 0;              // счётчик для номера символа ответа
  unsigned long int t = 0;       // счётчик для таймера таймаута
  bool flag = true;   // флаг разрешения приема
  
      while(flag) {
         if (Serial.available() > 0) {
           a = Serial.read();
           t = 0;
           switch(a){
              case -1:
                break;
              case 13: // прекращение приема строки по символу \r от UART
                flag = false;
                buffer[i] = '\0';
                i=0;
                break;
              default:
                buffer[i] = a;
                i++;
                break;
           };    
         } else {
            t++;
            if (t > PIC_TIMEOUT) {
              flag = false;
              t = 0;
              buffer[0] = 'T'; 
              buffer[1] = '\0';
            };
         };
      };
   
    return buffer;
};


void UART_clean_answer() { // очищаем всё что есть в буффере для чтения по UART 
      char a; 
      while(Serial.available()) {
        a = Serial.read();
      };
};


void handleRoot() { 
  server.sendHeader("Location", "/index.html",true);
  server.send(302, "text/plane","");  
};


void handleAPI() {

  char empty = '\0';
  char * answer;  // указатель на буффер с ответом
  String message = "";
  unsigned char max_tries = 3;
  String tries = "0123";

  digitalWrite( INFO_LED, LOW);

  if ( server.arg(0)=="" ) {
    answer = &empty;
  } else {
    max_tries = 3;
    // Пришла команда по HTTP 
    //очищаем полностью буфер от старых сообщений
    UART_clean_answer();
    //если есть команда, то отдаём её в UART
    Serial.print(server.arg(0));
    Serial.println("");
    answer = UART_read_answer();
  };
  
  
  message = "{ ";
  message += "\"answer\": \"";
  
  // выводим результат без символов перевода строки
  for ( int i=0; i<strlen(answer); i++) {
    if ( answer[i]!='\r'
         && answer[i]!='\n' ) {
      message += answer[i];
    };
  };
  
  message += "\", \"command\": \"";
  message += server.arg(0);
  message += "\", \"tries\": ";
  message += tries[max_tries];
  message += "}";
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", message );
  digitalWrite( INFO_LED, HIGH);

};


void handleCommand() {

  char empty = '\0';
  char * answer;  // указатель на буффер с ответом
  String message;

  digitalWrite( INFO_LED , LOW);

  if ( server.arg(0)=="" ) {
    answer = &empty;
  } else {
    // Пришла команда по HTTP 
    //очищаем полностью буфер от старых сообщений
    UART_clean_answer();
    //если есть команда, то отдаём её в UART
    Serial.print(server.arg(0));
    Serial.println("");
    //Считываем ответ из UART
    answer = UART_read_answer();
  };
  
  message = "<html><body><pre>";
  message += answer;
  message += "</pre>";
  message += "<form method='post'>"; 
  message += "Command: "; 
  message += "<input type='text' name='name' value=''/>"; 
  message += "<input type='submit' value='Send'/>"; 
  message += "</form>";
  message += "<br/>AT   -> Ok - check UART connection";
  message += "<br/>AT get all - returns next parameters: config_ram|config_rom|mode|out_s0|litos_s1|mebel_s2|hot_s3|back_s4|out_t0|litos_t1|mebel_t2|hot_t3|back_t4|pomp_OFF|heater_OFF";
  message += "<br/>AT get config - returns: config_ram|config_rom";
  message += "<br/>AT set config <BIGINT> - sets config_ram to decimal 32 bit int value (0xMELIBAHO), returns: config_ram";
  message += "<br/>AT get status - returns: out_s0|litos_s1|mebel_s2|hot_s3|back_s4|pomp_OFF|heater_OFF";
  message += "<br/>AT get mode - returns number of current mode ( 0-all is off, 1-eco mode, 2-standart mode, 3-eco simulator, 4-standart simulator, 5-pomp ON, 6-pomp and heater ON)";
  message += "<br/>AT set mode - sets number of current mode, returns current mode";
  message += "<br/>AT get temp - returns out_t0|litos_t1|mebel_t2|hot_t3|back_t4";
  message += "<br/>AT get sim temp - returns simulated temps: out_t0|litos_t1|mebel_t2|hot_t3|back_t4";
  message += "<br/>AT set sim temp out_t0|litos_t1|mebel_t2|hot_t3|back_t4 - sets simulated temps, returns out_sim_t0|litos_sim_t1|mebel_sim_t2|hot_sim_t3|back_sim_t4";
  
  message += "</body></html>";
  
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/html", message );
  digitalWrite( INFO_LED , HIGH);

}

void handleWebRequests(){
  if(loadFromSpiffs(server.uri())) return;
  String message = "File Not Detected\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET)?"GET":"POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i=0; i<server.args(); i++){
    message += " NAME:"+server.argName(i) + "\n VALUE:" + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
  Serial.println(message);
}

bool loadFromSpiffs(String path){
  String dataType = "text/plain";
  if(path.endsWith("/")) path += "index.html";
 
  if(path.endsWith(".src")) path = path.substring(0, path.lastIndexOf("."));
  else if(path.endsWith(".html")) dataType = "text/html";
  else if(path.endsWith(".htm")) dataType = "text/html";
  else if(path.endsWith(".css")) dataType = "text/css";
  else if(path.endsWith(".js")) dataType = "application/javascript";
  else if(path.endsWith(".png")) dataType = "image/png";
  else if(path.endsWith(".gif")) dataType = "image/gif";
  else if(path.endsWith(".jpg")) dataType = "image/jpeg";
  else if(path.endsWith(".ico")) dataType = "image/x-icon";
  else if(path.endsWith(".xml")) dataType = "text/xml";
  else if(path.endsWith(".pdf")) dataType = "application/pdf";
  else if(path.endsWith(".zip")) dataType = "application/zip";
  File dataFile = SPIFFS.open(path.c_str(), "r");
  if (server.hasArg("download")) dataType = "application/octet-stream";
  if (server.streamFile(dataFile, dataType) != dataFile.size()) {
  }
 
  dataFile.close();
  return true;
}


void setup(void){

  Serial.begin(19200);

  pinMode(INFO_LED, OUTPUT);
  digitalWrite(INFO_LED, HIGH);
    
  
  WiFi.mode(WIFI_AP_STA);             // клиент и точка доступа
  WiFi.softAP("NAUMOVICH", "1234567890", 8);
  //Serial.println("WiFi AP started");    
  
  
  WiFi.config(ip, gateway, subnet);
  WiFi.begin(ssid, password);

  /*
  digitalWrite(INFO_LED, LOW);
  delay(100);
  digitalWrite(INFO_LED, HIGH);
  delay(100);
  digitalWrite(INFO_LED, LOW);
  delay(100);
  digitalWrite(INFO_LED, HIGH);
  delay(100);
  */
  
  // Wait for connection

  int counter = 0;
  
  while ( WiFi.status() != WL_CONNECTED ) {

//  while ( WiFi.status() != WL_CONNECTED && counter < 30) {
    delay(800);
    digitalWrite(INFO_LED, LOW);
    delay(50);
    digitalWrite(INFO_LED, HIGH);
    delay(100);
    digitalWrite(INFO_LED, LOW);
    delay(50);
    digitalWrite(INFO_LED, HIGH);
    //counter++;
  };
 
  WiFi.setAutoConnect(true);
  WiFi.setAutoReconnect(true);
  
  //Serial.println("--------------");
  //Serial.println("WiFi connected");

  
  delay(700);
  digitalWrite(INFO_LED, LOW);
  delay(300);
  digitalWrite(INFO_LED, HIGH);
  delay(200);
  digitalWrite(INFO_LED, LOW);
  delay(300);
  digitalWrite(INFO_LED, HIGH);
  delay(200);
  digitalWrite(INFO_LED, LOW);
  delay(300);
  digitalWrite(INFO_LED, HIGH);

  
  //Serial.println("");
  //Serial.print("Connected to ");
  //Serial.println(ssid);
  //Serial.print("IP address: ");
  //Serial.println(WiFi.localIP());

  
  //if (mdns.begin("esp8266", WiFi.localIP())) {
  //  Serial.println("MDNS responder started");
  //             //  "Запущен MDNSresponder"
  //};  
  
  //Initialize File System
  
  SPIFFS.begin();
  //Serial.println("File System Initialized");
  
  server.on("/command", handleCommand);
  server.on("/api", handleAPI);
  server.on("/", handleRoot);
  server.on("/inline", [](){
    server.send(200, "text/plain", "OK");
  });
  server.onNotFound(handleWebRequests); //Set setver all paths are not found so we can handle as per URI
  server.begin();
 // Serial.println("HTTP server started");

  //mdns.addService("http", "tcp", 80);

}



void loop(void){
  server.handleClient();
}
