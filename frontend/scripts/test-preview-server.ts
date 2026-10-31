import http from 'node:http';
import { preview } from 'vite';

async function testServer() {
  console.log('Starting Vite preview server on port 3005...');
  const server = await preview({
    preview: { port: 3005, host: '127.0.0.1' }
  });

  const get = (urlPath: string): Promise<{ status: number; body: string }> => {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:3005${urlPath}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, body: data });
        });
      }).on('error', reject);
    });
  };

  try {
    // 1. Root / must return Landing Page (index.html)
    const rootRes = await get('/');
    console.log(`GET / status: ${rootRes.status}`);
    if (!rootRes.body.includes('landing-root')) {
      throw new Error(`GET / did not contain landing-root container! Body snippet: ${rootRes.body.slice(0, 300)}`);
    }
    console.log('✓ GET / successfully served landing page with #landing-root');

    // 2. /app must rewrite to /app.html
    const appRes = await get('/app');
    console.log(`GET /app status: ${appRes.status}`);
    if (!appRes.body.includes('id="root"')) {
      throw new Error(`GET /app did not contain root container! Body snippet: ${appRes.body.slice(0, 300)}`);
    }
    console.log('✓ GET /app successfully rewritten and served app.html with #root');

    // 3. /app/search must rewrite to /app.html
    const appSearchRes = await get('/app/search');
    console.log(`GET /app/search status: ${appSearchRes.status}`);
    if (!appSearchRes.body.includes('id="root"')) {
      throw new Error(`GET /app/search did not contain root container!`);
    }
    console.log('✓ GET /app/search successfully rewritten and served app.html');

    console.log('\nAll multi-page routing integration checks PASSED successfully!');
  } finally {
    server.httpServer.close();
  }
}

testServer().catch((err) => {
  console.error('Test server error:', err);
  process.exit(1);
});
