import fs from 'node:fs';
import path from 'node:path';

// 1. Remove all .map files to prevent Cloudflare bundle limit exceed
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

// 2. Patch OpenNext Cloudflare worker handler for Next.js 16 workerd compatibility
// Prevents: "Dynamic require of /.next/server/instrumentation.js is not supported" -> 500 Server failed to respond
const handlerPath = path.resolve('.open-next/server-functions/default/handler.mjs');

if (fs.existsSync(handlerPath)) {
  let code = fs.readFileSync(handlerPath, 'utf8');
  let modified = false;

  // A. Patch loadInstrumentationModule
  const target1 = 'async loadInstrumentationModule(){if(!this.serverOptions.dev)try{this.instrumentation=await(0,_instrumentationglobalsexternal.getInstrumentationModule)(this.dir,this.nextConfig.distDir)}catch(e){if(e.code!=="MODULE_NOT_FOUND")throw new Error("An error occurred while loading the instrumentation hook",{cause:e})}return this.instrumentation}';
  if (code.includes(target1)) {
    code = code.replace(target1, 'async loadInstrumentationModule(){return this.instrumentation}');
    modified = true;
    console.log('✓ Patched loadInstrumentationModule in handler.mjs');
  } else {
    const regex1 = /async loadInstrumentationModule\(\)\{[\s\S]*?return this\.instrumentation\}/;
    if (regex1.test(code)) {
      code = code.replace(regex1, 'async loadInstrumentationModule(){return this.instrumentation}');
      modified = true;
      console.log('✓ Patched loadInstrumentationModule (via regex) in handler.mjs');
    }
  }

  // B. Patch runInstrumentationHookIfAvailable
  const target2 = 'async runInstrumentationHookIfAvailable(){await(0,_instrumentationglobalsexternal.ensureInstrumentationRegistered)(this.dir,this.nextConfig.distDir)}';
  if (code.includes(target2)) {
    code = code.replace(target2, 'async runInstrumentationHookIfAvailable(){}');
    modified = true;
    console.log('✓ Patched runInstrumentationHookIfAvailable in handler.mjs');
  } else {
    const regex2 = /async runInstrumentationHookIfAvailable\(\)\{[\s\S]*?ensureInstrumentationRegistered[\s\S]*?\}/;
    if (regex2.test(code)) {
      code = code.replace(regex2, 'async runInstrumentationHookIfAvailable(){}');
      modified = true;
      console.log('✓ Patched runInstrumentationHookIfAvailable (via regex) in handler.mjs');
    }
  }

  // C. Patch getInstrumentationModule error rethrow
  const regex3 = /catch\(t2\)\{if\(\(0,_iserror\.default\)\(t2\)&&t2\.code!=="ENOENT"&&t2\.code!=="MODULE_NOT_FOUND"&&t2\.code!=="ERR_MODULE_NOT_FOUND"\)throw r=t2,t2\}/;
  if (regex3.test(code)) {
    code = code.replace(regex3, 'catch(t2){/* ignore workerd dynamic require error */}');
    modified = true;
    console.log('✓ Patched getInstrumentationModule error rethrow in handler.mjs');
  }

  if (modified) {
    fs.writeFileSync(handlerPath, code, 'utf8');
    console.log('✓ handler.mjs saved successfully with workerd patches.');
  }
}
