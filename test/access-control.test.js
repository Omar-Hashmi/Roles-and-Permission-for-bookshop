const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

async function signIn(email, password) {
  const response = await fetch(`${baseUrl}/login`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email, password }) });
  assert.equal(response.status, 303);
  return response.headers.get('set-cookie').split(';')[0];
}

test('guests are rejected from protected pages', async () => {
  const response = await fetch(`${baseUrl}/dashboard`, { redirect: 'manual' });
  assert.equal(response.status, 401);
});

test('normal users may reach their dashboard', async () => {
  const cookie = await signIn('user@example.test', 'UserPass123!');
  const response = await fetch(`${baseUrl}/dashboard`, { headers: { cookie } });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /normal user/);
});

test('normal users cannot open the admin page by typing its URL', async () => {
  const cookie = await signIn('user@example.test', 'UserPass123!');
  const response = await fetch(`${baseUrl}/admin`, { headers: { cookie }, redirect: 'manual' });
  assert.equal(response.status, 403);
});

test('normal users cannot invoke an admin action directly', async () => {
  const cookie = await signIn('user@example.test', 'UserPass123!');
  const response = await fetch(`${baseUrl}/admin/announcements`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'message=not+allowed', redirect: 'manual' });
  assert.equal(response.status, 403);
});

test('normal-user UI omits admin-only actions', async () => {
  const cookie = await signIn('user@example.test', 'UserPass123!');
  const html = await (await fetch(`${baseUrl}/dashboard`, { headers: { cookie } })).text();
  assert.doesNotMatch(html, /Administration/);
  assert.doesNotMatch(html, /Publish announcement/);
});

test('admins can access the admin page and publish announcements', async () => {
  const cookie = await signIn('admin@example.test', 'AdminPass123!');
  const admin = await fetch(`${baseUrl}/admin`, { headers: { cookie } });
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /Publish announcement/);
  const publish = await fetch(`${baseUrl}/admin/announcements`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'message=System+maintenance', redirect: 'manual' });
  assert.equal(publish.status, 303);
});
