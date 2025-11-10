---
title: How to Add a New Signer to Your Safe Wallet and Register with Miras
date: 2025-11-04
description: A complete guide to upgrading your Safe wallet from 2-of-3 to 2-of-4 signers and registering it with Miras for inheritance protection.
---

If you already have a Gnosis Safe wallet set up with a 2-of-3 configuration (2 signatures required out of 3 owners) and want to add a fourth signer while maintaining the same threshold, this guide walks you through the entire process. We'll also show you how to register your Safe with Miras for trustless inheritance protection.

## Why Add Another Signer?

Adding a fourth signer to your Safe wallet provides additional flexibility and redundancy. With a 2-of-4 configuration, you can:

- Distribute signing authority among more trusted parties
- Maintain access even if two keys are lost or compromised
- Add a backup signer for emergency situations
- Integrate with inheritance protocols like Miras

## Part 1: Adding a New Owner to Your Safe Wallet

### Prerequisites

Before you start, make sure you have:

- Access as one of the current owners of the Safe
- The Safe address
- The new signer's wallet address
- Gas (ETH or native token) for the transaction on the same network
- The current threshold (2 in this case)

### Step 1: Open the Safe Web App

1. Go to [https://app.safe.global](https://app.safe.global)
2. Connect your wallet (must be one of the current owners)
3. Select your Safe from the dashboard

### Step 2: Navigate to Settings → Owners

1. In the left sidebar, click **Settings**
2. Choose the **Owners** tab
3. You'll see the list of current owners and the approval threshold (e.g. *2 out of 3*)

### Step 3: Add the New Owner

1. Click **"Add new owner"**
2. Enter:
   - **Owner name** (optional, for display purposes)
   - **Owner address** (the new signer's wallet address)
3. Leave the **threshold** as **2** to maintain a *2-of-4* setup
4. Click **Submit**

### Step 4: Confirm the Transaction

1. The transaction proposal will now appear in the **Queue**
2. It must be confirmed by **two existing owners** (since the current threshold is 2)
3. Once both have confirmed, **execute** the transaction

After execution:
- The new owner will be added
- The configuration becomes **4 owners, threshold = 2**

### Step 5: Verify the Update

After the transaction is executed:

1. Go to **Settings → Owners** again
2. Confirm that the new signer is listed
3. Ensure that the **Threshold** is **2 out of 4**

## Part 2: Registering Your Safe with Miras for Inheritance

Now that you've added a new signer to your Safe, you can register it with Miras to ensure your crypto assets can be inherited by your designated heirs. The Miras protocol provides trustless, decentralized inheritance through encrypted key management and attester verification.

### What is Miras Manual Launch?

The Manual Launch feature allows you to register an existing Safe wallet with the Miras inheritance protocol. Unlike the automated launch flow that creates a new Safe for you, Manual Launch lets you bring your own Safe and seed phrase.

### How Manual Launch Works

When you use Manual Launch, the system:

1. **Validates your seed phrase** locally in your browser (never sent to any server)
2. **Encrypts your contact information** with randomly selected attester public keys
3. **Creates a double-encrypted protocol key** for your heir
4. **Registers your Safe** on-chain with the encrypted data
5. **Generates a decryption key** that you must share with your heir

### Step-by-Step: Using Manual Launch

#### Step 1: Navigate to Manual Launch

Visit [https://miras.global/launch-manual](https://miras.global/launch-manual) and connect your wallet.

#### Step 2: Enter Your Seed Phrase

**Security Warning:** Only use this if you already have an existing seed phrase. Never share your seed phrase with anyone. This page validates your seed locally in your browser and never sends it to any server.

1. Choose your seed type (12 or 24 words)
2. Enter your seed phrase in the first text area
3. Re-enter the same seed phrase in the second text area for confirmation
4. Click **"Validate Seed Phrase"**

The system will validate your seed phrase and derive an Ethereum address to confirm it's valid.

#### Step 3: Enter Your Safe Address and Contact Information

Once your seed is validated, you'll need to provide:

**Safe Wallet Address:**
- Enter the Safe address you just added the new signer to (starts with 0x)

**Contact Information:**
- Primary Phone Number (required)
- Secondary Phone Number (optional)
- Primary Email (required)
- Secondary Email (optional)
- Government ID Photo (required - passport, driver's license, etc.)

This information is encrypted and distributed to attesters who will verify claims from your heirs.

#### Step 4: Find Attestors and Register

Click **"Find Attestors & Register"**. The system will:

1. Fetch a list of active attesters from the Miras network
2. Randomly select 3 attesters
3. Encrypt your contact information with each attester's public key
4. Generate a new encryption key pair for your heir
5. Double-encrypt your protocol seed phrase (first with heir's key, then with each attester's key)
6. Submit a transaction to register your Safe on-chain

**Important:** You'll need to pay a 0.1 ETH registration fee for this transaction.

#### Step 5: Save Your Heir's Decryption Key

After successful registration, you'll receive a critical piece of information:

**Heir Decryption Key** (looks like: `0x1234...abcd`)

This key is essential for your heir to decrypt the protocol seed phrase. You must:

- **Save it securely** (write it down, store in a password manager, or save to encrypted USB)
- **Share it with your heir** through a secure offline method
- **Never lose it** - without this key, your heir cannot access the inheritance

### Step 6: Create Your Crypto Will

After registering with attesters, create a document for your heirs explaining how to claim their inheritance. The Manual Launch page provides two options:

1. **Create with Wizard** - An interactive tool that generates a personalized Crypto Will
2. **Read the Guide** - A comprehensive template you can customize

For detailed instructions on creating your Crypto Will, see our guide: [You've Created a Claim and Shared the Private Keys to Attestors, Now What?](/blog/crypto-will-guide-after-claim)

## Configuration Summary

| Property | Before | After |
|-----------|---------|--------|
| Total Owners | 3 | 4 |
| Threshold (signatures required) | 2 | 2 |
| Miras Registration | Not registered | Registered with attesters |
| Inheritance Protection | None | Active |

## Security Best Practices

**For Safe Wallet Management:**
- Keep track of all owner addresses and their purposes
- Regularly review your owner list in Safe settings
- Consider increasing the threshold if you add more owners
- Test small transactions before moving large amounts

**For Miras Registration:**
- Store your heir's decryption key in multiple secure locations
- Never email or text the decryption key
- Create a physical Crypto Will document for your heirs
- Update your contact information if it changes
- Review your registration annually

## Tips and Considerations

**Threshold Management:**
- The threshold defines how many owners must sign each transaction
- You can optionally adjust it during the "Add Owner" step (e.g. 3-of-4)
- A 2-of-4 setup provides good balance between security and accessibility
- Higher thresholds (3-of-4) provide more security but less flexibility

**Removing Owners:**
- To remove an owner later, use the **"Remove owner"** option under **Settings → Owners**
- Every change (add/remove/change threshold) must be approved by the required number of signers
- Removing an owner doesn't affect your Miras registration

**Updating Miras Registration:**
- If you change your Safe configuration significantly, you may need to update your Miras registration
- Contact the Miras team at [team@miras.global](mailto:team@miras.global) for guidance

## What Happens When Your Heir Needs to Claim?

When the time comes, your heir will:

1. Visit [https://miras.global/claim](https://miras.global/claim)
2. Submit a claim with their contact information
3. Wait for attesters to verify the claim (typically 3 months)
4. Receive the encrypted protocol seed phrase from attesters
5. Use the heir decryption key you provided to decrypt it
6. Combine both keys to access the Safe wallet
7. Transfer assets to their own wallet

The entire process is trustless and decentralized - no single party can unilaterally access your funds.

## Troubleshooting

**Safe Wallet Issues:**

| Problem | Solution |
|---------|----------|
| Transaction won't execute | Ensure you have enough gas and the required number of confirmations |
| New owner not appearing | Wait for transaction confirmation and refresh the page |
| Can't find the Safe | Make sure you're connected with an owner wallet on the correct network |

**Miras Registration Issues:**

| Problem | Solution |
|---------|----------|
| Seed validation fails | Double-check your seed phrase for typos and correct word order |
| Transaction fails | Ensure you have 0.1 ETH + gas fees in your wallet |
| No attesters available | Try again later - the network may be temporarily unavailable |
| Lost heir decryption key | Unfortunately, there's no recovery - this is why secure storage is critical |

## Next Steps

1. **Add the new owner** to your Safe using the steps above
2. **Register with Miras** using the Manual Launch tool
3. **Save the heir decryption key** in multiple secure locations
4. **Create your Crypto Will** using the wizard or template
5. **Inform your heir** where to find the decryption key and Crypto Will
6. **Review annually** to ensure everything is up to date

Your crypto inheritance plan is only complete when your heirs can actually access what you've left them. By combining a properly configured Safe wallet with Miras registration, you've created a robust, trustless system for digital asset inheritance.

## TL;DR

**Adding a New Signer:**
1. Open Safe App → Settings → Owners
2. Click "Add new owner"
3. Enter the new wallet address
4. Keep threshold at 2
5. Submit, get 2 confirmations, then execute

**Registering with Miras:**
1. Visit [miras.global/launch-manual](https://miras.global/launch-manual)
2. Validate your seed phrase
3. Enter Safe address and contact info
4. Click "Find Attestors & Register"
5. Pay 0.1 ETH registration fee
6. Save the heir decryption key securely
7. Create your Crypto Will

Your Safe is now **4 owners / 2 required signatures** with **trustless inheritance protection**.

**Death Happens. Be Ready.**

---

*For more information about Miras inheritance protocol, visit [miras.global](https://miras.global) or contact us at [team@miras.global](mailto:team@miras.global).*
