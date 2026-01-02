# Google Dorks (Professional & Ethical Use)
> Advanced Google search techniques for discovering hidden job opportunities, technical documents, and labor market signals.

---

## ⚠️ Ethical & Legal Notice
Google Dorks use **official Google search operators**.

- ✅ Job discovery, OSINT, market research, data analysis
- ❌ Unauthorized access, exploitation, doxxing, private data misuse

The query itself is neutral. **Intent and usage matter.**

---

## 1. What is a Google Dork?
A **Google Dork** is an advanced search query that combines operators to:

- Reduce noise
- Surface semi-structured information
- Discover content not designed for public visibility

They are especially useful when:
- No public APIs exist
- Job boards hide or aggregate listings
- Information is scattered across the web

---

## 2. Core Google Search Operators

### `site:`
Restricts results to a domain or domain pattern.

```

site:company.com

```

---

### `intitle:`
Searches within the page title.

```

intitle:"we are hiring"

```

---

### `inurl:`
Searches within the URL path.

```

inurl:careers

```

---

### `filetype:`
Finds files by extension.

```

filetype:pdf

```

---

### Exclusion (`-`)
Removes unwanted results.

```

developer -junior -intern

```

---

### Logical OR
Expands common variants.

```

(hiring OR vacancies OR openings)

```

---

## 3. Generic Dorks for **Job Discovery** 💼

### 🔹 Internal career pages (not job boards)
```

(inurl:careers OR inurl:jobs OR inurl:vacancies)

```
```

intitle:"careers" "apply"

```

---

### 🔹 Job posts not labeled as “jobs”
```

("we are hiring" OR "join our team")

```
```

intitle:"join us" developer

```

---

### 🔹 Remote work opportunities
```

("remote" OR "distributed" OR "work from home")

```
```

intitle:"remote role"

```

---

### 🔹 Contract / freelance positions
```

("contract" OR "freelance" OR "consultant")

```
```

intitle:"contract position"

```

---

## 4. Dorks for **Ethical Job Scraping / OSINT** 🧩

### 🔹 HR and People structures
```

("people team" OR "talent team" OR "human resources")

```

---

### 🔹 Reusable job descriptions (high-value for AI)
```

filetype:pdf "job description"

```
```

filetype:docx "responsibilities" developer

```

---

### 🔹 Real technical requirements
```

("requirements" OR "qualifications") "software"

```
```

intitle:"requirements" engineer

```

---

## 5. Dorks for **Salary Benchmarking** 💰

### 🔹 Public salary ranges
```

("salary range" OR "compensation range")

```
```

filetype:pdf "salary"

```

---

### 🔹 Transparent compensation offers
```

("competitive salary" OR "pay range")

```

---

## 6. Practical Notes

- Google rate-limits repetitive queries
- Rotate wording and operators
- Combine with date filters (`after:2024`)
- Fewer keywords often yield better precision
- High-quality dorks are reusable assets — document them

---

## 7. Strategic Use Cases

- Discover hidden job opportunities
- Train AI models with real job descriptions
- Extract market signals without APIs
- Identify hiring patterns by role, region, or seniority

---

## 8. Mental Model

Think of Google Dorks as a **signal amplifier**, not a hacking tool.

They help you **listen to weak signals** already present on the web.
