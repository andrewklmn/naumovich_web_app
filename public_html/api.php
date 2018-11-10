<?php

    header('Content-type: application/json');

    echo file_get_contents( 'http://10.0.1.200:100/api?command='.urlencode($_REQUEST['command']));
    
