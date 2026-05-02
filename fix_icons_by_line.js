const fs = require('fs');
const path = 'd:/clouqore/hotel-erp/frontend/src/pages/PMSView.jsx';

let lines = fs.readFileSync(path, 'utf8').split('\n');

// Line numbers are 1-based in view_file, so 0-based in array
lines[386] = "        { id: 'restaurant', label: 'Restaurante', icon: <span>🍽️</span> },";
lines[422] = "                            {viewMode === 'grid' ? '🗺️ Mapa' : '📋 Lista'}";
lines[460] = "                                    {alert.type === 'RED' ? '🔴' : alert.type === 'YELLOW' ? '🟡' : '⌛'} {alert.message} - Hab. #{alert.roomNumber} ({alert.reservationNumber})";

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Icons fixed by line number successfully');
