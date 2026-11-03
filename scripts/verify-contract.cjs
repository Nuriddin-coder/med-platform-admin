/**
 * verify-contract.cjs
 * Validates that every API endpoint invoked in the admin frontend code
 * exists in contract/openapi.json.
 */

const fs = require('fs');
const path = require('path');

const OPENAPI_FILE = path.resolve(__dirname, '../contract/openapi.json');
const SRC_DIR = path.resolve(__dirname, '../src');

if (!fs.existsSync(OPENAPI_FILE)) {
  console.error('\x1b[31m[ERROR]\x1b[0m contract/openapi.json fayli topilmadi!');
  process.exit(1);
}

// 1. Read and parse OpenAPI spec
const openapi = JSON.parse(fs.readFileSync(OPENAPI_FILE, 'utf8'));

interfaceOpenApiEndpoint = [];
const openapiEndpoints = [];

for (const [openApiPath, methods] of Object.entries(openapi.paths)) {
  // Strip '/api/v1' prefix for matching with frontend client baseURL
  const relativePath = openApiPath.replace(/^\/api\/v1/, '');
  
  // Create regex pattern to match parameterized URLs like /clinics/{id}
  // {anything} -> [^/]+
  const regexPattern = new RegExp(
    '^' + relativePath.replace(/\{[a-zA-Z0-9_]+\}/g, '[^/]+') + '$'
  );

  for (const [method, spec] of Object.entries(methods)) {
    if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
      openapiEndpoints.push({
        method: method.toUpperCase(),
        openApiPath,
        relativePath,
        regexPattern,
        summary: spec.summary || spec.operationId || '',
      });
    }
  }
}

console.log(`\x1b[36m[CONTRACT]\x1b[0m OpenAPI spetsifikatsiyasida \x1b[32m${openapiEndpoints.length}\x1b[0m ta endpoint mavjud.\n`);

// 2. Recursively find all typescript/tsx files in src/
function getSourceFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(file) && !file.endsWith('schema.d.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

const sourceFiles = getSourceFiles(SRC_DIR);

// 3. Extract API calls using regex
// Matches: api.get(...), apiClient.post(...), etc.
const apiCallRegex = /(?:api|apiClient)\.(get|post|patch|put|delete)(?:<[^>]+>)?\s*\(\s*([`'"][^`'"]+[`'"])/g;

const matchedCalls = [];
const unmatchedCalls = [];
const seenKeys = new Set();

for (const filePath of sourceFiles) {
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  let match;
  while ((match = apiCallRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const rawLiteral = match[2];
    
    // Extract url string from literal quotes
    let url = rawLiteral.slice(1, -1).trim();

    // Skip empty or generic template helpers
    if (!url || url.startsWith('http') && !url.includes('/api/v1')) {
      continue;
    }

    // Convert JS template expressions like `${id}` or `${clinicId}` to placeholder `:param`
    const normalizedUrl = url
      .replace(/\$\{[^}]+\}/g, 'SAMPLE_ID')
      .replace(/\?.*$/, ''); // strip query params

    const dedupeKey = `${method} ${normalizedUrl} [${relPath}]`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    // Find matching endpoint in OpenAPI
    const matchedSpec = openapiEndpoints.find((ep) => {
      if (ep.method !== method) return false;
      return ep.regexPattern.test(normalizedUrl);
    });

    if (matchedSpec) {
      matchedCalls.push({
        method,
        url: normalizedUrl,
        rawLiteral,
        contractPath: matchedSpec.openApiPath,
        file: relPath,
        summary: matchedSpec.summary,
      });
    } else {
      unmatchedCalls.push({
        method,
        url: normalizedUrl,
        rawLiteral,
        file: relPath,
      });
    }
  }
}

// 4. Output validation results
console.log('\x1b[34m=================================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m           FRONTEND VA CONTRACT ENDPOINTLARINI TEKSHIRISH        \x1b[0m');
console.log('\x1b[34m=================================================================\x1b[0m\n');

console.log(`Frontend kodidan topilgan jami API murojaatlar: \x1b[1m${matchedCalls.length + unmatchedCalls.length}\x1b[0m ta`);
console.log(`Spetsifikatsiya bilan mos kelgan endpointlar:    \x1b[32m\x1b[1m${matchedCalls.length}\x1b[0m ta\n`);

console.log('\x1b[1m--- TASDIQLANGAN ENDPOINTLAR RO\'YXATI ---\x1b[0m');
matchedCalls.forEach((call, i) => {
  const methodPadded = call.method.padEnd(6);
  console.log(
    ` \x1b[32m✓\x1b[0m [${methodPadded}] \x1b[33m${call.contractPath.padEnd(42)}\x1b[0m \x1b[90m(${call.file})\x1b[0m`
  );
});

if (unmatchedCalls.length > 0) {
  console.log('\n\x1b[31m\x1b[1m--- XATOLIK: MOS KELMAGAN YOKI CONTRACTDA YO\'Q ENDPOINTLAR ---\x1b[0m');
  unmatchedCalls.forEach((call) => {
    console.log(
      ` \x1b[31m✗\x1b[0m [${call.method.padEnd(6)}] ${call.url} \x1b[90m(${call.file})\x1b[0m`
    );
  });
  console.log('\n\x1b[31m[FAILED]\x1b[0m Contractda mavjud bo\'lmagan endpointlar topildi!');
  process.exit(1);
} else {
  console.log('\n\x1b[32m\x1b[1m[SUCCESS] Barcha frontend endpointlari Contract (openapi.json) bilan 100% to\'liq mos keldi!\x1b[0m\n');
  process.exit(0);
}

