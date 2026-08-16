# Common Network Security Threats: A Research Report

## Introduction

Modern organizations run almost every part of their business — banking, healthcare, communications, critical infrastructure, and even democratic processes — over interconnected networks, which makes those networks a primary target for attackers. As more devices, cloud services, and remote workers join corporate networks, the "attack surface" that a malicious actor can probe keeps expanding, while the underlying protocols that hold the internet together (TCP/IP, DNS, ARP) were largely designed decades ago with functionality, not security, as the priority. A single successful network attack can knock a global platform offline, expose the personal data of hundreds of millions of people, or drain millions of dollars from unsuspecting victims in minutes. Understanding how these threats work — not just that they exist — is essential for network administrators, developers, and security teams who are responsible for keeping systems available, trustworthy, and safe. This report examines four of the most common and consequential network security threats: Denial-of-Service (DoS/DDoS) attacks, Man-in-the-Middle (MITM) attacks, IP Spoofing, and DNS Poisoning/Spoofing — explaining how each works, citing a real-world incident, describing its impact, and outlining concrete mitigation strategies.

---

## 1. Denial-of-Service (DoS) and Distributed Denial-of-Service (DDoS) Attacks

### How It Works
A Denial-of-Service attack aims to make a system, service, or network unavailable to legitimate users by overwhelming it with traffic or exploiting a resource-exhaustion flaw. A **Distributed** Denial-of-Service (DDoS) attack does this using many source machines at once — often a botnet of compromised devices — making the flood of traffic harder to block by simply banning one IP address. A common and highly efficient variant is **amplification/reflection**: an attacker sends a small request to a third-party server (such as a memcached, DNS, or NTP server) with the *source IP address spoofed* to match the victim's address. The server then sends a much larger response to the victim, "amplifying" a small amount of attacker traffic into an overwhelming flood. Because memcached servers are not designed to authenticate requests and can be reached over UDP, they can amplify traffic by tens of thousands of times.

### Real-World Example: The 2018 GitHub DDoS Attack
On February 28, 2018, GitHub was hit by what was, at the time, the largest DDoS attack ever recorded. Attackers abused thousands of misconfigured, publicly accessible memcached servers, sending them small spoofed UDP requests that appeared to originate from GitHub's IP address. The servers responded with replies amplified by as much as 50,000 times the original request size. Traffic aimed at GitHub peaked at **1.35 terabits per second and 126.9 million packets per second**, coming from over a thousand different autonomous systems. GitHub's monitoring systems detected an unusual spike in the ratio of incoming to outgoing traffic within minutes, and the company rerouted traffic through Akamai's Prolexic DDoS-scrubbing service. The site was intermittently unavailable for roughly 8–10 minutes before the attack was fully mitigated.

### Impact
- **Service disruption**: GitHub was unreachable for several minutes, disrupting code pushes, CI/CD pipelines, and other automated developer workflows worldwide.
- **Cascading effects**: Because so many software teams depend on GitHub's uptime, even a short outage rippled into delayed builds and deployments across the industry.
- **Broader precedent**: The attack demonstrated that memcached reflection could produce amplification factors far larger than earlier Mirai-botnet-driven attacks (roughly 620 Gbps in 2016), spurring a wave of copycat attacks and prompting urgent industry-wide efforts to secure exposed memcached servers.

