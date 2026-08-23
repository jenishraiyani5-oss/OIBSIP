# Social Engineering Attacks: A Research Report

## Introduction

Social engineering is the art of manipulating people — rather than exploiting software or hardware flaws — into taking an action or divulging confidential information that compromises security. Instead of breaking through a firewall, an attacker exploits trust, urgency, authority, curiosity, or fear to convince a human "insider" to open the door for them. Social engineering is considered one of the most effective attack vectors precisely because it targets the one part of a network that cannot be patched: human judgment. Industry data backs this up starkly. Verizon's 2024 Data Breach Investigations Report found that **68% of breaches involved a non-malicious human element**, and its 2025 edition reported that **85% of the 4,009 social engineering incidents analyzed resulted in confirmed data disclosure**, with phishing implicated in 57% of those cases and pretexting continuing to be a leading driver of incidents. IBM separately estimates the average cost of a breach caused by social engineering at roughly **$4.77 million**, while the FBI's Internet Crime Complaint Center recorded over 21,000 Business Email Compromise complaints in 2024 alone, totaling **$2.77 billion** in losses. Because these attacks bypass technical controls by going straight for the person operating the keyboard, no amount of firewalls, encryption, or patching alone can fully eliminate the risk — making awareness, process, and a security-conscious culture just as critical as any technical defense.

---

## 1. Phishing

### How It Works
Phishing is the practice of impersonating a trusted person, brand, or system — typically via email, text message, or phone — to trick a victim into revealing credentials, transferring money, or installing malware. Attackers rely on urgency ("your account will be suspended"), authority ("this is an official request from IT"), or curiosity ("see who viewed your profile") to short-circuit careful thinking, and they often pair a convincing pretext with a malicious link or attachment.

