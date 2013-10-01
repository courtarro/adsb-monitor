<?php

$href = "http://localhost:8080/data.json";

$body = file_get_contents($href);

header("Content-Type: application/json");

echo $body;

?>
