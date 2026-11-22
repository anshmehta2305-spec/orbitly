import http from 'http';

interface RouteResult {
  route: string;
  status: number;
  ttfbMs: number;
  totalMs: number;
  bodyBytes: number;
  jsScriptsCount: number;
}

const routes = [
  '/',
  '/pricing',
  '/features',
  '/login',
  '/signup',
  '/dashboard',
  '/calendar',
  '/channels',
  '/analytics',
];

function measureRoute(path: string, cookie?: string): Promise<RouteResult> {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const start = performance.now();
    let ttfb = 0;

    const req = http.get(
      url,
      {
        headers: {
          ...(cookie ? { Cookie: cookie } : {}),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Performance-Tester',
        },
      },
      (res) => {
        ttfb = performance.now() - start;
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const totalMs = performance.now() - start;
          const jsScripts = (data.match(/<script[^>]+src=["']([^"']+)["']/g) || []).length;
          resolve({
            route: path,
            status: res.statusCode || 0,
            ttfbMs: Math.round(ttfb),
            totalMs: Math.round(totalMs),
            bodyBytes: Buffer.byteLength(data),
            jsScriptsCount: jsScripts,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        route: path,
        status: 0,
        ttfbMs: 0,
        totalMs: Math.round(performance.now() - start),
        bodyBytes: 0,
        jsScriptsCount: 0,
      });
    });
  });
}

async function main() {
  console.log('--- STARTING ROUTE MEASUREMENTS (DEV MODE) ---');
  // First login to get session cookie for protected routes
  let cookie = '';
  try {
    const authRes = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@orbitly.app', password: 'Password123!' }),
    });
    const setCookie = authRes.headers.get('set-cookie');
    if (setCookie) {
      cookie = setCookie;
    }
  } catch (e) {
    console.warn('Could not authenticate for protected routes:', e);
  }

  const results: RouteResult[] = [];
  for (const r of routes) {
    console.log(`Measuring ${r}...`);
    const res = await measureRoute(r, cookie);
    console.log(`  -> Status: ${res.status} | TTFB: ${res.ttfbMs}ms | Total: ${res.totalMs}ms | Scripts: ${res.jsScriptsCount}`);
    results.push(res);
  }

  console.log('\n--- SUMMARY TABLE ---');
  console.table(results);
}

main();
