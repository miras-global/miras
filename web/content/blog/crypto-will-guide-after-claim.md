---
title: You've Created a Claim and Shared the Private Keys to Attestors, Now What?
date: 2025-11-02
description: A comprehensive guide to creating your Crypto Will - the document your heirs need to claim and access their inheritance.
---

After setting up your Miras inheritance plan and sharing the encrypted keys with attestors, there's one critical step remaining: creating a clear, accessible guide for your heirs. This document—your Crypto Will—is what enables them to actually claim and access the assets you've entrusted to the protocol.

Think of it as the bridge between the technical infrastructure you've built and the real people who will need to use it. No blockchain knowledge required on their end, just clear instructions they can follow step by step.

## Why You Need a Physical Crypto Will

The Miras protocol handles the cryptographic security and verification, but your heirs still need to know:

- That the inheritance exists
- Where to start the claim process
- What information they'll need
- How to use the recovery keys you've prepared

This is why we recommend creating a physical document—printed on paper or saved to a USB drive—that you store securely and share with trusted family members or your estate executor. **Avoid emailing this document if possible**, as email accounts can be compromised or lost.

## The Crypto Will Template

Below is a complete template you can customize for your situation. Fill in the bracketed placeholders with your specific information, then print or save it securely.

---

## Your Crypto Will – How to Claim & Access the Inheritance

Dear [Beneficiary Name],

Below is a simple, step‑by‑step guide that will help you claim and access the crypto assets after I'm gone.

If I can't be there to walk you through it, the only thing that will let you reach the money and tokens entrusted to me are a set of cryptographic keys. This document lists everything you'll need in plain language—no blockchain knowledge required.

If you'd rather have help, work with someone you trust and stay by their side throughout the process. In professional hands it should take less than an hour.

---

### 1. What you'll use first – The "Safe" (a multi‑signature Ethereum wallet)

| Item | Details |
|------|---------|
| **Wallet address** | `[SAFE_ADDRESS]` |
| **View balance & transaction history** | `https://app.safe.global/apps?safe=eth:[SAFE_ADDRESS]` |
| **First seed phrase (BIP‑39)** | `WORD1 WORD2 WORD3 … WORD12` |

> **Keep this phrase in a secure place – never write it on the same paper as your bank card or phone number.** You'll need to type it into a wallet (e.g., MetaMask) exactly as shown, including the order of words and spaces.

---

### 2. Claiming my assets after I'm gone

1. **Visit the claim portal** – `https://miras.global/claim`
2. **Fill in your contact details** (name, email, phone).  
   *The service needs this to verify you are an authorized claimant.*
3. Click "Submit" and wait for a confirmation e‑mail.

> The team normally takes about **three months** to process a claim. They'll confirm my death with the estate lawyer or executor before releasing any funds.

---

### 3. Getting the second recovery key

Once your claim is approved, you will receive an *encrypted* file (or email) that contains the second part of the key needed for the Safe. To decrypt it:

1. Go to `[DECRYPTION_URL]`
2. Paste the following **decryption passphrase** into the box and press "Decrypt":

   `0x[ENCRYPTED_PASSPHRASE]`

3. The screen will display a **second BIP‑39 seed phrase** (or a raw private key).  
   *If it's a raw key, you can import it into MetaMask as "Import Wallet → Private Key".*

---

### 4. Using both keys to access the Safe

1. Open MetaMask and click "Add Account".
2. Import **first seed phrase** (the one listed above).
3. Import **second seed phrase / private key** obtained in step 3.
4. Once both accounts are visible, go back to `https://app.safe.global/apps?safe=eth:[SAFE_ADDRESS]` and log in with the Safe address.  
   The Safe will now recognize that you hold both required keys.

You can then:

- View all tokens and Ether inside the Safe.
- Send funds out or transfer them to any other wallet you choose.

---

### 5. If something goes wrong

| Scenario | What to do |
|----------|------------|
| **Claim portal is down** | Use a reputable Ethereum wallet that supports BIP‑39 (e.g., MetaMask, Ledger Live). The keys will still work on the blockchain. Both Safe and the claim service are open source, so you can use them independently. |
| **Forgot a word in a seed phrase** | There's no recovery – make sure you store each phrase securely. |
| **Someone else claims your name** | Only someone with both keys can control the Safe. Keep the keys safe once you have them. |

---

### 6. Final safety tips

1. **Never share any of these phrases online.**
2. Store each phrase on a separate medium: one on a paper wallet inside a safe deposit box, another in a hardware wallet or a password‑protected digital file.
3. If you're uncomfortable doing this yourself, find a **trusted** crypto professional to walk you through the steps and verify everything.

---

> **I love you, [Beneficiary Name].** I trust that you will keep these instructions safe and use them responsibly.

With all my love,  
[Your Name]

---

## How to Use This Template

### Step 1: Fill in the Placeholders

Go through the template and replace every bracketed item:

- **[Beneficiary Name]**: Your heir's name
- **[SAFE_ADDRESS]**: The Ethereum address of your Gnosis Safe (starts with 0x)
- **[WORD1 WORD2 ...]**: The 12-word recovery phrase you generated during Safe creation
- **[DECRYPTION_URL]**: The URL where your heir can decrypt the second key (if applicable)
- **[ENCRYPTED_PASSPHRASE]**: The passphrase needed to decrypt the second key
- **[Your Name]**: Your name

### Step 2: Print or Save to USB

Once you've filled in all the details:

1. **Print the document** on durable paper and store it in a fireproof safe or safe deposit box
2. **Save to USB drive** and store the drive in a secure location separate from the printed copy
3. **Create multiple copies** and distribute them to trusted parties (estate lawyer, family member, etc.)

### Step 3: Inform Your Heirs

Make sure your beneficiaries know:

- That this document exists
- Where to find it when needed
- Who else has access to copies (your lawyer, executor, etc.)

You don't need to give them the document now—just make sure they know where to look when the time comes.

### Step 4: Update as Needed

If you change your Safe configuration, add more assets, or update your recovery keys, remember to update this document and replace all copies.

## Security Best Practices

**Do:**
- Store printed copies in physically secure locations (safe deposit box, fireproof safe)
- Use password-protected USB drives for digital copies
- Keep the seed phrases and Safe address on separate pages if you're worried about theft
- Test the recovery process yourself before finalizing the document

**Don't:**
- Email the complete document (email can be hacked)
- Store digital copies in cloud services without strong encryption
- Write your seed phrases in the same location as your banking information
- Share the document with anyone who isn't a trusted heir or executor

## What Makes This Different from Traditional Wills

Traditional wills require probate, lawyers, and months of legal proceedings. Your Crypto Will works alongside the Miras protocol to provide:

- **Immediate access** once the claim is verified (no probate delay)
- **Trustless verification** through decentralized attestors
- **Privacy** through encryption (no public court records)
- **Certainty** through smart contracts (no disputes over interpretation)

The legal system handles your traditional assets. Miras and your Crypto Will handle your digital ones.

## Next Steps

1. Download or copy this template
2. Fill in all your specific information
3. Print and/or save to USB
4. Store securely in multiple locations
5. Inform your heirs and executor where to find it
6. Review and update annually

Your crypto inheritance plan is only complete when your heirs can actually access what you've left them. This document is the final piece of that puzzle—the human-readable bridge between complex cryptography and the people you care about.

**Death Happens. Be Ready.**

---

*For more information about setting up your Miras inheritance plan, visit [miras.global](https://miras.global) or contact us at [team@miras.global](mailto:team@miras.global).*
