const crypto = require('node:crypto');

const users = [
  {
    id: 'u-admin',
    email: 'admin@example.test',
    name: 'Ada Admin',
    role: 'admin',
    password: 'AdminPass123!'
  },
  {
    id: 'u-normal',
    email: 'user@example.test',
    name: 'Nora Normal',
    role: 'normal',
    password: 'UserPass123!'
  }
];

const sessions = new Map();

function findUser(email, password) {
  return users.find(
    (user) => user.email === email && safeEqual(user.password, password)
  );
}

function safeEqual(left, right) {
  const a = Buffer.from(left || '');
  const b = Buffer.from(right || '');

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('base64url');

  sessions.set(token, user.id);

  return token;
}

function getUserFromRequest(request) {
  const token = parseCookies(request.headers.cookie).session;
  const id = token && sessions.get(token);

  return users.find((user) => user.id === id);
}

function destroySession(request) {
  const token = parseCookies(request.headers.cookie).session;

  if (token) {
    sessions.delete(token);
  }
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => {
        const index = part.indexOf('=');

        if (index === -1) {
          return [];
        }

        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();

        try {
          return [key, decodeURIComponent(value)];
        } catch {
          return [key, value];
        }
      })
      .filter((entry) => entry.length)
  );
}

function requireAuth(handler) {
  return (request, response, user, ...args) => {
    if (!user) {
      return sendError(response, 401, 'Sign in is required.');
    }

    return handler(request, response, user, ...args);
  };
}

function requireRole(role, handler) {
  return requireAuth((request, response, user, ...args) => {
    if (user.role !== role) {
      return sendError(
        response,
        403,
        'You do not have permission to access this resource.'
      );
    }

    return handler(request, response, user, ...args);
  });
}

function sendError(response, status, message) {
  response.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8'
  });

  response.end(
    `<!doctype html><title>${status}</title><h1>${status}</h1><p>${message}</p>`
  );
}

module.exports = {
  createSession,
  destroySession,
  findUser,
  getUserFromRequest,
  requireAuth,
  requireRole,
  users
};