### Mitigation Strategies
1. **Deploy DDoS scrubbing / traffic-filtering services** (e.g., cloud-based scrubbing centers such as Akamai Prolexic, Cloudflare, or AWS Shield) that can absorb and filter volumetric traffic before it reaches the origin network.
2. **Disable or firewall unnecessary UDP services** (e.g., block or rate-limit memcached's UDP port 11211, and disable UDP support entirely if it is not required) to prevent servers on your network from being abused as reflectors/amplifiers.
3. **Implement rate limiting, traffic-anomaly monitoring, and ingress/egress filtering (BCP 38)** so spoofed-source traffic can be detected and dropped early, and so unusual spikes in traffic ratios trigger automated alerts and mitigation.

---

## 2. Man-in-the-Middle (MITM) Attacks

### How It Works
In a Man-in-the-Middle attack, an adversary secretly positions themselves between two communicating parties — such as a user and a website — and intercepts, and potentially alters, the traffic passing between them while both sides believe they are communicating directly with each other. Common techniques include ARP spoofing on a local network, rogue Wi-Fi access points, DNS-based redirection, and SSL/TLS interception, where the attacker presents a forged certificate to the victim so that "secure" HTTPS traffic can still be read in plaintext by the attacker before being re-encrypted and forwarded to the real destination.

### Real-World Example: Lenovo Superfish (2015)
In 2015, security researchers discovered that Lenovo had shipped consumer laptops with pre-installed adware called **Superfish "Visual Discovery."** To inject advertisements into users' encrypted browsing sessions, Superfish installed its own self-signed root Certificate Authority into each machine's trusted certificate store and used a single, easily extractable private key to generate forged certificates for any HTTPS website a user visited. This effectively broke the trust model of TLS/SSL on every affected laptop: any attacker who obtained the shared private key (which researchers quickly did) could impersonate any secure website — banks, webmail, shopping sites — to intercept and manipulate a victim's "secure" traffic without triggering a browser warning.

### Impact
- **Broken trust in HTTPS**: Because Superfish's certificate was trusted by the operating system, victims had no visual indication that their encrypted sessions were being intercepted.
- **Widespread exposure**: The flaw affected a large number of consumer Lenovo laptops sold globally, and once the shared private key was published, any attacker on the same network as a victim (e.g., public Wi-Fi) could exploit it.
- **Financial and reputational fallout**: Lenovo faced lawsuits and regulatory scrutiny, and ultimately paid a multimillion-dollar settlement, while the incident became a widely cited case study in the risks of pre-installed software tampering with system trust stores.

### Mitigation Strategies
1. **Enforce strong TLS/HTTPS everywhere and use HSTS (HTTP Strict Transport Security)** so browsers refuse to downgrade connections to plaintext HTTP, closing off a common MITM entry point.
2. **Use certificate pinning and monitor certificate transparency logs** for sensitive applications, so an unexpected or forged certificate authority is detected rather than silently trusted.
3. **Avoid untrusted networks and use a VPN or encrypted tunnel on public Wi-Fi**, and at the organizational level, audit pre-installed software/root certificates on endpoints and use network access control plus ARP-spoofing detection tools to catch local interception attempts.

---

## 3. IP Spoofing

### How It Works
IP spoofing is the practice of forging the source IP address field in a packet's header so that it appears to originate from a different, often trusted, machine. Because classic IP routing forwards packets based only on the destination address and does not verify the source, an attacker can craft packets that claim virtually any origin. This technique underlies many other attacks: it conceals the true source of DDoS traffic, allows attackers to bypass IP-based access controls or trust relationships between machines, and — when combined with the ability to predict a target's TCP sequence numbers — can allow an attacker to impersonate a trusted host well enough to complete a TCP handshake and hijack a session, even without ever seeing the return traffic (a "blind" spoofing attack).

### Real-World Example: The 1994 Mitnick–Shimomura "Christmas Day" Attack
One of the most famous IP spoofing incidents occurred on Christmas Day, 1994, when hacker Kevin Mitnick attacked the home computer of security researcher Tsutomu Shimomura. Mitnick first used a SYN-flood to disable a trusted server so it could not respond and interfere with the attack. He then sent a series of SYN packets to Shimomura's X-terminal to observe the predictable pattern in which its TCP initial sequence numbers were generated. Having predicted the next sequence number, Mitnick sent a spoofed SYN packet claiming to originate from the disabled trusted server, and — without ever receiving the SYN-ACK reply himself, since it was sent to the spoofed address — correctly guessed the acknowledgment number needed to complete the handshake. This let him establish a trusted, one-way connection to the X-terminal and plant a backdoor, all while impersonating a machine he did not control.

### Impact
- **Bypassed authentication based on trust relationships**: The attack showed that IP-address-based trust between machines (common in early Unix environments) could be completely subverted without needing any credentials.
- **Unauthorized system access**: Mitnick gained root-level backdoor access to Shimomura's system by impersonating a trusted host.
- **Lasting influence on protocol design**: The incident is widely credited with accelerating the adoption of randomized, unpredictable TCP initial sequence numbers and stronger host-authentication mechanisms across operating systems, and it remains a foundational case study in network security education.

### Mitigation Strategies
1. **Use unpredictable, randomized TCP initial sequence numbers** (a standard feature in modern operating systems) so an attacker cannot guess the sequence number needed to complete a spoofed handshake.
2. **Deploy ingress/egress packet filtering at network borders (BCP 38 / anti-spoofing filtering)** so routers drop packets whose source address could not legitimately originate from the network segment they arrived on.
3. **Avoid IP-address-based trust relationships for authentication**; instead, use cryptographic authentication (e.g., SSH keys, mutual TLS, IPsec) between hosts, and deploy reverse-path forwarding (uRPF) checks and network segmentation to limit the blast radius of a spoofed-packet intrusion.

---

## 4. DNS Poisoning / DNS Spoofing (Bonus Threat)

### How It Works
DNS translates human-readable domain names into IP addresses. In a DNS poisoning (cache poisoning) or spoofing attack, an adversary injects a forged DNS response into a resolver's cache or otherwise tricks a DNS system into associating a legitimate domain name with an attacker-controlled IP address. Once a resolver's cache is poisoned, every user who queries that domain is transparently redirected to the attacker's server — typically a convincing phishing clone of the real site — until the cache entry expires. A related and increasingly common technique is **BGP hijacking of DNS infrastructure**: rather than poisoning a cache directly, an attacker manipulates internet routing (BGP) so that traffic destined for a legitimate authoritative DNS server is instead routed to a server the attacker controls, letting them respond to DNS queries with forged answers.

### Real-World Example: The 2018 MyEtherWallet DNS Hijack
In April 2018, attackers executed a BGP hijack against Amazon's Route 53 DNS service, rerouting the network path for the authoritative nameservers of **MyEtherWallet.com**, a popular cryptocurrency wallet platform. For approximately two hours, users who queried the DNS for MyEtherWallet.com received responses pointing to a phishing server rather than the real site. Victims who ignored an HTTPS certificate warning and entered their wallet credentials on the fake site had their private keys captured and their funds — reported at roughly $150,000–$160,000 in Ether — transferred to attacker-controlled wallets. Crucially, MyEtherWallet's actual DNS records were never altered; the route to the DNS infrastructure itself had been hijacked.

### Impact
- **Direct financial theft**: Victims who authenticated on the spoofed site had cryptocurrency stolen in a matter of hours, with no way to reverse the transactions.
- **Erosion of trust in HTTPS indicators**: Because the phishing site could not present a valid certificate for the real domain, the incident highlighted how easily many users click past browser security warnings.
- **Demonstrated a broader systemic weakness**: The attack showed that DNS and routing infrastructure security depends not just on the target organization's own systems but on the security of upstream internet routing (BGP), which is largely based on mutual trust between network operators.

### Mitigation Strategies
1. **Deploy DNSSEC (DNS Security Extensions)**, which cryptographically signs DNS records so resolvers can verify that a response has not been forged or tampered with in transit.
2. **Use encrypted DNS transport (DNS-over-HTTPS/DNS-over-TLS)** and keep DNS resolver software patched, and lower record TTLs to reduce the window of impact if a cache is ever poisoned.
3. **Adopt RPKI (Resource Public Key Infrastructure) and BGP route-origin validation**, monitor for unexpected route announcements affecting your IP prefixes, and enforce browser/application checks such as HSTS and certificate pinning so users are blocked (not just warned) when a connection presents an invalid certificate for a sensitive domain.

---

## Comparison Table

| Threat | Attack Vector | Who Is at Risk | Difficulty to Execute | Ease of Mitigation |
|---|---|---|---|---|
| **DoS/DDoS** | Flooding a target with traffic, often via reflection/amplification (e.g., spoofed UDP requests to open memcached/DNS/NTP servers) | Any internet-facing service — websites, APIs, DNS providers, gaming platforms | Low–Medium (amplification tools and botnets-for-hire are widely available) | Moderate (requires scrubbing services/CDNs and rate limiting; hard to fully prevent, easier to absorb) |
| **Man-in-the-Middle (MITM)** | Interception of traffic via ARP spoofing, rogue Wi-Fi, forged/rogue TLS certificates, or compromised software | Users on shared/public networks, mobile app users, any HTTPS session without strong validation | Medium (requires network position or a trusted foothold, e.g., pre-installed software) | Moderate–High (HTTPS, HSTS, and certificate pinning are broadly effective when consistently enforced) |
| **IP Spoofing** | Forging the source IP address in packet headers to impersonate a trusted host or hide attack origin | Systems relying on IP-based trust/authentication; any target of reflection-based DDoS | Medium (modern randomized TCP sequence numbers make session hijacking much harder than in 1994) | High (ingress/egress filtering (BCP 38) and abandoning IP-based trust largely neutralize it) |
| **DNS Poisoning/Spoofing** | Injecting forged DNS responses into a resolver cache, or hijacking routes (BGP) to DNS infrastructure | Anyone resolving a poisoned domain; high-value targets like financial and cryptocurrency platforms | Medium–High (cache poisoning requires precise timing; BGP hijacking requires network-operator-level access) | Moderate (DNSSEC and RPKI are effective but require broad, coordinated adoption across the internet) |

---

## Conclusion: Key Takeaways for a Network Administrator

1. **Don't trust the protocols by default.** TCP/IP, DNS, and BGP were built for connectivity, not authentication — use safeguards like BCP 38, DNSSEC, and RPKI, and never rely on IP address alone for security.
2. **Layer your defenses.** No single control stops every threat — combine DDoS scrubbing, TLS/HSTS, certificate pinning, DNSSEC, and traffic monitoring for real protection.
3. **Detection and response matter as much as prevention.** GitHub, Equifax, and MyEtherWallet show even strong organizations get hit — fast detection and a solid incident response plan limit the damage.
---
