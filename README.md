
 What I Built

I built a role-based access control demo for a bookshop application using Node.js. The application supports two roles: a normal user and an administrator. Normal users can sign in, access their dashboard, and sign out, while administrators have additional access to the administration page and can publish announcements.

I implemented authentication and server-side authorization for protected routes and endpoints. I also made the interface role-aware so that administrator-specific navigation and functionality are not shown to normal users. The project includes responsive styling and automated tests covering authentication, admin-page access, protected admin actions, and role-based UI behavior.

What I Found Difficult

The main challenge was making sure that permissions were enforced on the server rather than relying only on what was visible in the frontend. I had to consider cases where a normal user could try to directly access an admin page or send a request to an admin-only endpoint, and make sure those requests were properly protected.

Another challenge was keeping the UI consistent with the user's role while maintaining the server as the actual security layer.

What I Left Out

I kept the project focused on demonstrating authentication and role-based permissions rather than building a complete bookshop system. I did not implement features such as a full product/catalogue management system, shopping cart, payment processing, or a database-backed production deployment.

Testing

I added automated tests to verify authentication, role-based access to the administration page, protection of the admin mutation endpoint, and role-aware UI behavior.