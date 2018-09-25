/* 
 * 
 */

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
                break;
            case 'ECO':
                $("span#mebel_setter").hide();
                break;
            case 'Standart':
                $("span#mebel_setter").show();
                break;
        };
    })
});
