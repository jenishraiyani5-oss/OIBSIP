# OIBSIP — Cybersecurity Internship Tasks

This repository contains my task submissions for the Oasis Infobyte
Cybersecurity & Ethical Hacking Internship (OIBSIP). Each folder is a
self-contained task covering a different area of network security,
web application security, and security operations — including scope
definition, tool usage, findings, and remediation guidance.

## Author

Jenish Raiyani — B.Sc. IT (Cyber Security), Gujarat University

## Tasks

| Task | Description |
|---|---|
| [CyberSecurity-Task1-Nmap](./CyberSecurity-Task1-Nmap) | Network scanning and host/service enumeration using Nmap |
| [CyberSecurity-Task2-UFWFireConfig](./CyberSecurity-Task2-UFWFireConfig) | Firewall configuration and hardening using UFW |
| [CyberSecurity-Task3-SQL Injection](./CyberSecurity-Task3-SQL%20Injection) | SQL injection testing and analysis |
| [CyberSecurity-Task4-Network_Threats_report](./CyberSecurity-Task4-Network_Threats_report) | Report on common network threats and mitigations |
| [CyberSecurity-Task5-Social_EngineeringAttacks...](./CyberSecurity-Task5-Social_EngineeringAttacks_and_Prevention) | Social engineering attack techniques and prevention strategies |
| [CyberSecurity-Task6-Patch_Managementreport](./CyberSecurity-Task6-Patch_Managementreport) | Patch management process and reporting |
| [CyberSecurity-Task7-Vulnerability_Nikto](./CyberSecurity-Task7-Vulnerability_Nikto) | Web vulnerability scanning using Nikto |
| [CyberSecurity-Task8-Traffic_Wireshark](./CyberSecurity-Task8-Traffic_Wireshark) | Network traffic capture and analysis using Wireshark |
| [CyberSecurity-Task9-SQLInjection_(Advanced)](./CyberSecurity-Task9-SQLInjection_(Advanced)) | Advanced SQL injection exploitation and defense |
| [CyberSecurity-Task10-Full_Network_Security_Assessment](./CyberSecurity-Task10-%20Full_Network_Security_Assessment) | End-to-end network security assessment: Nmap recon, Wireshark traffic analysis, Nikto web scan, findings register, executive summary, and remediation roadmap |

## Methodology

Tasks follow industry-standard references where applicable:
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PTES Technical Guidelines](http://www.pentest-standard.org/)
- [CVSS v3.1 scoring](https://www.first.org/cvss/) for severity ratings

## Environment

- **Attacker/testing box:** Kali Linux (VMware)
- **Target(s):** Intentionally vulnerable training VMs (e.g. Metasploitable2) and local lab setups
- **Network:** Isolated VMware NAT lab subnets — no production or third-party systems involved

## Disclaimer

All testing across every task in this repository was performed against
private, self-owned lab environments and intentionally vulnerable training
VMs. Nothing here was run against production or third-party systems. This
repository is for educational purposes as part of an internship program.
