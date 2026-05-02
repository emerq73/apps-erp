const fs = require('fs');
const path = 'd:/clouqore/hotel-erp/frontend/src/pages/PMSView.jsx';

let content = fs.readFileSync(path, 'utf8');

const replacements = [
    { target: 'ðŸ ½ï¸ ', replacement: '🍽️' },
    { target: 'ðŸ—ºï¸ ', replacement: '🗺️' },
    { target: 'ðŸ”´', replacement: '🔴' },
    { target: 'ðŸŸ¡', replacement: '🟡' },
    { target: 'â °', replacement: '⌛' },
    { target: 'â€¢', replacement: '•' },
    { target: 'Ãšltimos 7 dÃ­as', replacement: 'Últimos 7 días' },
    { target: 'Pre-autorizaciÃ³n', replacement: 'Pre-autorización' }
];

replacements.forEach(({ target, replacement }) => {
    content = content.split(target).join(replacement);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Icons fixed successfully');
