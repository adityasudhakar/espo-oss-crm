<?php
/**
 * Inject Query Widget Script
 *
 * Run this inside the EspoCRM container to add the chat widget to the footer.
 *
 * Usage:
 * docker compose exec espocrm php /custom-scripts/inject-query-widget.php
 */

$customFooterFile = '/var/www/html/custom/Espo/Custom/Resources/metadata/app/client.json';
$customDir = dirname($customFooterFile);

// Create directory if needed
if (!is_dir($customDir)) {
    mkdir($customDir, 0755, true);
}

// Client config to inject our script
$config = [
    'scriptList' => [
        '__APPEND__',
        'http://localhost:5000/static/chat-widget.js'
    ]
];

file_put_contents($customFooterFile, json_encode($config, JSON_PRETTY_PRINT));

echo "Widget script injected. Clear cache and reload EspoCRM.\n";
