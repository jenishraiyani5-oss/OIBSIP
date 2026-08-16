# Task 8 · Capture Network Traffic with Wireshark

## Objective
Capture live network traffic using Wireshark, apply filters to isolate specific protocols, analyze packet contents, and document findings with security observations.

---

## ⚠️ Ethics Note
This capture was performed **only on my own local machine/VM network interface**, on a network I own and administer. Traffic was never captured on public Wi-Fi, university networks, employer networks, or any network without explicit authorization. Capturing network traffic you do not have permission to observe is illegal in many jurisdictions and a serious breach of privacy/trust.

---

## What Is Wireshark?

**Wireshark** is a free, open-source network protocol analyzer. It captures packets traveling across a network interface in real time and lets you inspect their contents in detail — down to individual protocol fields and raw bytes — making it one of the most widely used tools for network troubleshooting, protocol analysis, and security investigation.

---

## Installation

Wireshark is often available in Kali Linux by default. Verify with:
```bash
wireshark --version
```

If not installed:
```bash
sudo apt update
sudo apt install wireshark -y
```

During installation, you will be prompted: *"Should non-superusers be able to capture packets?"* — select **Yes**. This uses a `dumpcap` permission mechanism so Wireshark doesn't need to run fully as root every time.

Then add your user to the `wireshark` group so it can access network interfaces without `sudo`:
```bash
sudo usermod -aG wireshark $USER
```
Log out and back in (or reboot) for the group change to take effect.

### Permissions Required
Capturing raw packets from a network interface requires elevated privileges, because it involves reading traffic below the normal application layer:
- **Linux:** Either run Wireshark with `sudo`, or (preferred) add your user to the `wireshark` group as shown above, which grants the capture permission (`CAP_NET_RAW`/`CAP_NET_ADMIN`) to the `dumpcap` helper process without needing full root access to the GUI.
- **Windows:** Wireshark must be run as Administrator, since packet capture relies on the Npcap driver, which requires administrative rights to access network interfaces directly.

Screenshot: `Wireshark_install.png`

---

## Capture Process

1. Opened Wireshark and selected the active network interface (e.g., `eth0`).
2. Started capturing (blue shark-fin "Start" button).
3. Generated a mix of traffic for at least 2 minutes: browsed an HTTP (non-HTTPS) test site, performed DNS lookups, and let normal background traffic occur.
4. Stopped the capture after 2+ minutes (red square "Stop" button).
5. Saved/exported the capture as [`wireshark_capture.pcap`](./wireshark_capture.pcap).

---

## Filtered Analysis

### 1. HTTP Traffic
**Filter used:** `http`

This isolates plaintext HyperText Transfer Protocol traffic — web requests and responses that are **not** encrypted.

Screenshot: `http_filter.png`

### 2. DNS Traffic
**Filter used:** `dns`

This isolates Domain Name System queries and responses — the traffic that translates domain names (e.g., `example.com`) into IP addresses.

Screenshot: `DNS_filter.png`

### 3. TCP Traffic and the Three-Way Handshake
**Filter used:** `tcp`

Every TCP connection begins with a three-step handshake before any actual data is exchanged:

| Step | Packet | What It Means |
|---|---|---|
| 1 | **SYN** | The client sends a packet with the SYN (synchronize) flag set, proposing to open a connection and proposing an initial sequence number. |
| 2 | **SYN-ACK** | The server responds with both the SYN and ACK (acknowledge) flags set, acknowledging the client's request and proposing its own initial sequence number. |
| 3 | **ACK** | The client sends a final ACK, acknowledging the server's response. The connection is now established and data can flow. |

In the capture, this sequence was identified by filtering for `tcp` and locating three consecutive packets between the same client/server pair (client `192.168.179.153` connecting to server `151.101.209.91` on port 80), shown in Wireshark's **Info** column as `[SYN]`, `[SYN, ACK]`, and `[ACK]` respectively:

| Packet # | Time | Source → Destination | Flags | Details |
|---|---|---|---|---|
| **216** | 23.313375612 | 192.168.179.153 → 151.101.209.91 | `[SYN]` | Client initiates the connection to port 80. Seq=0, Win=64240, MSS=1460, SACK_PERM |
| **217** | 23.338571773 | 151.101.209.91 → 192.168.179.153 | `[SYN, ACK]` | Server acknowledges the request and proposes its own sequence number. Seq=0, Ack=1, Win=64240 |
| **218** | 23.338697877 | 192.168.179.153 → 151.101.209.91 | `[ACK]` | Client confirms the server's response — the connection is now fully established. Seq=1, Ack=1 |

