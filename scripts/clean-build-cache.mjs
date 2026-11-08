/**
 * Force-clean build artifacts BEFORE any Cloudflare build.
 * This ensures the CI/CD never reuses stale chunks.
 */
import { rmSync, existsSync } from 'fs';

const dirs = ['.next', '.open-next', 'node_modules/.cache'];
for (const dir of dirs) {
  if (existsSync(dir)) {
    console.log(`🗑  Removing ${dir} ...`);
    rmSync(dir, { recursive: true, force: true });
  } else {
    console.log(`✓  ${dir} does not exist — nothing to clean`);
  }
}
console.log('✅  Build artifacts cleaned — fresh build guaranteed');
