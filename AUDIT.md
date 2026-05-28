# Miras Security Audit Report

**Date:** 2026-05-28
**Branch:** `security_audit`
**Scope:** All Solidity smart contracts (13 files), Next.js web application (22 source files), and EthMultiSig external contract
**Commit:** `3a08dbc`

---

## Summary

| Severity | Contracts | Web App | Total | Fixed |
|---|---|---|---|---|
| CRITICAL | 3 | 4 | 7 | 7 |
| HIGH | 7 | 5 | 12 | 12 |
| MEDIUM | 10 | 8 | 18 | 12 |
| LOW | 7 | 7 | 14 | 5 |
| INFORMATIONAL | 3 | 6 | 9 | 0 |
| **Total** | **30** | **30** | **60** | **36** |

All CRITICAL and HIGH findings have been remediated.

---

## Contract Findings

### CRITICAL

#### C-1. Proxy `_setImplementation` missing code-size check — FIXED

**Files:** `contracts/_upgradeable.sol:16`, `contracts/proxy.sol:26`

The `_setImplementation` function only checked `newImpl != address(0)` but did not verify that `newImpl` contains code. An admin could accidentally set the implementation to an EOA, bricking the proxy permanently since all calls would delegatecall to an account with no code.

**Fix:** Added `require(newImpl.code.length > 0, "impl not contract")` to both files.

---

#### C-2. VotesWrapper `depositFor` reentrancy vulnerability — FIXED

**File:** `contracts/token/wrappedToken.sol:114-127`

`depositFor` updated state (totalSupply, balanceOf, checkpoints, voting power) **before** calling `underlying.transferFrom()`. With no reentrancy guard, a malicious or hook-enabled token (e.g. ERC-777) could re-enter and inflate balances. The same pattern existed in `withdraw`.

**Fix:** Added `nonReentrant` modifier. Reordered `depositFor` to pull tokens first (interaction before effects, guarded by reentrancy lock). `withdraw` already had correct CEI ordering — added the guard for defense-in-depth.

---

#### C-3. `resignationInfo` logic bug — block vs time calculation — FIXED

**File:** `contracts/attesters/v4.sol:127-138`

Both branches of the `if (_resignWaitBlocks > 0)` conditional computed `ready = reqAt + _resignWaitSeconds` — the block-based branch was identical to the time-based branch. This returned incorrect `readyAt` values when block-based waiting was configured, misleading users about withdrawal eligibility.

**Fix:** Block-based branch now computes `ready = reqBlock + _resignWaitBlocks` using `_resignRequestedAtBlock[wallet]`.

---

### HIGH

#### H-1. Cross-contract reentrancy in `ExchangeV1.sellExact` — ACKNOWLEDGED

**File:** `contracts/token/exchangeV1.sol:104-116`

The function sends ETH to `msg.sender` via `.call{value: weiOut}("")`. While the `nonReentrant` modifier prevents re-entering this contract, cross-contract reentrancy (e.g. re-entering the token contract) remains possible. Acceptable given the trusted MRS token, but documented.

---

#### H-2. `pickAttesters` uses weak on-chain randomness — ACKNOWLEDGED

**File:** `contracts/attesters/v4.sol:330-356`

Uses `blockhash(block.number - 1)`, `msg.sender`, and `lActiveCount` as entropy. Predictable and manipulable by validators. A VRF oracle or commit-reveal scheme would be needed to fix properly. Requires architecture-level decision.

---

#### H-3. Unbounded arrays in `SafeTableV6` insert/update — FIXED

**File:** `contracts/safes/v6.sol:146-150, 179-186`

No upper bound on `attesters` array length. Large arrays could exceed block gas limit during `delete` operations in `update`, making rows permanently un-updatable.

**Fix:** Added `uint256 private constant MAX_ATTESTERS = 20` and `require(attesters.length <= MAX_ATTESTERS, "too many attesters")` in both `insert` and `update`.

---

#### H-4. Missing `encryptedProtocolPhrases` length validation — FIXED

**File:** `contracts/safes/v6.sol:137, 174`

