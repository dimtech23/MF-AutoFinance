const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const target = process.env.REACT_APP_API_URL || 'https://server.mfautosfinance.com';
  
  console.log('Setting up proxy middleware with target:', target);
  
  // Proxy for auth routes
  app.use(
    '/auth',
    createProxyMiddleware({
      target,
      secure: true,
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Auth Proxy Error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Auth Proxy Error: Cannot connect to server. Please check if the server is running.');
      }
    })
  );

  // Proxy for API routes
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      secure: true,
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('API Proxy Error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('API Proxy Error: Cannot connect to server. Please check if the server is running.');
      }
    })
  );
};
