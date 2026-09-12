const http = require('node:http');
const { createSession, destroySession, findUser, getUserFromRequest, requireAuth, requireRole } = require('./auth');

const announcements = [];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function layout(title, user, content) {
  const navigation = user
    ? `<nav><a href="/dashboard">Dashboard</a>${user.role === 'admin' ? ' <a href="/admin">Administration</a>' : ''} <form method="post" action="/logout"><button>Sign out</button></form></nav>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="stylesheet" href="/styles.css"></head><body>${navigation}<main>${content}</main></body></html>`;
}

function sendHtml(response, html, status = 200, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  response.end(html);
}

function redirect(response, location, headers = {}) {
  response.writeHead(303, { Location: location, ...headers });
  response.end();
}

async function body(request) {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return Object.fromEntries(new URLSearchParams(raw));
}

function loginPage(response, error = '') {
  sendHtml(response, layout('Sign in', null, `<h1>Sign in</h1>${error ? `<p role="alert">${error}</p>` : ''}<form method="post" action="/login"><label>Email <input required type="email" name="email"></label><label>Password <input required type="password" name="password"></label><button>Sign in</button></form>`));
}

const dashboard = requireAuth((request, response, user) => {
  const message = user.role === 'admin' ? '<p class="notice">You have administrator access.</p>' : '<p class="notice">You are signed in as a normal user.</p>';
  sendHtml(response, layout('Dashboard', user, `<h1>Welcome, ${escapeHtml(user.name)}</h1>${message}<h2>Announcements</h2>${announcements.length ? `<ul>${announcements.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p>No announcements yet.</p>'}`));
});

const adminPage = requireRole('admin', (request, response, user) => {
  sendHtml(response, layout('Administration', user, `<h1>Administration</h1><p>Only administrators can manage announcements.</p><form method="post" action="/admin/announcements"><label>Announcement <textarea required name="message" maxlength="280"></textarea></label><button>Publish announcement</button></form>`));
});

const publishAnnouncement = requireRole('admin', async (request, response) => {
  const { message } = await body(request);
  if (!message || !message.trim()) return sendHtml(response, '<h1>400</h1><p>An announcement is required.</p>', 400);
  announcements.unshift(message.trim());
  redirect(response, '/admin');
});

function createApp() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const user = getUserFromRequest(request);
    if (request.method === 'GET' && url.pathname === '/styles.css') {
      response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
      return response.end(require('node:fs').readFileSync(require('node:path').join(__dirname, '../public/styles.css')));
    }
    if (request.method === 'GET' && url.pathname === '/') return redirect(response, user ? '/dashboard' : '/login');
    if (request.method === 'GET' && url.pathname === '/login') return loginPage(response);
    if (request.method === 'POST' && url.pathname === '/login') {
      const { email, password } = await body(request);
      const account = findUser(email, password);
      if (!account) return loginPage(response, 'Invalid email or password.');
      const session = createSession(account);
      return redirect(response, '/dashboard', { 'Set-Cookie': `session=${session}; HttpOnly; SameSite=Lax; Path=/` });
    }
    if (request.method === 'POST' && url.pathname === '/logout') {
      destroySession(request);
      return redirect(response, '/login', { 'Set-Cookie': 'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    }
    if (request.method === 'GET' && url.pathname === '/dashboard') return dashboard(request, response, user);
    if (request.method === 'GET' && url.pathname === '/admin') return adminPage(request, response, user);
    if (request.method === 'POST' && url.pathname === '/admin/announcements') return publishAnnouncement(request, response, user);
    sendHtml(response, '<h1>404</h1><p>Page not found.</p>', 404);
  });
}

if (require.main === module) {
  createApp().listen(3000, () => console.log('Listening at http://localhost:3000'));
}

module.exports = { createApp };
