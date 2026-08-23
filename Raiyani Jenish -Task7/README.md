# Task 7 · Vulnerability Scanning with Nikto

## Objective
Use Nikto to perform an automated vulnerability scan on a web server, analyze the results, and document identified security issues with recommended remediation steps.

---

## ⚠️ Ethics Note
This scan was performed **only against a locally hosted DVWA/Apache instance** running on my own machine (localhost). Running Nikto against any website or server you do not own or have explicit written permission to test is illegal and unethical.

---

## What Is Nikto?

**Nikto** is a free, open-source web server vulnerability scanner. It automates the process of checking a web server against a large database of known issues, including:
- Outdated server software and known-vulnerable versions
- Dangerous files/CGI scripts left on the server
- Missing security headers (e.g., `X-Frame-Options`, `X-Content-Type-Options`)
- Default files, default credentials, and misconfigurations
- Server configuration issues (e.g., directory listing enabled)

Nikto sends thousands of requests to a target web server and compares the responses against its plugin/signature database to flag anything that looks like a known vulnerability or bad practice.

## Nikto's Limitations — It Is a "Noisy" Scanner

Nikto is explicitly described (including by its own documentation) as a **noisy** scanner. This means:
- It sends a very large number of requests in a short time, which is easily detected by intrusion detection systems (IDS), web application firewalls (WAF), and server logs — it makes no attempt to be stealthy or evade detection.
- Because it is signature/database-based, it can produce **false positives** (flagging something as an issue that isn't actually exploitable in context) and **false negatives** (missing vulnerabilities that don't match a known signature, such as custom application logic flaws).
- It does not exploit anything — it only reports *potential* issues based on server responses (headers, banners, file presence), so every finding requires human judgment and verification, not blind trust.
- Because of the noise, Nikto is appropriate for **authorized testing on systems you control** (like this local DVWA lab) and is not something to run against production or third-party systems without explicit, documented permission — doing so would very likely trigger security alerts and could be considered an attack.

## Nikto vs. Nmap — What's the Difference?

| | Nmap | Nikto |
|---|---|---|
| **Primary purpose** | Network/port scanner — discovers hosts, open ports, and running services across a network | Web application/server vulnerability scanner — focused specifically on HTTP(S) servers |
| **Layer of focus** | Network layer (TCP/IP, ports, services) | Application layer (HTTP responses, headers, files, web server config) |
| **Typical use** | "What's alive on this network, and what services are running?" | "Given a web server I already know about, what specific web-level vulnerabilities does it have?" |
| **Output** | Open ports, service versions, OS fingerprint | List of flagged web server issues (outdated software, missing headers, exposed files, etc.) |

In practice, the two are complementary and often used together: **Nmap discovers** that a host has a web server running on port 80/443, and **Nikto then digs into** that specific web server to find application/server-level issues.

---

## Installation

Nikto is often pre-installed on Kali Linux. Verify with:
```bash
nikto -Version
```

If not installed:
```bash
sudo apt update
sudo apt install nikto -y
```

Screenshot: `nikto_install.png`

---

## Target

- Target: DVWA / Apache running locally at `http://localhost/dvwa` (and `http://localhost` for the base Apache server)
- Environment: Kali Linux VM, isolated lab network — no external systems scanned

---

## Scans Performed

### 1. Basic Scan
```bash
nikto -h http://localhost/dvwa
```
Screenshot: `screenshots/02_basic_scan.png`

### 2. Scan With Output Saved to File
```bash
nikto -h http://localhost/dvwa -o nikto_scan_results.txt
```
Full results saved in [`nikto_scan_results.txt`](./nikto_scan_results.txt).
Screenshot: `scan_with_output.png`

### 3. SSL Scan
```bash
nikto -h https://localhost -ssl
```
> Note: DVWA's default local setup runs over plain HTTP only, so no HTTPS/SSL was configured on this target. This command was attempted and the result (either an SSL-specific finding set, or a connection failure confirming HTTPS is not enabled) is documented in `nikto_scan_results.txt`. If HTTPS is not available, this is itself worth noting as a finding: the site does not enforce or offer encrypted transport.

Screenshot: `ssl_scan.png`

---

## Findings — Categorized by Severity

Based on the actual scan against `http://localhost/dvwa` (17 total findings). Full detail for each is in [`nikto_scan_results.txt`](./nikto_scan_results.txt).

### 🔴 High Severity

**Exposed `.git` repository** (`/dvwa/.git/index`, `/dvwa/.git/HEAD`, `/dvwa/.git/config`)
- What it is: The application's Git version-control folder is publicly web-accessible.
- Why it's a risk: An attacker can reconstruct the full source code and commit history — including any hardcoded credentials or secrets ever committed — using tools like `git-dumper`.
- Fix: Remove `.git` from the public web root, or block access to any `.git` path at the server level (e.g., Apache `RedirectMatch 404 /\.git`).

**Directory indexing enabled on `/dvwa/config/`**
- What it is: Browsing this folder returns a full file listing instead of a 403/404.
- Why it's a risk: This folder holds the app's configuration file, which may contain database credentials — indexing makes it trivial to discover and download.
- Fix: Disable directory indexing (`Options -Indexes`) and restrict direct access to configuration files.

### 🟠 Medium Severity

**Configuration information may be available remotely** (`/dvwa/config/`)
- Risk: Exposed config details give attackers a head start on database/internal attacks.
- Fix: Restrict direct HTTP access to config files; use environment variables/secrets managers instead.

**Directory indexing enabled** on `/dvwa/database/`, `/dvwa/tests/`, `/dvwa/docs/`
- Risk: Exposes database setup scripts, test notes, and internal docs not meant for public access.
- Fix: Disable directory indexing site-wide unless explicitly required.

**Missing `Content-Security-Policy` header**
- Risk: CSP is a key browser-side defense against XSS; without it, any XSS bug elsewhere has far greater impact.
- Fix: Add a `Content-Security-Policy` header (e.g., `default-src 'self'`), tuned to the app's actual resource needs.

**Missing `Strict-Transport-Security` (HSTS) header**
- Risk: Without HSTS, browsers won't force HTTPS on future visits, leaving room for downgrade/MITM attacks.
- Fix: Serve over HTTPS and add `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

### 🟡 Low Severity

**Missing `X-Content-Type-Options` header**
- Risk: Allows MIME-sniffing, which can be abused in some XSS scenarios.
- Fix: Add `X-Content-Type-Options: nosniff`.

**Missing `Referrer-Policy` header**
- Risk: Full referring URLs (possibly containing sensitive data) may leak to third-party sites.
- Fix: Add `Referrer-Policy: strict-origin-when-cross-origin`.

**Missing `Permissions-Policy` header**
- Risk: Browser features (camera, mic, geolocation) aren't explicitly restricted — a defense-in-depth gap.
- Fix: Add `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

**Admin login page found** (`/dvwa/login.php`)
- Risk: A discoverable login page is an easy target for brute-force/credential-stuffing attempts.
- Fix: Add rate-limiting, account lockout, and MFA for admin login in any real deployment.

## Repository Structure

```
├── README.md
├── nikto_scan_results.txt
├── nikto_install.png
├── basic_scan.png
├── scan_with_output.png
└── ssl_scan.png
```

---