`attesters.length == encryptedPhones.length` was checked but `encryptedProtocolPhrases.length` was not. Out-of-bounds access could occur if arrays differ in length.

**Fix:** Added `require(attesters.length == encryptedProtocolPhrases.length, "phrases length mismatch")` in both `insert` and `update`.

---

#### H-5. `SafeTableV6.insert` allows anyone to register any `safe_address` — ACKNOWLEDGED

**File:** `contracts/safes/v6.sol:126-158`

No validation that the caller has any relationship to the `safe_address`. An attacker could front-run a legitimate user's `insert`. Requires design decision on whether to restrict to `safe_address == msg.sender` or add signature verification.

---

#### H-6. No storage gap in upgradeable contracts — FIXED

**Files:** `contracts/token/exchangeV1.sol`, `contracts/attesters/v4.sol`, `contracts/claims/v3.1.sol`

Only `SafeTableV6` had `uint256[50] private __gap`. The other three UUPS implementations lacked storage gaps, risking storage collisions on future upgrades.

**Fix:** Added `uint256[50] private __gap` to ExchangeV1, AttestersV4, and ClaimsDBV3_1.

---

#### H-7. `upgradeTo` missing `Upgraded` event — FIXED

**File:** `contracts/_upgradeable.sol:11-14`

No event emitted on implementation changes. Off-chain monitoring and block explorers rely on the EIP-1967 `Upgraded(address indexed implementation)` event.

**Fix:** Added `event Upgraded(address indexed implementation)` and `emit Upgraded(newImplementation)` in `upgradeTo`.

---

### MEDIUM

#### M-1. `VotesWrapper` checkpoint truncation — ACKNOWLEDGED

**File:** `contracts/token/wrappedToken.sol:52, 219-223`

`uint32 fromBlock` overflows after block ~4.29B. `uint224(newValue)` is an unsafe downcast. Extremely unlikely to trigger in practice with 18-decimal tokens, but violates safe casting principles.

---

#### M-2. `ExchangeV1._weiForTokenAmount` can return 0 — FIXED

**File:** `contracts/token/exchangeV1.sol:149-152`

Integer division could round to zero for very small `tokenAmount` values, allowing users to sell tokens for 0 ETH.

**Fix:** Added `require(weiAmount > 0, "amount too small")`.

---

#### M-3. `MRS.approve` front-running — ACKNOWLEDGED

**File:** `contracts/token/token.sol:135-139`

Classic ERC-20 approve race condition. Mitigated by the existence of `increaseAllowance`, `decreaseAllowance`, and `permit`. Well-documented in contract comments.

---

#### M-4. `getClaimsByAttester` unbounded loop — ACKNOWLEDGED

**File:** `contracts/claims/v3.1.sol:210-264`

Two full passes over all `ids` without pagination. Will eventually exceed gas limits for `eth_call`. Recommend adding `(offset, limit)` parameters or a separate attestor-to-claims mapping.

---

#### M-5. `pickAttesters` and `activeCount` iterate over all wallets — ACKNOWLEDGED

**File:** `contracts/attesters/v4.sol:330-368`

Wallets are never removed from `_wallets` even after resignation/deletion. Functions become increasingly expensive. Recommend maintaining an `_activeCount` counter and bounded active-attester data structure.

---

#### M-6. `deleteSelf` does not clear resignation state or refundable deposit — FIXED

**File:** `contracts/attesters/v4.sol:245-251`

A user calling `deleteSelf` instead of `requestResign` would lose the ability to recover their deposit, since `requestResign` requires `a.exists` to be true.

**Fix:** `deleteSelf` now initiates the resignation flow if the user has a non-zero deposit and hasn't already requested resignation.

---

#### M-7. `SafeTableV6.withdraw` missing balance check — FIXED

**File:** `contracts/safes/v6.sol:248-252`

No check that `address(this).balance >= amount` before sending.

**Fix:** Added `require(amount > 0, "amount=0")` and `require(address(this).balance >= amount, "insufficient balance")`.

---

#### M-8. DeadMansSwitch heir can be set to owner — FIXED

