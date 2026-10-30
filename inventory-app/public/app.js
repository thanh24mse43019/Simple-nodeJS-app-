const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});
if (res.ok) location.href = '/index.html';

//  check login, then load items
const me = await(await fetch('/api/me')).json();
if (!me) location.href = '/login.html';

// Only show Edit/Delete buttons for admins
if (me.role === 'admin') { /* add Edit and Delete buttons to each row todo*/ }