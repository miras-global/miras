<?php
// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Content type
header('Content-Type: text/plain; charset=utf-8');

// Inputs
$module = isset($_GET['module']) ? strtolower(trim($_GET['module'])) : 'attesters';
$chain  = isset($_GET['chain']) ? strtolower(trim($_GET['chain'])) : 'mainnet';

// Whitelist modules
$allowedModules = ['attesters', 'safes', 'claims'];
if (!in_array($module, $allowedModules, true)) {
  http_response_code(400);
  echo "Invalid module. Use ?module=attesters or ?module=safes or ?module=claims";
  exit;
}

// Normalize chain => mainnet|sepolia (default mainnet)
$network = ($chain === 'sepolia') ? 'sepolia' : 'mainnet';

$redisUrl = getenv('REDIS_URL') ?: 'redis://localhost:6379';
$parsedUrl = parse_url($redisUrl);
$redisHost = $parsedUrl['host'] ?? 'localhost';
$redisPort = $parsedUrl['port'] ?? 6379;

// Ensure php-redis extension is available
if (!class_exists('Redis')) {
  http_response_code(500);
  echo "php-redis extension is not installed or enabled. Please install/enable the Redis PHP extension.";
  exit;
}

try {
  $redis = new Redis();
  $redis->connect($redisHost, $redisPort);
  
  $pattern = substr($module, 0, -1).":{$network}:*";
  $keys = $redis->keys($pattern);
  
  if (empty($keys)) {
    http_response_code(404);
    echo "No data found for {$module} on {$network}";
    exit;
  }
  
  foreach ($keys as $key) {
    $data = $redis->get($key);
    if ($data) {
      echo $data . "\n";
    }
  }
  
  $redis->close();
} catch (Exception $e) {
  http_response_code(500);
  echo "Error connecting to Redis: " . $e->getMessage();
  exit;
}