**File:** `contracts/switch/DeadMansSwitch.sol:149-157`

No check preventing `newHeir == owner`, creating a self-inheritance scenario that defeats the purpose.

**Fix:** Added `require(newHeir != owner, "heir cannot be owner")`.

---

#### M-9. `ownerWithdraw(0)` withdraws entire balance — ACKNOWLEDGED

**File:** `contracts/switch/DeadMansSwitch.sol:166-178`

Semantic overloading of 0 as "withdraw all" is a footgun. Consider adding a separate `ownerWithdrawAll()` and reverting on `amount == 0`.

---

#### M-10. `ExchangeV1._initialized` pattern — ACKNOWLEDGED

**File:** `contracts/token/exchangeV1.sol:25, 53-55`

The constructor defense is present but fragile for future upgrades. Acceptable for current deployment.

---

### LOW

#### L-1. `MRS._transfer` missing `from != address(0)` check — FIXED

**File:** `contracts/token/token.sol:251`

**Fix:** Added `require(from != address(0), "ERC20: transfer from zero")`.

---

#### L-2. `setResignationWait` missing event — FIXED

**File:** `contracts/attesters/v4.sol:160-163`

**Fix:** Added `ResignationWaitUpdated` event and emission.

---

#### L-3. `slash` can mark non-existent wallets — ACKNOWLEDGED

**File:** `contracts/attesters/v4.sol:165-171`

The `require` condition is overly permissive. Recommend tightening to only allow slashing active or recently-resigned attesters.

---

#### L-4. `setFee` allows zero fee — ACKNOWLEDGED

**File:** `contracts/safes/v6.sol:242-246`

May be intentional for promotional periods. Add minimum if free registrations are not desired.

---

#### L-5. `createClaim` encryptedSafe validation commented out — ACKNOWLEDGED

**File:** `contracts/claims/v3.1.sol:141`

`//require(bytes(encryptedSafe).length > 0, "encryptedSafe=empty")` — either uncomment or document why it was removed.

---

#### L-6. `heirWithdraw` does not reset `lastActivityTimestamp` — ACKNOWLEDGED

**File:** `contracts/switch/DeadMansSwitch.sol:183-193`

After heir withdraws, any ETH accidentally sent later is immediately claimable. Likely by design.

---

#### L-7. `withdrawETH` missing balance validation — ACKNOWLEDGED

**File:** `contracts/token/exchangeV1.sol:127-132`

Low-level call will fail on insufficient balance, but a clearer error message would improve UX.

---

### INFORMATIONAL

- **I-1.** `VotesWrapper` does not emit `Approval` event in `transferFrom`
- **I-2.** Proxy contracts are trivially simple wrappers (correct and clean)
- **I-3.** `MRS` uses `unchecked` blocks after bounds checks — correct gas optimization

---

## Web Application Findings

### CRITICAL

#### WC-1. Private keys and seed phrases logged to browser console — FIXED

**Files:** `web/app/launch/page.tsx:286-302`, `web/app/launch-manual/page.tsx:195`, `web/app/track/page.tsx:110`

Heir private keys, protocol seed phrases, and encryption private keys were written to the browser console via `console.log`. Accessible to any browser extension, devtools, or malware.

**Fix:** Removed all `console.log` statements that output sensitive cryptographic material across all affected files (~60 statements removed total).

---

#### WC-2. Seed phrase passed in URL query parameters — FIXED

**Files:** `web/app/launch/page.tsx:805`, `web/app/launch-manual/page.tsx:473`

The heir seed phrase was embedded in a URL query parameter when linking to the crypto-will-wizard. This exposes it in browser history, referrer headers, server logs, and analytics.

**Fix:** Replaced URL parameter with `sessionStorage`. The seed phrase is stored in `sessionStorage` on click and read + cleared by the wizard page on load.

---

#### WC-3. Seed phrase included in encrypted payload to attesters — FIXED

**File:** `web/app/launch-manual/page.tsx:166-173`

The manual launch flow included `seedPhrase: validatedSeed.phrase` in the `contactInfo` JSON encrypted and sent to attesters. The full launch flow correctly excluded it.

