

## 1. Scope of Assessment

**Authorization:** This assessment was conducted on a private lab/test network owned
and controlled by the assessor, running entirely inside VMware on a local machine.
No production systems, third-party networks, or systems outside the assessor's
ownership were scanned or tested. The target, Metasploitable2, is a Rapid7-provided
VM intentionally built with known vulnerabilities for security training purposes.

**In-Scope IP Range(s):**
- `192.168.179.0/24` (VMware NAT lab subnet)
- Primary target host: `192.168.179.155` (Metasploitable2)
- Secondary host observed: `192.168.179.254` / `192.168.179.1` (gateway/interface)

**In-Scope Hosts / Services:**
- All live hosts discovered within the above range via Nmap
- All TCP services identified as open (see Section 3 — Phase 1 findings)
- The web application stack on port 80/8180 (Apache, PHP, phpMyAdmin, Tomcat)

**Out-of-Scope:**
- Any host outside `192.168.179.0/24`
- Denial-of-service testing, brute-force attacks, or active exploitation of
  discovered vulnerabilities (this assessment is limited to scanning, traffic
  capture, and passive/non-destructive vulnerability identification)
- Any third-party or production infrastructure

**Assessment Window:**
- Start: 2026-08-19, 22:56 IST
- End: 2026-08-19, 23:01 IST
- Testing was conducted only within this window (Nmap and Nikto scans, followed
  by a Wireshark capture of the resulting traffic).

**Tools Used:** Nmap 7.x, Wireshark, Nikto v2.6.0 (Kali Linux 2026.1)

---

## 2. Executive Summary

*(Non-technical — for a manager / non-technical stakeholder)*

This assessment examined a single lab host (Metasploitable2) representative of an
unpatched, legacy Linux server. The purpose was to demonstrate how quickly an
outdated, poorly configured server can be identified and mapped by an attacker
using only free, publicly available tools.

**Overall risk posture: Critical.**

The host exposes **23 network services**, several of which are widely known to
provide direct, unauthenticated access to the system — including a backdoored
shell service, an outdated FTP daemon with a known remote-exploit backdoor, and
an unencrypted remote-login (Telnet) service. In a real environment, any one of
these would very likely allow a remote attacker to gain full administrative
control of the server within minutes, without needing a stolen password.

The web application layer adds further exposure: it runs software last updated
in 2008–2010, exposes a database administration panel (phpMyAdmin) without
access restriction, and leaks detailed internal system information through a
publicly accessible diagnostic page.

**Business impact if this were a production system:**
- Complete compromise of the server and any data it holds (customer records,
  credentials, internal files)
- Use of the compromised server as a foothold to attack other internal systems
- Regulatory/compliance exposure if customer or personal data were involved
- Reputational damage from a publicly known, trivially exploitable weakness

**Recommended immediate action:** Decommission or fully rebuild any system in
this state before it is exposed to a real network. This report's remediation
roadmap (Section 6) prioritises fixes by severity and effort so a technical
team can address the highest-risk items first.

---

## 3. Technical Report

### 3.1 Phase 1 — Reconnaissance (Nmap)

**Command:** `nmap -sS -sV -O 192.168.179.0/24`

**Evidence:** see `nmap_results.txt` and screenshot below.

**Hosts discovered:**
| Host | Role | Notes |
|---|---|---|
| 192.168.179.155 | Target — Metasploitable2 | 23 open TCP ports, Linux 2.6.9–2.6.33 |
| 192.168.179.1 / .254 | Gateway / VMware NAT interface | Standard infrastructure host |

**Key open ports and services on 192.168.179.155:**

| Port | Service | Version | Notable Issue |
|---|---|---|---|
| 21 | FTP | vsftpd 2.3.4 | Known backdoored version (CVE-2011-2523) |
| 22 | SSH | OpenSSH 4.7p1 | Old release, multiple known CVEs |
| 23 | Telnet | Linux telnetd | Cleartext remote login |
| 25 | SMTP | Postfix smtpd | Open mail relay risk |
| 80 | HTTP | Apache 2.2.8 (Ubuntu) | End-of-life, unpatched |
| 139/445 | SMB | Samba 3.X–4.X | Legacy SMB, known RCEs (e.g. "usermap_script") |
| 1524 | bindshell | "Metasploitable root shell" | **Unauthenticated root shell over the network** |
| 3306 | MySQL | 5.0.51a | Very old, weak default config |
| 5432 | PostgreSQL | 8.3.0–8.3.7 | End-of-life |
| 5900 | VNC | protocol 3.3 | Weak/no auth by default |
| 6667 | IRC | UnrealIRCd | Known backdoored version (CVE-2010-2075) |
| 8180 | HTTP | Apache Tomcat/Coyote 1.1 | Default manager creds risk |

**Screenshot evidence:** Nmap scan output (terminal capture), showing full port/service/version table for `192.168.179.155`.

---

### 3.2 Phase 2 — Traffic Analysis (Wireshark)

**Capture duration:** ~5.5 minutes on the lab interface (`eth0`), 22:56–23:01 IST,
saved as `wireshark_capture.pcap` (5,995 total packets captured).

