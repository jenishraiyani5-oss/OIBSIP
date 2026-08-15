# Task 1 · Basic Network Scanning with Nmap

## Objective
Perform a network scan to identify open ports and running services on a local virtual machine using Nmap, and document the findings with a security analysis.

---

## What is Nmap?

**Nmap** (Network Mapper) is a free, open-source tool used to discover hosts and services on a computer network. It works by sending specially crafted packets to a target machine and analyzing the responses. Nmap can:
- Discover live hosts on a network
- Identify open, closed, and filtered ports
- Detect which services (and their versions) are running on those ports
- Attempt to fingerprint the target's operating system

It is one of the most widely used tools in network security, penetration testing, and system administration.

## Why Network Scanning Matters

Network scanning is a foundational step in cybersecurity for several reasons:
- **Asset discovery** — you cannot secure what you don't know exists on your network.
- **Attack surface visibility** — every open port and running service is a potential entry point for an attacker; scanning reveals what is actually exposed.
- **Vulnerability assessment** — identifying outdated or misconfigured services allows administrators to fix issues before attackers find them.
- **Compliance and auditing** — many security standards require regular network inventory and vulnerability scanning.
- **Baseline monitoring** — comparing scans over time helps detect unauthorized changes, such as a new, unexpected open port.

Attackers use the exact same scanning techniques during reconnaissance, which is why understanding Nmap is essential from a defensive perspective — it lets you see your network the way an attacker would.

## ⚠️ Ethical Use Guidelines

- **Only scan systems you own or have explicit written permission to scan.** Scanning devices, networks, or servers without authorization is illegal in many jurisdictions (e.g., under the U.S. Computer Fraud and Abuse Act) and can result in criminal charges, even if no damage is caused.
- **This task was performed entirely on a local, isolated virtual machine** (Metasploitable2) set up specifically for this exercise — no external, production, or third-party systems were scanned.
- Never use scanning skills against public websites, company infrastructure you don't administer, or any system without a clear, documented authorization.
- Treat scan results (open ports, service versions, OS details) as sensitive information — this data could help an attacker plan an intrusion.

---

## Installation

This project uses Nmap installed on a Kali Linux virtual machine (VirtualBox), where Nmap comes pre-installed by default.

### Steps followed:

1. Downloaded and installed VirtualBox from virtualbox.org
2. Downloaded the Kali Linux VirtualBox image from kali.org/get-kali and imported it into VirtualBox
3. Booted the Kali Linux VM
4. Verified that Nmap was already installed by running:

   ```
   nmap --version
   ```

   Output:

   ```
   Nmap version 7.99 ( https://nmap.org )
   ```

5. If Nmap is not pre-installed (e.g., on a plain Ubuntu VM), it can be installed with:

   ```
   sudo apt update
   sudo apt install nmap -y
   ```

See `screenshots/01_nmap_install.png` for the installation/verification output.

---

## Lab Environment

| Component | Details |
|---|---|
| Attacker/Scanner machine | Kali Linux (VirtualBox VM), Nmap 7.99 |
| Target machine | Metasploitable2 (intentionally vulnerable Linux VM) |
| Network mode | VirtualBox Host-only / NAT Network (isolated, local only) |
| Target IP | 192.168.179.155 |

---

## Scans Performed

| Scan Type | Command | Purpose |
|---|---|---|
| Service version + OS detection scan | `nmap -sV -O 192.168.179.155 -oN nmap_scan_results.txt` | Identify open ports, service versions, and attempt OS fingerprinting in a single scan |

**Result summary:** 23 open TCP ports were found. Detected OS: Linux 2.6.9 - 2.6.33 (general purpose device, VMware virtual NIC).

Full results, the open ports summary table, and a detailed port-by-port security analysis are documented in [`nmap_scan_results.txt`](./nmap_scan_results.txt).

Screenshots of the scan's terminal output are in the [`screenshots/`](./screenshots) folder.

---

## Repository Structure

```
├── README.md
├── nmap_scan_results.txt
└── screenshots/
    ├── 01_nmap_install.png
    └── 02_full_scan_output.png
```

---

## Key Takeaways

- The scanned target (Metasploitable2) exposed 23 open ports running severely outdated services, several with publicly known critical vulnerabilities (e.g., vsftpd 2.3.4 backdoor, UnrealIRCd backdoor, Samba RCE, and a pre-planted root bindshell on port 1524).
- Service version detection is critical: knowing that a service is running is not enough — the version reveals whether it has known, exploitable vulnerabilities.
- Not every open port is inherently dangerous, but every open port should be intentional. Unused or unnecessary services should be disabled to reduce the attack surface.
- Legacy, unencrypted protocols (Telnet, rexec, rlogin, rsh) should never be used on modern systems — they transmit credentials in plaintext.
