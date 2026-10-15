import fs from 'node:fs';
import path from 'node:path';

function removeMaps(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeMaps(fullPath);
    } else if (entry.name.endsWith('.map')) {
      try {
        fs.unlinkSync(fullPath);
        console.log('Removed sourcemap:', fullPath);
      } catch (err) {
        console.warn('Could not remove:', fullPath, err);
      }
    }
  }
}

removeMaps('.open-next');
removeMaps('.next');
console.log('Sourcemap cleanup complete.');