Immediately after this handshake (packet #219 onward in the same capture), the client sent an actual `HTTP GET /success.txt?ipv4` request over this now-established TCP connection — demonstrating that no application data flows until all three handshake steps complete.

Screenshot (annotated): `TCP_handshake.png`

---

## Unencrypted Data Example

**Filter used:** `http.request.method == "GET"`

**Packet #219** in the capture was an HTTP GET request sent in plaintext, from client `192.168.179.153` (source port 46560) to server `151.101.209.91` (port 80). Inspecting the packet bytes directly (hex/ASCII view) showed the entire request in readable plaintext, with no encryption at all:

```
GET /success.txt?ipv4 HTTP/1.1
Host: detectportal.firefox.com
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: keep-alive
Priority: u=4
Cache-Control: no-cache
```

The corresponding response, **packet #221**, came back as `HTTP/1.1 200 OK (text/plain)`.

**Information fully visible to anyone observing this traffic:**
- The exact resource requested: `/success.txt?ipv4`
- The `Host` header, revealing the exact destination domain (`detectportal.firefox.com`)
- The complete `User-Agent` string, revealing the client's browser (Firefox 140.0), rendering engine (Gecko), operating system (Linux x86_64), and even the specific build/release date
- Additional request metadata (`Accept-Language`, `Accept-Encoding`, connection behavior)
- The full server response body (plaintext content)

None of this required decrypting anything — it was visible directly in Wireshark's hex/ASCII packet bytes view, exactly as it traveled across the network. This demonstrates precisely why unencrypted HTTP exposes far more than most users realize, even for a request as simple as a browser's background connectivity check.

Screenshot: `Unencrypted_http.png`

---

## Why Unencrypted HTTP Traffic Is Dangerous

When a website is served over plain **HTTP** instead of **HTTPS**, all data between the browser and server travels as plaintext. Anyone with access to the network path — whether on the same Wi-Fi network, a compromised router, or an ISP — can read every request and response using a tool like Wireshark, exactly as demonstrated above. This means:
- **Credentials and form data** submitted over HTTP (usernames, passwords, personal details) can be captured directly.
- **Session cookies** can be intercepted and reused to hijack a logged-in session.
- **Browsing activity** — every page visited and its content — is fully visible to an eavesdropper.
- Data can potentially be **modified in transit** (a man-in-the-middle attack) since there is no integrity protection on plain HTTP.

## How HTTPS Prevents This

**HTTPS** wraps HTTP traffic inside **TLS (Transport Layer Security)** encryption. Before any HTTP data is exchanged, the client and server perform a TLS handshake to agree on encryption keys. Once established:
- All traffic (URLs, headers, cookies, body content) is encrypted, so an eavesdropper capturing the same packets only sees scrambled ciphertext, not the actual content.
- TLS also verifies the server's identity via a certificate, protecting against impersonation.
- TLS provides integrity checking, so tampering with data in transit can be detected.

This is why, if this same capture were repeated against an HTTPS site, the `http` filter would show no plaintext results — instead, a `tls` filter would show only encrypted "Application Data" packets, with none of the URL, header, or body content visible.

---

## Glossary

- **Packet** — A single, self-contained unit of data sent across a network. Think of it as an envelope: it has an "address" (where it's from and where it's going) and contents (the actual data being carried), and a message is usually broken into many packets to be sent and reassembled at the destination.
- **Protocol** — An agreed-upon set of rules that determines how devices communicate with each other — what format messages take, what order things happen in, and how each side should respond. HTTP, DNS, and TCP are all examples of protocols.
- **Port** — A numbered "channel" on a device that identifies which specific service or application a piece of network traffic is meant for. A single machine can run many services at once (web server, email server, etc.), and the port number tells incoming traffic which one to go to (e.g., port 80 for HTTP, port 443 for HTTPS).
- **Payload** — The actual content/data being carried inside a packet, as opposed to the header information (addresses, protocol flags, etc.) that surrounds it. In an HTTP request, the payload might be the webpage data or form data being sent.
- **Handshake** — An initial exchange of messages between two devices to set up a connection before real data is sent — confirming both sides are ready, agreeing on parameters, and (in TCP's case) synchronizing sequence numbers. The TCP three-way handshake (SYN, SYN-ACK, ACK) is a classic example.

---

## Repository Structure

```
├── README.md
├── wireshark_capture.pcap
├── Wireshark_install.png
├── HTTP_filter.png
├── DNS_filter.png
├── TCP_handshake.png
└── Unencrypted_http.png
```

---
