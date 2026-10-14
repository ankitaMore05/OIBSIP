# Login Authentication System
Oasis Infobyte SIP | Web Development & Designing | Level 2, Task 4

Approach A: front-end only (HTML, CSS, JavaScript, localStorage).

## Features
- Registration with username/email + password
- Password rule: at least 8 characters and 1 number
- Duplicate user check
- Login with a generic error ("Invalid username or password"), so it does not reveal which field is wrong
- Protected dashboard: redirects to login if there is no session
- Logout clears the session
- Passwords are hashed (SHA-256 with a random salt using the Web Crypto API), never stored in plain text
- Empty-form validation on both pages

## Limitation
Everything runs in the browser, so this is a learning demo. Real systems verify passwords on a server.

## Run
Open `register.html` first (works best from `localhost` or a browser that allows Web Crypto on local files, e.g. Chrome/Edge/Firefox).

## What I learned
(Write 2-3 sentences in your own words.)