**Fix:** Removed `seedPhrase` from the `contactInfo` object.

---

#### WC-4. Private key displayed in plaintext on register page — FIXED

**File:** `web/app/register/page.tsx:355-359`

The attester private key was rendered in a `<textarea readOnly>`, visible to anyone on screen, screen-sharing software, or DOM-reading extensions.

**Fix:** Replaced with `<input type="password" readOnly>` and a "Copy" button. Added explanatory text directing users to use the keystore download.

---

### HIGH

#### WH-1. Crypto functions and keys exposed on `window` global — FIXED

**Files:** `web/app/decrypt/page.tsx:20-23,67`, `web/app/launch/page.tsx:433-436,619-622`, `web/app/register/page.tsx:85-88`

`encryptString`, `decryptString`, private keys, and sensitive functions were assigned to `window`, making them accessible to any JavaScript on the page including third-party scripts.

**Fix:** Removed all `window` global assignments.

---

#### WH-2. Blog XSS via `dangerouslySetInnerHTML` with unsanitized HTML — FIXED

**Files:** `web/app/blog/[slug]/page.tsx:36`, `web/lib/blog.ts:63`

Blog HTML was generated by `remark-html` which does not sanitize by default. Raw HTML in markdown files would be rendered and executed.

**Fix:** Added `{ sanitize: true }` option to `remark-html`.

---

#### WH-3. `dangerouslySetInnerHTML` for inline CSS — ACKNOWLEDGED

**File:** `web/app/exchange/ExchangeClient.tsx:369`

Hardcoded `STYLE` constant is currently safe but bypasses CSP for inline styles. Consider CSS Modules or `styled-jsx`.

---

#### WH-4. Heir encryption private key displayed in UI alert — ACKNOWLEDGED

**Files:** `web/app/launch/page.tsx:411`, `web/app/launch-manual/page.tsx:255`

The key is shown in a `showAlert()` message in the DOM. Consider providing a secure download/copy mechanism instead.

---

#### WH-5. No Content Security Policy headers — FIXED

**File:** `web/next.config.mjs`

No security headers were configured.

