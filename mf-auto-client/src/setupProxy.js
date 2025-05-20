const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const target = process.env.REACT_APP_API_URL || 'https://server.mfautosfinance.com';
  
  // Proxy for auth routes
  app.use(
    '/auth',
    createProxyMiddleware({
      target,
      secure: true,
      changeOrigin: true,
      onError: (err, req, res) => {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Cannot connect to server. Please check if the server is running.');
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
      onError: (err, req, res) => {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Cannot connect to server. Please check if the server is running.');
      }
    })
  );
};
