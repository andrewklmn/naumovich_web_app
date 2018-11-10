<!doctype html>
<html>
<head>
  <meta charset=utf-8>
  <title>Naumovich 2 command mode</title>
</head>
<body>
  <?php
    if(isset($_REQUEST['command'])) {
      echo file_get_contents( 'http://10.0.1.200:100/api?command='.urlencode($_REQUEST['command']));
    };
  ?>
  <form>
    <input type="text" name="command" value="<?php if(isset($_REQUEST['command'])) echo $_REQUEST['command']; ?>"/>
    <input type="submit" value="Send"/>
  </form>
  <pre>
    AT   -> Ok - check UART connection
    AT get all - returns next parameters: config_ram|config_rom|mode|out_s0|litos_s1|mebel_s2|hot_s3|back_s4|out_t0|litos_t1|mebel_t2|hot_t3|back_t4|pomp_OFF|heater_OFF
    AT get config - returns: config_ram|config_rom
    AT set config <BIGINT> - sets config_ram to decimal 32 bit int value (0xMELIBAHO), returns: config_ram
    AT get status - returns: out_s0|litos_s1|mebel_s2|hot_s3|back_s4|pomp_OFF|heater_OFF
    AT get mode - returns number of current mode ( 0-all is off, 1-eco mode, 2-standart mode, 3-eco simulator, 4-standart simulator, 5-pomp ON, 6-pomp and heater ON)
    AT set mode - sets number of current mode, returns current mode
    AT get temp - returns out_t0|litos_t1|mebel_t2|hot_t3|back_t4
    AT get sim temp - returns simulated temps: out_t0|litos_t1|mebel_t2|hot_t3|back_t4
    AT set sim temp out_t0|litos_t1|mebel_t2|hot_t3|back_t4 - sets simulated temps, returns out_sim_t0|litos_sim_t1|mebel_sim_t2|hot_sim_t3|back_sim_t4
  </pre>
</body>
</html>
