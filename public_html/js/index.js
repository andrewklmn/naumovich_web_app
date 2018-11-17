/*
 *
 */

var timeout;    // ask status timeout
var eeprom_config_value = 252316195;
    /*
        epprom_config_value:
        1 unsigned char - Min mebel temp        (default +15)
        2 unsigned char   Min litos temp        (default +10)
        3 unsigned char   Min back water temp   (default +10)
        4 unsigned char   Max hot water temp    (default +35)
    */

//var api = 'api';   // uncomment this for esp8266 data
//var api = 'api.txt'; // uncomment this for testing
var api = 'api.php'; // uncomment this for 10.8.0.66/camera

const REFRESH_TIME = 1500;

function get_current_status(){

    var t = [];             // temporary answer buffer
    var mode = $("select#modes").val();
    clearTimeout(timeout);
    show_status( "<font style='color:white;'>ping</font>" );

    $.ajax({
      type: "GET",
      data: { command: "AT get all" },
      url: api,
      success: function( data ) {


        if(data.answer=="T") {
            show_status( "<font style='color:red;'>ARM timeout error!</font>" );
            timeout = setTimeout( get_current_status , REFRESH_TIME);
            return true;
        };

        if(data.answer=="Bad request") {
            show_status( "<font style='color:blue;'>Bad request!</font>" );
            timeout = setTimeout( get_current_status , REFRESH_TIME);
            return true;
        };


        t = data.answer.split("|");

        eeprom_config_value = parseInt(t[0]);
        $("select#set_mebel_temp").val( parseInt(t[0]) >>> 24 );

        // sets current temp display
        display_temp( 'outdoor_temp', t[8]);
        display_temp( 'litos_temp',   t[9]);
        display_temp( 'mebel_temp',   t[10]);
        display_temp( 'heater_temp',  t[11]);
        display_temp( 'pomp_temp',    t[12]);

        check_temp_sensor('outdoor_temp', t[3]);
        check_temp_sensor('litos_temp',   t[4]);
        check_temp_sensor('mebel_temp',   t[5]);
        check_temp_sensor('heater_temp',  t[6]);
        check_temp_sensor('pomp_temp',    t[7]);

        // sets button to actual mode
        if ("1" == t[13]) {
           pomp_off();
        } else {
           pomp_on();
        };
        if ("1" == t[14]) {
           heater_off();
        } else {
           heater_on();
        };

        if ("3" == t[2]
            || "4" == t[2]
            || "0" == t[2]
            || "5" == t[2]
            || "6" == t[2]) {
            if (mode!="Off") {
                $("select#modes").val("Off");
                $("select#modes").change();
            };
          } else if ("1" == t[2] ) {
            if (mode!="ECO") {
                $("select#modes").val("ECO");
                $("select#modes").change();
            };
        } else {
            if ( mode!="Standart" ) {
                $("select#modes").val("Standart");
                $("select#modes").change();
            };
        };

        show_status( "<font style='color:black;'>pong</font>" );
        //show_status( "<font style='font-size:10px;color:gray;'>" + data.answer + "</font>" );

        timeout = setTimeout( get_current_status , REFRESH_TIME);
      },
      error: function () {

        show_status( "<font style='color:red;'>Connection error!</font>" );
        timeout = setTimeout( get_current_status , REFRESH_TIME);

      },
      dataType: "json",
      timeout: 6000
    });
};

function send_command(command){
    $.ajax({
      type: "GET",
      data: { command: command },
      url: api,
      success: function( data ) {
        show_status( "<font style='font-size:10px;color:gray;'>" + data.answer + "</font>" );
      },
      error: function () {
        show_status( "<font style='color:red;'>Connection error!</font>" );
      },
      dataType: "json",
      timeout: 6000
    });
};

function display_temp( id, value){

    var sign_of_temp = "";
    // check sign of temperature value
    if ( Math.round(parseFloat(value)*10) > 0 ){
        sign_of_temp = "+";
    };
    $( "span#" + id ).html( sign_of_temp + value + "&#8451;" );
};

function check_temp_sensor( id, value ){
    if (parseInt(value) > 0) {
        $( "span#" + id ).html( "<b>XXX</b>" );
    };
};

function show_status(text){
    $("td#status").html(text);
};

function pomp_on(){
    $('img#pomp_off').hide();
    $('img#pomp_on').show();
};
function pomp_off(){
    $('img#pomp_on').hide();
    $('img#pomp_off').show();
};
function heater_on(){
    $('img#heater_off').hide();
    $('img#heater_on').show();
};
function heater_off(){
    $('img#heater_on').hide();
    $('img#heater_off').show();
};

function set_mode( mode_number ){
    send_command("AT set mode " + mode_number);

};

function set_mebel_temp( temp_value ) {
    /*
        epprom_config_value:
        1 unsigned char - Min mebel temp        (default +15)
        2 unsigned char   Min litos temp        (default +10)
        3 unsigned char   Min back water temp   (default +10)
        4 unsigned char   Max hot water temp    (default +35)
    */
    temp_value = temp_value << 24;
    temp_value = (eeprom_config_value & 0x00FFFFFF) | temp_value;
    send_command("AT set config " + temp_value);
};

$(document).ready(function(){
    $("select#set_mebel_temp").blur(function(){
        var current_temp = $(this).val();
        // если изменили температуру
        if ((eeprom_config_value >>> 24) != current_temp ) {
            set_mebel_temp( current_temp);
        };
    });
    $("select#modes").change(function(){
        switch($(this).val()){
            case 'Off':
                $("span#mebel_setter").hide();
                $(this).removeClass("btn-success");
                $(this).removeClass("btn-danger");
                $(this).addClass("btn-secondary");
                set_mode("0");
                break;
            case 'ECO':
                $("span#mebel_setter").hide();
                $(this).removeClass("btn-secondary");
                $(this).removeClass("btn-danger");
                $(this).addClass("btn-success");
                set_mode("1");
                break;
            case 'Standart':
                $("span#mebel_setter").show();
                $(this).removeClass("btn-success");
                $(this).removeClass("btn-secondary");
                $(this).addClass("btn-danger");
                set_mode("2");
                break;
        };
    })
    get_current_status();
});