**Filters applied and observations:**

| Filter | Purpose | Observation |
|---|---|---|
| `http` | Isolate web traffic | 9 HTTP packets (0.2% of capture). All observed exchanges were `192.168.179.155 → 192.168.179.153`, HTTP/1.1 404 Not Found responses (`text/html`), consistent with the Nikto scan's directory/file probing captured live. Traffic is entirely plaintext — the full HTTP response headers and body (Apache/2.2.8 (Ubuntu) DAV/2 banner, content-length, etc.) are readable in the packet bytes with no encryption. |
| `dns` | Isolate name resolution | 138 DNS packets (2.3% of capture), all unencrypted. Queries observed from `192.168.179.153 → 192.168.179.2` for standard background lookups (`content-signature-2.cdn.mozilla.net`, `firefox.settings.services.mozilla.com`, `example.org`, `www.google.com`, `cloudflare-dns.com`) — normal OS/browser background chatter, but none of it uses DoH/DoT, so a network observer can see every domain resolved. |
| `arp` | Check for spoofing/anomalies | 10 ARP packets. Standard who-has/is-at exchanges between `.153 ↔ .2` and `.155/.153 ↔ .254`, each MAC consistently mapped to the same IP throughout the capture (e.g. `192.168.179.254 is at 00:50:56:f5:7b:f7` repeated identically at two different times). No duplicate or conflicting IP-to-MAC mappings — no evidence of ARP spoofing during the capture window. |

**Unencrypted sensitive data risk:** The `http` filter directly confirms the
target serves everything over plaintext HTTP (Apache 2.2.8, no TLS) — the
captured 404 responses show full server banners and headers in cleartext.
Because port 443 does not appear anywhere in the Nmap results, the same
applies to any real request to the host: credentials submitted to phpMyAdmin
or any other form on this server would be fully readable to anyone capturing
traffic on this segment, exactly as Nikto's missing `strict-transport-security`
finding (NIKTO-05) predicts structurally.

**Screenshot evidence:**
- `filter HTTP.png` — HTTP filter showing repeated 404 responses from 192.168.179.155, with the full plaintext response (Apache banner, headers, HTML body) visible in the packet bytes pane
- `filter DNS.png` — DNS filter showing 138 unencrypted queries/responses, including the raw query bytes for `content-signature-2.cdn.mozilla.net`
- `filter ARP.png` — ARP filter showing consistent, non-conflicting IP-to-MAC mappings across the capture window

---

### 3.3 Phase 3 — Web Vulnerability Scan (Nikto)

**Command:** `nikto -h http://192.168.179.155 -o nikto_results.txt`

**Evidence:** see `nikto_results.txt` and screenshot below.

**Summary of findings:**
- Outdated Apache (2.2.8) and PHP (5.2.4) — both many major versions behind current
- All modern security response headers missing (CSP, HSTS, X-Content-Type-Options, Referrer-Policy)
- `TRACE` HTTP method enabled — vulnerable to Cross-Site Tracing (XST)
- `phpinfo.php` publicly accessible — leaks full server configuration
- `phpMyAdmin` accessible with no IP restriction, plus an information-leaking `ChangeLog` file
- Multiple directory-indexing issues (`/icons/`, `/doc/`, `/test/`) exposing file listings
- PHP "Easter Egg" query strings functional, leaking version-fingerprint information
- Apache default files left in place (`/icons/README`)

**Screenshot evidence:** Nikto terminal output (as provided).

---

## 4. Findings Register

*(Sorted by severity, Critical → Info. IDs are phase-tagged: NMAP-xx, WS-xx, NIKTO-xx)*

