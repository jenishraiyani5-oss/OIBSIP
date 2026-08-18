# SQL Injection — Testing Log & Remediation Report

**Task:** Task 9: SQL Injection on DVWA (Medium Security)
**Target:** DVWA (Damn Vulnerable Web Application) — local lab instance
**Environment:** Kali Linux 2026.1 (VMware) → DVWA @ `http://127.0.0.1:42001/vulnerabilities/sqli/`
**DVWA Security Level:** Medium
**Tool Used:** sqlmap 1.10.8#stable
**Authorization:** Self-hosted lab environment; testing performed against own local VM only

---

## 1. Objective

Assess the `id` parameter on DVWA's SQL Injection module (Medium security level) for
SQL injection vulnerabilities, and document the process of identifying the injection
point, enumerating the back-end database, and extracting schema information.

---

## 2. Methodology (Steps Performed)

1. **Environment setup**
   - Logged into DVWA in-browser and set Security Level to **Medium**.
   - Opened the SQL Injection module page.

2. **Session capture**
   - Used browser DevTools (F12 → Storage → Cookies) to retrieve the active
     `PHPSESSID` cookie value, required since DVWA gates this page behind
     authentication.

3. **Confirming the request format**
   - Noted that at Medium level, DVWA submits the `id` parameter via **POST**
     (not GET, as at Low level), so testing required `--data` rather than a
     URL query string.

4. **Initial connectivity/injection test**
   - Ran sqlmap against the target with the captured cookie and POST body,
     without any enumeration flags, to confirm the injection point exists
     before proceeding further.

5. **Vulnerability confirmation**
   - sqlmap identified the `id` POST parameter as injectable via three
     techniques: boolean-based blind, time-based blind, and UNION query
     (2 columns).
   - Back-end identified as **MySQL ≥ 5.0.12 (MariaDB fork)**, running behind
     **Nginx 1.30.1**.

6. **Database enumeration**
   - Re-ran sqlmap with `--dbs` to list available databases.
   - Result: `dvwa`, `information_schema`.

7. **Table enumeration**
   - Re-ran sqlmap with `-D dvwa --tables` to list tables within the `dvwa`
     database.
   - Result: `guestbook`, `users`.

8. **Column enumeration**
   - Re-ran sqlmap with `-D dvwa -T users --columns` to enumerate the schema
     of the `users` table.
   - Result: 8 columns — `user`, `avatar`, `failed_login`, `first_name`,
     `last_login`, `last_name`, `password`, `user_id`.

*(sqlmap reuses its stored session file between runs, which is why later
commands "resumed" the previously discovered injection point automatically
rather than re-testing from scratch.)*

---

## 3. Findings Summary

| Item | Result |
|---|---|
| Vulnerable parameter | `id` (POST) |
| Injection techniques confirmed | Boolean-based blind, Time-based blind, UNION query |
| Back-end DBMS | MySQL ≥ 5.0.12 (MariaDB fork) |
| Databases discovered | `dvwa`, `information_schema` |
| Tables in `dvwa` | `guestbook`, `users` |
| Columns in `users` | user, avatar, failed_login, first_name, last_login, last_name, password, user_id |

**Severity:** High — an authenticated attacker can extract arbitrary data
from the `users` table, including password hashes, via a parameter that
was assumed to be protected by input escaping at the Medium security
setting.

---

## 4. Remediation

### 4.1 Why This Vulnerability Exists

The root cause is that the application builds SQL queries by directly
concatenating user input into the query text, instead of treating user
input as *data* that is kept separate from the query's *structure*.

At DVWA's Low level, the vulnerable code is effectively:

```php
$id = $_REQUEST['id'];
$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id'";
```

At Medium level, DVWA applies `mysqli_real_escape_string()` to the input.
This escapes quote characters but does not change the underlying design
flaw — user input is still concatenated directly into the query string.
Since `id` is numeric, UNION-based payloads that don't rely on quotes at
all can still succeed, which is exactly what was demonstrated above.

The core problem: the database engine cannot distinguish "this is part of
the SQL command" from "this is a value the user supplied," because both
arrive as one combined string. Any SQL syntax embedded in user input
(quotes, `UNION`, `OR`, comment markers) gets interpreted as code, not
data. Escaping is a blocklist-style defense — it is fragile, driver-specific,
and easy to miss on one input path.

### 4.2 The Fix: Parameterized Queries / Prepared Statements

Parameterized queries send the SQL structure and the user-supplied values
to the database *separately*. The engine compiles the query plan first,
then binds values purely as data — they can never be reinterpreted as SQL
syntax.

#### PHP Example (mysqli)

**Vulnerable:**
```php
$id = $_REQUEST['id'];
$query = "SELECT first_name, last_name FROM users WHERE user_id = '$id'";
$result = mysqli_query($conn, $query);
```

**Fixed:**
```php
$id = $_REQUEST['id'];

$stmt = $conn->prepare("SELECT first_name, last_name FROM users WHERE user_id = ?");
$stmt->bind_param("s", $id);   // "s" = string; use "i" for integer
$stmt->execute();

$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    echo $row['first_name'] . " " . $row['last_name'];
}

$stmt->close();
```

#### Python Example (DB-API style, e.g. mysql-connector-python)

**Vulnerable:**
```python
user_id = request.args.get('id')
query = f"SELECT first_name, last_name FROM users WHERE user_id = '{user_id}'"
cursor.execute(query)
```

**Fixed:**
```python
user_id = request.args.get('id')

query = "SELECT first_name, last_name FROM users WHERE user_id = %s"
cursor.execute(query, (user_id,))   # value passed separately, as a tuple

for row in cursor.fetchall():
    print(row['first_name'], row['last_name'])
```

(Placeholder style varies by driver — `%s` for mysql-connector-python /
psycopg2, `?` for sqlite3 — but the principle is universal: never build
SQL with f-strings, string concatenation, or `.format()`.)

### 4.3 Defense in Depth

- **Least privilege:** the DB account used by the app should not have
  rights to read/write tables it doesn't need, limiting impact even if
  an injection flaw slips through.
- **Input validation:** for a numeric `id`, validate/cast it as an integer
  before it reaches the query, as an additional layer.
- **ORMs** (SQLAlchemy, Django ORM, Laravel Eloquent, etc.) parameterize
  queries by default, reducing the risk of a developer accidentally
  writing raw concatenated SQL.

---



## 6. References

- OWASP Top 10 — A03:2021 Injection
- PortSwigger Web Security Academy — SQL Injection
- DVWA documentation (security level source code comparison: Low vs Medium vs High)