**Types of Phishing:**
- **Spear phishing** — a highly targeted attack aimed at a specific individual or small group, using personal or organizational details (job title, colleagues' names, ongoing projects) gathered through reconnaissance to make the message far more convincing than a generic blast.
- **Whaling** — a form of spear phishing that specifically targets senior executives or other high-value individuals ("big fish"), often impersonating a CEO or board member to authorize a fraudulent wire transfer or request sensitive data.
- **Vishing (voice phishing)** — phishing conducted over a phone call, where the attacker impersonates IT support, a bank representative, or another trusted party to extract credentials or one-time passcodes directly from the victim's voice responses.
- **Smishing (SMS phishing)** — phishing delivered via text message, commonly impersonating delivery services, banks, or two-factor-authentication prompts, and relying on a malicious link that is harder to inspect on a small mobile screen.

### Real-World Case Study: The 2011 RSA SecurID Breach
In March 2011, attackers sent two small batches of spear-phishing emails, titled "2011 Recruitment Plan," to two small groups of RSA (EMC's security division) employees. At least one employee retrieved the message from a junk-mail folder and opened the attached Excel spreadsheet, which exploited a then-unknown ("zero-day") Adobe Flash vulnerability to silently install a variant of the Poison Ivy remote-access backdoor. From that initial foothold, the attackers escalated privileges, moved laterally through RSA's network, and exfiltrated sensitive information related to the seed values behind RSA's SecurID two-factor authentication tokens — a product used by tens of millions of people worldwide. The stolen information was later linked to a follow-on intrusion attempt at defense contractor L-3 Communications using cloned SecurID tokens. RSA reportedly spent tens of millions of dollars on remediation, including reissuing tokens for many of its customers.

### Prevention Recommendations
1. **Deploy email authentication and filtering (SPF, DKIM, DMARC, and advanced anti-phishing gateways)** to block or flag spoofed sender domains and known malicious attachments before they reach an inbox.
2. **Enforce phishing-resistant multi-factor authentication (e.g., hardware security keys/FIDO2)** rather than relying solely on SMS codes or push notifications, which can be bypassed through prompt-bombing or real-time relay attacks.
3. **Run regular, realistic phishing simulations and targeted security-awareness training**, especially for high-value roles (finance, executives, IT help desk) who are prime targets for spear phishing and whaling.
4. **Establish out-of-band verification procedures for sensitive requests** — for example, requiring a phone callback to a known number (not one provided in the suspicious message) before acting on wire-transfer requests, credential resets, or unusual attachments.

---

## 2. Pretexting

### Definition and How Attackers Build a False Scenario
Pretexting is a social engineering technique in which an attacker fabricates a believable scenario, or "pretext," to establish false trust with a victim and manipulate them into divulging information or performing an action. Unlike phishing, which often relies on a single deceptive message, pretexting is typically an interactive, conversational con: the attacker researches the target organization (employee names, org charts, internal terminology, recent events like a system migration) and then assumes a plausible persona — an IT help-desk technician, a new employee, an auditor, or a vendor — to build rapport and create a reason for the victim to comply. The false scenario reduces the victim's suspicion because the request appears to fit a normal, expected business process.

### Real-World Case Study: The July 2020 Twitter Hack
On July 15, 2020, attackers compromised 130 high-profile Twitter accounts (including those of major public figures and companies) to run a Bitcoin scam. According to Twitter's own investigation and the New York State Department of Financial Services report, the intrusion began the day before with a **phone-based pretexting/vishing campaign**: attackers called several Twitter employees claiming to be from the company's IT Help Desk, telling them they were responding to a VPN problem — a very plausible pretext, since Twitter had recently shifted to remote work and VPN issues were common. The callers then directed employees to a fake VPN login page that closely mimicked Twitter's real one, capturing their credentials. Employees who initially had no access to internal account-support tools were used to gather information that helped the attackers craft even more convincing follow-on pretexts targeting employees who did have that access. The stolen credentials ultimately let the attackers reach an internal administrative tool capable of resetting the email address on any Twitter account, which they used to seize and tweet from the compromised accounts.

### Prevention Measures
1. **Establish and train employees on strict identity-verification procedures for IT/help-desk interactions**, such as requiring employees to call back a verified internal number rather than trusting an inbound caller, especially before resetting credentials or MFA.
2. **Apply the principle of least privilege and tiered access controls** so that a single compromised employee's credentials cannot alone reach highly sensitive internal tools; require additional approval steps for account-support or administrative actions.
3. **Conduct pretexting/vishing red-team exercises and reinforce a "verify, then trust" culture**, so employees are conditioned to expect and resist urgency-driven requests, even ones that reference real internal systems or recent company events.

---

## 3. Baiting

### Physical and Digital Baiting
Baiting lures a victim with the promise of something desirable — free content, a "lost" storage device, or a bargain download — in order to deliver malware or capture credentials once the victim takes the bait.
- **Physical baiting** typically involves leaving an infected USB drive, external hard drive, or similar device in a location where a target is likely to find it (a parking lot, a lobby, a delivery box). Curiosity or a desire to identify the owner leads the victim to plug the device into a work computer, at which point malware executes automatically or via a disguised file.
- **Digital baiting** offers something enticing online — free movies, pirated software, "too good to be true" giveaways, or fake software updates — with the download itself being a trojanized installer or the landing page harvesting credentials.

### Real-World Case Study: Stuxnet and the Natanz Nuclear Facility (2010)
One of the most consequential baiting-style attacks in history was the delivery of the **Stuxnet** worm into Iran's Natanz uranium-enrichment facility. Because Natanz's industrial control systems were "air-gapped" (deliberately disconnected from the internet) for security, the attackers could not deliver the malware over a network. Instead, evidence indicates infected USB flash drives were introduced through the facility's supply chain and contractor networks — and, according to some reporting, planted for an unsuspecting insider or contractor to find and use. When a drive was plugged into a Windows workstation, Stuxnet installed itself automatically by exploiting a vulnerability in how Windows displayed shortcut icons, requiring no further action from the victim. From there it spread across the internal network, searched for the specific Siemens industrial controllers used to manage uranium-enrichment centrifuges, and subtly altered their spin rates while reporting normal readings to operators — ultimately destroying an estimated 1,000 centrifuges, roughly 10% of Natanz's operating stock, and setting Iran's enrichment program back by months.

### Prevention Measures
1. **Disable AutoRun/AutoPlay for removable media and enforce USB device control policies** (e.g., allow-listing approved devices, using dedicated USB scanning/decontamination stations) so unknown drives cannot execute code automatically.
2. **Provide a safe, official channel for reporting found devices** and train employees never to plug an unknown USB drive, CD, or other found media into a work computer — treating it the same as an unsolicited email attachment.
3. **Restrict downloads to vetted sources and use application allow-listing/endpoint detection**, blocking execution of unauthorized or unsigned software so that a digitally baited download (e.g., "free" pirated software) cannot silently install malware even if a user runs it.

---

## 4. Quid Pro Quo (Bonus)

### Explanation
Quid pro quo ("something for something") attacks involve an attacker offering a service or benefit in exchange for information or access. A classic example is an attacker calling multiple employees at random posing as IT support offering to "fix" a technical issue; eventually, an employee who genuinely has a problem accepts the offer and, in the process of receiving "help," is talked into disabling security software, revealing a password, or installing remote-access tools. Unlike baiting, which dangles something desirable and waits, quid pro quo actively initiates an exchange, framing the attacker as the one providing value — which lowers the victim's guard because they believe they are the one benefiting.

### Prevention
- **Verify the identity of anyone offering unsolicited technical help** through official channels before granting remote access, sharing credentials, or disabling security controls, and ensure employees know that legitimate IT support will never ask for a password.
- **Centralize and publicize official support channels** (a single known help-desk number/portal) so employees can recognize and report impersonation attempts, and log/monitor remote-access tool usage for anomalies.

---

## Comparison Table

| Attack Type | Primary Target | Psychological Lever Exploited | Best Countermeasure |
|---|---|---|---|
| **Phishing** (incl. spear phishing, whaling, vishing, smishing) | Employees at any level; executives (whaling); finance/HR staff (spear phishing) | Urgency, authority, fear of consequences, curiosity | Phishing-resistant MFA + email authentication (SPF/DKIM/DMARC) + regular simulated-phishing training |
| **Pretexting** | IT help-desk staff, finance/admin staff, employees with system access | Trust in a fabricated but plausible scenario/authority figure | Strict callback/identity-verification procedures before acting on sensitive requests |
| **Baiting** | Curious individuals; anyone with physical or download access to endpoints | Curiosity, desire for free/valuable items | Disable AutoRun, control removable media, and restrict/allow-list software downloads |
| **Quid Pro Quo** | Employees experiencing (or told they have) a technical problem | Reciprocity — belief that they are receiving a favor or fix | Verify identity of unsolicited "helpers" through official channels before granting access |

---