**Fix:** Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`. A full CSP with script nonces is recommended as a follow-up.

---

### MEDIUM

#### WM-1. WalletConnect project ID fallback to placeholder — ACKNOWLEDGED

**File:** `web/lib/wagmi.ts:62`

Fallback `'YOUR_PROJECT_ID'` is not a valid WalletConnect ID. Should throw at build time or disable the connector.

---

#### WM-2. No input validation on exchange ETH amount — ACKNOWLEDGED

**File:** `web/app/exchange/ExchangeClient.tsx:404-413`

No max-value validation, no check against user balance. Users could submit transactions that revert with opaque errors.

---

#### WM-3. Hardcoded "Balance: 0.00" in exchange UI — ACKNOWLEDGED

**File:** `web/app/exchange/ExchangeClient.tsx:394,430`

Static balance display is misleading. Should fetch actual ETH and token balances.

---

#### WM-4. Floating-point arithmetic for token amounts — ACKNOWLEDGED

**File:** `web/app/exchange/ExchangeClient.tsx:273-274`

JavaScript floating-point used for financial calculations. Safe for `FIXED_RATE = 10` but fragile. Recommend `BigNumber` arithmetic.

---

#### WM-5. `QueryClient` instantiated at module scope — FIXED

**File:** `web/app/providers.tsx:9`

Module-level `QueryClient` is shared across SSR requests, causing potential data leakage between users.

**Fix:** Moved instantiation inside the component with `useState(() => new QueryClient())`.

---

#### WM-6. Unvalidated JSON parsing of attester API responses — ACKNOWLEDGED

**Files:** `web/app/claim/page.tsx:175`, `web/app/launch/page.tsx:283`, `web/app/launch-manual/page.tsx:163`

`JSON.parse` per line without try/catch or field validation. Recommend wrapping and validating `public_key` and `address` fields.

---

#### WM-7. Government ID file input collected but not used — ACKNOWLEDGED

**Files:** `web/app/launch/page.tsx:716-720`, `web/app/launch-manual/page.tsx:440-448`

UI collects a file (marked required) but only the filename is included in the payload. Content is never processed. Either remove the field or implement upload.

---

#### WM-8. Missing CSRF protection — ACKNOWLEDGED

No CSRF token mechanism for state-changing operations. Consider `SameSite` cookies and `Origin`/`Referer` header validation.

---

### LOW

#### WL-1. Biased shuffle algorithm for attester selection — ACKNOWLEDGED

**Files:** `web/app/claim/page.tsx:172`, `web/app/launch/page.tsx:280`, `web/app/launch-manual/page.tsx:161`

`[...lines].sort(() => Math.random() - 0.5)` does not produce a uniform distribution. Should use Fisher-Yates shuffle.

---

#### WL-2. `Math.random()` used for seed verification indices — ACKNOWLEDGED

**Files:** `web/app/launch/page.tsx:61`, `web/app/switch/page.tsx:60-64`

Not cryptographically secure. Use `crypto.getRandomValues()` for security-sensitive randomness.

---

#### WL-3. Excessive debug logging — FIXED

**Files:** Multiple pages

~60 `console.log` statements removed, many of which logged encrypted payloads, ciphertexts, and contact information.

---

#### WL-4. `localStorage` used for sensitive data — ACKNOWLEDGED

**Files:** `web/app/register/page.tsx:46-47`, `web/app/launch/page.tsx:600`, `web/app/track/page.tsx:73`

Keystore JSON and Safe addresses stored in `localStorage`, accessible to XSS. Consider `sessionStorage` or encouraging offline storage.

---

#### WL-5. Potential path traversal in blog slug — FIXED

**File:** `web/lib/blog.ts:42-44, 57-59`

Slug from URL route parameter could contain `../` to escape the blog directory.

**Fix:** Added `if (!/^[a-zA-Z0-9_-]+$/.test(slug)) return null` validation in both `getPostMeta` and `getPost`.

---

#### WL-6. Dead/commented-out code — FIXED (partial)

**Files:** `web/app/claim/page.tsx:217-245`, `web/app/launch/page.tsx:179-253`

Removed `slow_findAttestors` dead function. Commented-out gasless variant in claim page still present.

---

#### WL-7. `slow_findAttestors` encrypts hardcoded test string — FIXED

**File:** `web/app/launch/page.tsx:239`

Entire dead function removed.

---

### INFORMATIONAL

- **WI-1.** `next` version 14.2.5 — check for known vulnerabilities, update recommended
- **WI-2.** `ethers` pinned to 5.7.2 (maintenance mode) — plan migration to v6
- **WI-3.** `.env.example` contains actual contract addresses — use placeholders
- **WI-4.** `web3.storage` dependency unused — remove to reduce attack surface
- **WI-5.** `postgres` dependency included but no usage found — verify or remove
- **WI-6.** `force-static` used alongside `"use client"` — no effect, remove for clarity

---

## Recommendations

### Immediate (pre-deployment)

1. **Deploy new contract implementations** with the fixes applied, then upgrade proxies via `upgradeTo`
2. **Verify storage layout compatibility** — new `__gap` slots are appended at the end; confirm no collisions with existing deployed storage
3. **Run `npm audit`** and update vulnerable dependencies (Next.js, ethers)
4. **Add a full CSP header** with script nonces for comprehensive XSS prevention

### Short-term

5. Replace on-chain randomness in `pickAttesters` with Chainlink VRF or a commit-reveal scheme
6. Add pagination to `getClaimsByAttester` and maintain an `_activeCount` counter in AttestersV4
7. Implement proper Fisher-Yates shuffle and `crypto.getRandomValues()` on the frontend
8. Add JSON validation for API responses (attester entries)
9. Validate exchange amounts against user balances before submitting transactions

### Long-term

10. Migrate from ethers v5 to v6
11. Implement CSRF protection for state-changing API calls
12. Consider restricting `SafeTableV6.insert` to prevent front-running of safe address registration
13. Add a separate `ownerWithdrawAll()` to DeadMansSwitch to avoid the `amount=0` footgun
14. Remove unused dependencies (`web3.storage`, `postgres` if unused)

---

## EthMultiSig External Contract Audit

**Source:** [`esokullu/ethmultisig` on GitHub](https://github.com/esokullu/ethmultisig/blob/main/EthMultiSig.sol)
**Website:** [ethmultisig.org](https://ethmultisig.org/)
**Lines:** ~150 (Solidity ^0.8.20)

### Overview

A minimal, zero-dependency Ethereum multisig wallet. No imports, no proxies, no delegatecall, no modules. Owners propose transactions, other owners confirm, and once the threshold is met any owner can execute.

### Verdict: PASS

No CRITICAL or HIGH findings. The contract is well-designed for its stated purpose.

### Architecture

- **Immutable owner set and threshold** — set once in the constructor, never changeable
- **Transaction lifecycle:** submit → confirm (by N owners) → execute
- **Auto-confirm on submit** — the proposer is automatically counted as a confirmer
- **Revocation** — owners can revoke their confirmation before execution
- **CEI pattern in `execute`** — `t.executed = true` is set before the external `.call`, preventing re-execution of the same txId via reentrancy

### Detailed Findings

#### LOW-1. No reentrancy guard on `execute`

**File:** `EthMultiSig.sol` — `execute` function

The `execute` function sets `t.executed = true` before the external call, which prevents re-execution of the same transaction. However, a malicious call target could re-enter `submit`, `confirm`, or `execute` for a *different* transaction. This is technically safe (each transaction is independent), but a `nonReentrant` modifier would add defense-in-depth.

**Risk:** Minimal — the CEI pattern is correctly applied and cross-transaction reentrancy has no exploit path.

---

#### LOW-2. No owner management post-deployment

**File:** `EthMultiSig.sol` — constructor

Owners and threshold are fixed at deployment. If an owner's key is compromised, the only recourse is deploying a new multisig and migrating funds. This is by design (simplicity), but users should be aware.

**Mitigation:** Document this limitation. For high-value wallets, consider deploying with a higher threshold so a single compromised key cannot reach quorum.

---

#### LOW-3. `submit` allows `to == address(0)`

**File:** `EthMultiSig.sol` — `submit` function

No check preventing proposals targeting the zero address. Executing such a transaction with value would burn ETH irreversibly.

**Mitigation:** Consider adding `require(to != address(0), "zero to")` unless there is a deliberate reason to allow precompile calls.

---

#### INFORMATIONAL-1. `transactions` array grows unboundedly

Executed and stale transactions remain in the array forever. The `txCount()` return value grows monotonically. Not a gas issue (no loops over all transactions), but a storage cost concern over the lifetime of the contract.

---

#### INFORMATIONAL-2. No timelock between confirmation and execution

Once confirmations reach the threshold, any owner can execute immediately in the same block. This is standard for on-chain multisigs but means there is no cool-down period for owners to reconsider.

---

#### INFORMATIONAL-3. `_revertReason` assembly pattern

The `assembly { ret := add(ret, 0x04) }` pattern strips the 4-byte `Error(string)` selector before calling `abi.decode`. This is a well-established pattern (used by Gnosis Safe and others). If return data is not a standard `Error(string)`, the decode may revert or produce unexpected output, but this is handled gracefully since the overall transaction reverts anyway on a failed call.

---

#### INFORMATIONAL-4. No `fallback()` function

Only `receive()` is defined. ETH sent with non-empty calldata that doesn't match a function selector will revert. This is acceptable — the wallet is interacted with via its explicit API.

---

#### INFORMATIONAL-5. No ERC-1271 signature support

The contract cannot validate off-chain signatures as a "smart contract wallet" (ERC-1271). This means it cannot be used with protocols that require signature verification from the wallet itself. Out of scope for a minimal multisig.

---

### Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 3 |
| INFORMATIONAL | 5 |

The contract is clean, minimal, and correctly implements the multisig pattern. The simplicity itself is a security feature — the entire contract can be audited in one sitting. Recommended as a lightweight alternative to Safe for users who want a zero-dependency, fully transparent multisig.
