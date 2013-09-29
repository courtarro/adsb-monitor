<?php

$href = "http://10.95.10.30:8080/data.json";

$body = file_get_contents($href);

header("Content-Type: application/json");

echo $body;

?>
