# SQL Injection Assessment — Executive Summary

## Task 9 : SQL Injection on DVWA (Medium Security)

**Environment:** Internal lab test (DVWA training application)

---

## What We Found

During a routine security test, we identified a **SQL Injection** vulnerability
in a sample web application's login/search feature. This is one of the most
common and most serious types of web application weaknesses, and it appears
on nearly every industry list of top security risks (including OWASP's
Top 10, the industry-standard reference for web application security).

In simple terms: the application takes user input (such as an ID typed into
a search box) and passes it directly to the database without properly
checking or isolating it. This means a malicious user could insert their own
database commands instead of a normal search value — effectively tricking
the database into handing over information it shouldn't.

## Risk Level: Medium 

## Business Impact

If this type of flaw existed in a production system, the potential
consequences include:

- **Data breach** — an attacker could read sensitive data directly from the
  database, including customer records, account credentials, or financial
  information.
- **Account compromise** — stored passwords could be extracted, potentially
  allowing an attacker to log in as any user, including administrators.
- **Regulatory and compliance exposure** — a breach involving personal or
  financial data can trigger legal obligations (breach notification laws,
  fines) depending on jurisdiction and industry (e.g., GDPR, PCI-DSS).
- **Reputational damage** — customer trust is difficult to rebuild after a
  publicized data breach.
- **Low barrier to exploit** — this class of vulnerability does not require
  advanced skill or expensive tools to exploit; free, widely available
  security tools can find and exploit it automatically once identified.

## What Makes This Fixable

The good news: SQL Injection is a **well-understood, well-solved problem**.
It is not a novel or exotic threat — it has a standard, industry-accepted
fix that development teams implement routinely:

- Developers rewrite database queries using a technique called
  **parameterized queries** (also called "prepared statements"), which
  ensures user input is always treated as plain data and never as a
  database command.
- This fix is a coding best practice with no significant downside — it is
  faster to review, easier to maintain, and considered standard practice
  across the software industry.

A detailed technical breakdown, including the exact steps used to identify
the issue and code-level fix examples for developers, is available in the
accompanying report (`sql_injection_report.md`).

## Disclaimer:
*This assessment was conducted in a controlled, self-hosted training
environment (DVWA) as part of a security analyst training exercise, and
does not reflect testing of any production or third-party system.*

## Repository Structure

```
├── README.md
├── sql_injection_report .md
├── sqllog
├── Screenshort
  ├──Database -1
  ├──Database -2
  ├──Extract Tables
  ├──Extract column -1
  ├──Extract column -2
  
```
