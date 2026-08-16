# Task 3 · SQL Injection on DVWA (Low Security)

## Objective
Demonstrate a classic SQL Injection vulnerability by exploiting the login/search form of DVWA (Damn Vulnerable Web Application) at its Low security setting, and document the attack along with an explanation of how it works and how to prevent it.

---

## ⚠️ Ethics Note
This task was performed **only against DVWA running locally** on my own machine (localhost), in an isolated lab environment set up specifically for learning. SQL Injection was **never** attempted against any real, third-party, or production website or service. Practicing on DVWA is legal and intended precisely for this kind of hands-on security education; using these same techniques against systems you do not own or have explicit permission to test is illegal.

---

## What Is SQL Injection?

**SQL Injection (SQLi)** is a web security vulnerability that allows an attacker to interfere with the SQL queries an application makes to its database. It happens when user-supplied input (like a form field or URL parameter) is inserted directly into a SQL query string without being properly validated or escaped. Because the database cannot tell the difference between "data" and "code" in a raw, concatenated query, an attacker can craft input that changes the *meaning* of the query itself — for example, turning a simple lookup into a command that bypasses authentication or dumps an entire table.

In plain language: if a website builds its database queries like this —

```php
$query = "SELECT * FROM users WHERE id = '" . $_GET['id'] . "'";
```

— then whatever the user types into that `id` field gets pasted directly into the SQL command. If the input isn't sanitized, the user can type SQL syntax instead of a normal ID, and the database will execute it as part of the query.

---

## DVWA Setup

DVWA (Damn Vulnerable Web Application) was installed locally using [XAMPP / LAMP] on [Windows / Linux].

### Steps followed:
1. Installed [XAMPP from apachefriends.org / Apache, MySQL, PHP via `apt`].
2. Downloaded DVWA from `https://github.com/digininja/DVWA`.
3. Copied `config/config.inc.php.dist` to `config/config.inc.php` and configured database credentials.
4. Started Apache and MySQL services.
5. Navigated to `http://localhost/dvwa/setup.php` and clicked **"Create / Reset Database"**.
6. Logged in with default credentials: `admin` / `password`.
7. Set the security level to **Low** via the **DVWA Security** menu.

Screenshot: `screenshots/dvwa_setup.png`, `screenshots/security_level_low.png`

---

## Exploitation: SQL Injection Walkthrough

### Location
DVWA → **SQL Injection** module → "User ID" input field.

### Payload 1: Authentication/Filter Bypass
**Input:**
```
' OR '1'='1
```

**What happens:** The application's query (at Low security) is built roughly like:
```sql
SELECT first_name, last_name FROM users WHERE user_id = '' OR '1'='1';
```
Because `'1'='1'` is always true, the `WHERE` clause no longer filters by a specific user ID — it evaluates to true for **every row** in the table. Instead of returning data for a single user, the query returns **all users' data** in the `users` table.

**Data exposed (actual result from testing):** First and last names of every user in the DVWA `users` table:
- admin / admin
- Gordon / Brown
- Hack / Me
- Pablo / Picasso
- Bob / Smith

Screenshot: `screenshots/payload1_or_11.png`

---

### Payload 2: Data Extraction via UNION SELECT
**Input:**
```
' UNION SELECT user, password FROM users-- -
```

**What happens:** This payload uses a `UNION SELECT` to append a second query onto the original one, pulling data from a completely different set of columns (`user`, `password`) in the `users` table. The `-- -` comments out the rest of the original query so it doesn't cause a syntax error. Since DVWA's Low-security query returns exactly two columns (matching `first_name`/`last_name`), the `UNION SELECT` must also select exactly two columns for it to work.

**Data exposed (actual result from testing):** Usernames and their corresponding MD5 password hashes, extracted directly from the `users` table:

| Username | Password Hash (MD5) |
|---|---|
| admin | 5f4dcc3b5aa765d61d8327deb882cf99 |
| gordonb | e99a18c428cb38d5f260853678922e03 |
| 1337 | 8d3533d75ae2c3966d7e0d4fcc69216b |
| pablo | 0d107d09f5bbe40cade3de5c71e9e9b7 |
| smithy | 5f4dcc3b5aa765d61d8327deb882cf99 |

Notably, `admin` and `smithy` share the identical hash — this is the well-known MD5 hash of the plaintext word "password," revealing that both accounts use the same weak, easily-cracked password.

Screenshot: `screenshots/payload2_union_select.png`

---


## Repository Structure

```
├── README.md
├── sql_injection_notes.md
├── security_level_low.png
├── payload1png
└── payload2.png
```

---
