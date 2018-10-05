/* 
 * 
 */

var timeout;    // ask status timeout
var eeprom_config_value = 252316195;

//var api = '/api';
api = 'api.txt';

const REFRESH_TIME = 1000;

function get_current_status(){
    
    var t = [];             // temporary answer buffer
    clearTimeout(timeout);
    
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
        
        t = data.answer.split("|");
        
        /*
            epprom_config_value:
                1 unsigned char - Min mebel temp        (default +15)
                2 unsigned char   Min litos temp        (default +10)
                3 unsigned char   Min back water temp   (default +10)
                4 unsigned char   Max hot water temp    (default +35)
        */
        eeprom_config_value = parseInt(t[0]);
        $("select#set_mebel_temp").val( parseInt(t[0]) >>> 24 );
        
        // sets current temp display
        display_temp( 'outdoor_temp', t[8]);
        display_temp( 'litos_temp',   t[9]);
        display_temp( 'mebel_temp',   t[10]);
        display_temp( 'heater_temp',   t[11]);
        display_temp( 'pomp_temp',   t[12]);
        
        
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
            $("select#modes").val("Off");
        } else if ("1" == t[2] ) {
            $("select#modes").val("ECO");
        } else {
            $("select#modes").val("Standart");
        };
        
        $("select#modes").change();
        show_status( data.answer );

        timeout = setTimeout( get_current_status , REFRESH_TIME);
      },
      error: function () {
        show_status( "<font style='color:red;'>Connection error!</font>" );
        timeout = setTimeout( get_current_status , REFRESH_TIME);
      },
      dataType: "json"
    });
};

function send_command(command){
    $.ajax({
      type: "POST",
      data: { command: command },
      url: api,
      success: function( data ) {
        show_status( data.answer);
      },
      error: function () {
        show_status( "<font style='color:red;'>Connection error!</font>" );
      },
      dataType: "json"
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

function show_status(text){
    $("div#status").html(text);
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

$(document).ready(function(){
    $("select#modes").change(function(){
        switch($(this).val()){
            case 'Off':
                $("span#mebel_setter").hide();
                $(this).removeClass("btn-success");
                $(this).removeClass("btn-danger");
                $(this).addClass("btn-secondary");
                break;
            case 'ECO':
                $("span#mebel_setter").hide();
                $(this).removeClass("btn-secondary");
                $(this).removeClass("btn-danger");
                $(this).addClass("btn-success");
                break;
            case 'Standart':
                $("span#mebel_setter").show();
                $(this).removeClass("btn-success");
                $(this).removeClass("btn-secondary");
                $(this).addClass("btn-danger");
                break;
        };
    })
    get_current_status();
});
