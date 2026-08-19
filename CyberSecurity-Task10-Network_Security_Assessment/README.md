# Network Security Assessment 

**Prepared by:** Jenish Raiyani
**Assessment Type:** Internal Lab Network Security Assessment
**Target:** Metasploitable2 training VM (intentionally vulnerable host)
**Methodology reference:** OWASP Web Security Testing Guide, PTES Technical Guidelines
**Severity scoring:** CVSS v3.1 (first.org/cvss)

A full end-to-end network security assessment conducted against a local,
intentionally vulnerable lab VM (Metasploitable2), following the OWASP Web
Security Testing Guide and PTES Technical Guidelines methodology, with
CVSS-based severity scoring.

---

## Contents

| File | Description |
|---|---|
| [`network_security_assessment.md`](network_security_assessment.md) | Full report: scope, executive summary, technical findings per phase, findings register, and remediation roadmap |
| `nmap_results.txt` | Raw Nmap scan output (`-sS -sV -O`) |
| `nikto_results.txt` | Raw Nikto web vulnerability scan output |
| `wireshark_capture.pcap` | ~5.5-minute packet capture of live traffic |
| `screenshots/` | Terminal and Wireshark evidence referenced in the report |

## Methodology

- **Recon:** Nmap (`-sS -sV -O`) to enumerate live hosts, open ports, and service versions
- **Traffic analysis:** Wireshark, filtered on `http`, `dns`, and `arp` to inspect protocol behaviour and identify cleartext data exposure
- **Web vulnerability scan:** Nikto against the discovered web server
- **Severity scoring:** CVSS v3.1 ([first.org/cvss](https://www.first.org/cvss/))
- **Frameworks referenced:** [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/), [PTES Technical Guidelines](http://www.pentest-standard.org/)

## Environment

- **Attacker box:** Kali Linux 2026.1 (VMware)
- **Target:** Metasploitable2 (Rapid7's intentionally vulnerable training VM)
- **Network:** Isolated VMware NAT lab subnet (`192.168.179.0/24`)

## Key Findings (Summary)

The target exposed 23 network services, including an unauthenticated root
shell, a backdoored FTP daemon (vsftpd 2.3.4), and a backdoored IRC server
(UnrealIRCd) — all rated Critical. The web application layer added further
exposure via an unrestricted phpMyAdmin panel, a public `phpinfo()` page, and
a complete absence of TLS. Full details, CVSS scores, and remediation steps
are in the [findings register](network_security_assessment.md#4-findings-register).

## Disclaimer

All testing was performed against a private, self-owned lab environment
(Metasploitable2, a VM built specifically for security training) with no
production or third-party systems involved. This repository is for
educational purposes only.

## Author

Jenish Raiyani — B.Sc. IT (Cyber Security), Gujarat University