| Finding ID | Description | Severity | Affected Asset | Recommended Fix |
|---|---|---|---|---|
| NMAP-01 | Port 1524/tcp exposes an unauthenticated root-level command shell ("Metasploitable root shell") | **Critical (10.0)** | 192.168.179.155:1524 | Remove/disable the service immediately; audit host for prior compromise |
| NMAP-02 | vsftpd 2.3.4 in use — this version contains a well-known backdoor allowing remote root access (CVE-2011-2523) | **Critical (10.0)** | 192.168.179.155:21 | Upgrade vsftpd to a current, patched release; verify binary integrity |
| NMAP-03 | UnrealIRCd in use — this build line contains a known backdoor (CVE-2010-2075) | **Critical (9.8)** | 192.168.179.155:6667 | Remove IRC service if unneeded; otherwise upgrade to a patched, verified build |
| WS-01 | All web/application traffic (HTTP, phpMyAdmin login) observed in cleartext — no TLS anywhere on the host | **High (7.5)** | 192.168.179.155:80, :8180 | Deploy HTTPS/TLS for all services; redirect HTTP to HTTPS; enforce HSTS |
| NMAP-04 | Telnet (port 23) open — remote login credentials transmitted in cleartext | **High (7.4)** | 192.168.179.155:23 | Disable Telnet entirely; use SSH with key-based authentication only |
| NMAP-05 | Samba 3.X (SMB) exposed — legacy version with known remote code execution issues (e.g. "usermap_script") | **High (8.1)** | 192.168.179.155:139, 445 | Patch/upgrade Samba; restrict SMB access to trusted hosts only |
| NIKTO-01 | phpMyAdmin accessible with no access restriction; adjacent ChangeLog file leaks internal file metadata (CVE-2003-1418) | **High (7.2)** | 192.168.179.155/phpMyAdmin/ | Restrict phpMyAdmin to authorized IPs/VPN; remove ChangeLog from web root |
| NMAP-06 | Apache 2.2.8 and PHP 5.2.4 in use — both long past end-of-life with multiple unpatched CVEs | **High (7.5)** | 192.168.179.155:80 | Upgrade to current stable Apache and PHP releases; enable auto-patching |
| NIKTO-02 | `phpinfo.php` publicly accessible, exposing full server/environment configuration | **Medium (5.3)** | 192.168.179.155/phpinfo.php | Remove or restrict phpinfo() diagnostic pages in any non-dev environment |
| NIKTO-03 | HTTP `TRACE` method enabled, host vulnerable to Cross-Site Tracing (XST) | **Medium (4.3)** | 192.168.179.155:80 | Disable TRACE/TRACK methods at the web server config level |
| NIKTO-04 | Directory indexing enabled on `/icons/`, `/doc/`, `/test/` | **Medium (4.0)** | 192.168.179.155:80 | Disable directory listing (`Options -Indexes`); remove unused test dirs |
| NMAP-07 | PostgreSQL and MySQL exposed directly on the network with old, weak-default versions | **Medium (5.9)** | 192.168.179.155:3306, 5432 | Bind DB services to localhost or a trusted management VLAN only |
| NMAP-08 | VNC (protocol 3.3) exposed — weak/no authentication by default in this protocol version | **Medium (5.9)** | 192.168.179.155:5900 | Disable if unneeded; otherwise enforce strong auth and restrict source IPs |
| NIKTO-05 | Recommended security response headers missing (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | **Low (5.3 combined / individually Low)** | 192.168.179.155:80 | Add security headers via web server or application middleware config |
| NIKTO-06 | Apache `mod_negotiation`/MultiViews enabled — allows attackers to enumerate filenames | **Low (3.7)** | 192.168.179.155:80 | Disable MultiViews unless explicitly required |
| NIKTO-07 | PHP "Easter Egg" query strings functional, disclosing version-fingerprint info | **Low (3.1)** | 192.168.179.155:80 | Set `expose_php = Off` in php.ini |
| NIKTO-08 | Apache default files left in place (`/icons/README`) | **Low (2.6)** | 192.168.179.155:80 | Remove default/sample files from the production web root |
| WS-02 | DNS queries observed unencrypted (no DoH/DoT) | **Low (3.1)** | Local subnet / resolver | Consider DNS-over-HTTPS/TLS for sensitive environments |
| WS-03 | ARP traffic showed no anomalies during the capture window | **Info** | Local subnet | No action — recorded as baseline for future comparison |

---

## 5. Remediation Roadmap

Findings grouped into a recommended fix order, balancing severity against effort.
Effort estimates assume this is treated as a real production remediation (on
Metasploitable2 itself, the "fix" is simply to retire the VM — the estimates
below reflect what each class of fix would take on a real, equivalent system).

| Priority | Finding ID(s) | Action | Effort |
|---|---|---|---|
| 1 | NMAP-01, NMAP-02, NMAP-03 | Remove/patch backdoored services (root bindshell, vsftpd, UnrealIRCd) | Medium |
| 2 | NMAP-04 | Disable Telnet, enforce SSH-only remote access | Easy |
| 3 | WS-01, NMAP-06 | Deploy TLS site-wide; upgrade Apache/PHP to current stable versions | Hard |
| 4 | NMAP-05 | Patch/upgrade Samba, restrict SMB to trusted hosts | Medium |
| 5 | NIKTO-01 | Restrict phpMyAdmin access, remove leaking ChangeLog file | Easy |
| 6 | NMAP-07, NMAP-08 | Bind DB services and VNC to internal-only interfaces or disable | Easy |
| 7 | NIKTO-02, NIKTO-03, NIKTO-04 | Remove diagnostic pages, disable TRACE, disable directory indexing | Easy |
| 8 | NIKTO-05, NIKTO-06, NIKTO-07, NIKTO-08 | Add security headers, disable MultiViews, hide PHP version, clean up default files | Easy |
| 9 | WS-02 | Evaluate DNS-over-HTTPS/TLS for the environment | Medium |

**Suggested sequencing rationale:** the top three priorities close off complete,
unauthenticated remote-takeover paths first — everything else is either
information disclosure or defense-in-depth hardening that matters, but doesn't
give an attacker instant full control the way NMAP-01–03 do.

---

## 6. Appendix — Evidence

- `nmap_results.txt` — raw Nmap scan output
- `nikto_results.txt` — raw Nikto scan output
- `wireshark_capture.pcap` — ~5.5 minute packet capture (5,995 packets)
- `screenshots/filter HTTP.png` — HTTP filter view
- `screenshots/filter DNS.png` — DNS filter view
- `screenshots/filter ARP.png` — ARP filter view

