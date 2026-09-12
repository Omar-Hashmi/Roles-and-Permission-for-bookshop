# Role-based access control demo

This app has two roles:

| Role | Allowed actions |
| --- | --- |
| Normal user | Sign in, view their dashboard, and sign out |
| Admin | Everything a normal user can do, plus view the administration page and publish announcements |

Authorization is enforced by the server for every protected endpoint. The UI also omits the Admin navigation and publish form for normal users, but it is not relied upon for security.

## Run

```powershell
node src/server.js
```

Open `http://localhost:3000`.

Demo accounts:

| Email | Password | Role |
| --- | --- | --- |
| `admin@example.test` | `AdminPass123!` | Admin |
| `user@example.test` | `UserPass123!` | Normal user |

## Test

```powershell
node --test
```

Tests cover authentication, direct navigation to the admin page, direct requests to the admin mutation endpoint, and role-aware UI.
