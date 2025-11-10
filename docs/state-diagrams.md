# Miras State Diagrams

This document contains state transition diagrams for all stateful entities in the Miras inheritance system.

## Table of Contents

1. [Claim Status State Machine](#claim-status-state-machine)
2. [Attester Lifecycle States](#attester-lifecycle-states)
3. [Safe Configuration States](#safe-configuration-states)
4. [User Journey States](#user-journey-states)
5. [Token Flow States](#token-flow-states)

---

## Claim Status State Machine

The claim status represents the lifecycle of an inheritance claim from creation to final resolution.

```mermaid
stateDiagram-v2
    [*] --> Pending: createClaim()<br/>Heir pays 10 MRS
    
    Pending --> Pending: updateEncryptedPhone()<br/>updateAttestor()<br/>(Claimer only)
    
    Pending --> Approved: setStatus(Approved)<br/>(Treasury only)<br/>After verification
    
    Pending --> Rejected: setStatus(Rejected)<br/>(Treasury only)<br/>Verification failed
    
    Pending --> Cancelled: setStatus(Cancelled)<br/>(Treasury only)<br/>Owner objected or<br/>Claimer withdrew
    
    Approved --> [*]: Assets Released<br/>Heir accesses Safe
    
    Rejected --> [*]: Claim Denied<br/>No asset transfer
    
    Cancelled --> [*]: Claim Cancelled<br/>No asset transfer
    
    note right of Pending
        Status: 0
        - Claimer can update phone/attestor
        - Attester can view and decrypt
        - Waiting for verification
    end note
    
    note right of Approved
        Status: 1
        - Verification successful
        - Heir can access Safe
        - Uses Key B + Protocol Key C
    end note
    
    note right of Rejected
        Status: 2
        - Verification failed
        - Death certificate invalid
        - Identity not confirmed
    end note
    
    note right of Cancelled
        Status: 3
        - Owner objected (still alive)
        - Claimer withdrew claim
        - Fraud detected
    end note
```

**State Definitions:**

- **Pending (0)**: Initial state after claim creation. Claimer can modify encrypted phone and attestor. Attester performs verification.
- **Approved (1)**: Treasury approved claim after successful verification. Heir can now access Safe assets using 2-of-3 keys.
- **Rejected (2)**: Treasury rejected claim due to failed verification, invalid death certificate, or identity issues.
- **Cancelled (3)**: Claim cancelled because owner objected (proving they're alive) or claimer withdrew.

**Transitions:**

- `createClaim()`: Heir initiates claim, pays 10 MRS fee → **Pending**
- `updateEncryptedPhone()`: Claimer updates contact info (only in **Pending**)
- `updateAttestor()`: Claimer changes designated attester (only in **Pending**)
- `setStatus(Approved)`: Treasury approves after verification → **Approved**
- `setStatus(Rejected)`: Treasury rejects after verification → **Rejected**
- `setStatus(Cancelled)`: Treasury cancels due to objection → **Cancelled**

**Access Control:**

- **Claimer**: Can update phone/attestor only in Pending state
- **Treasury**: Can change status from Pending to any final state
- **Attester**: Read-only access to decrypt and verify

---

## Attester Lifecycle States

The attester lifecycle tracks the registration, activity, resignation, and withdrawal process.

```mermaid
stateDiagram-v2
    [*] --> Unregistered: Initial State
    
    Unregistered --> Active: upsertAttester()<br/>Pay 100 MRS stake
    
    Active --> Active: upsertAttester()<br/>Update profile<br/>Pay additional stake
    
    Active --> ResignRequested: requestResign()<br/>exists = false<br/>Record timestamp
    
    Active --> Slashed: slash(true)<br/>(Admin only)<br/>Misbehavior detected
    
    ResignRequested --> Active: upsertAttester()<br/>Cancel resignation<br/>Pay stake again
    
    ResignRequested --> WaitingPeriod: Wait 30 days<br/>or X blocks
    
    WaitingPeriod --> Withdrawn: withdrawDeposit()<br/>Receive staked MRS<br/>Clear records
    
    Slashed --> Slashed: Cannot resign<br/>Cannot withdraw<br/>Permanent penalty
    
    Withdrawn --> [*]: Fully Exited
    
    note right of Unregistered
        - No profile exists
        - Not in attesters list
        - Cannot be selected
    end note
    
    note right of Active
        exists = true
        isSlashed = false
        - Can be selected by pickAttesters()
        - Can receive claims
        - Can update profile
        - Stake held in contract
    end note
    
    note right of ResignRequested
        exists = false
        resignRequestedAt > 0
        - Cannot be selected
        - Cannot receive new claims
        - Must wait before withdrawal
        - Existing claims still valid
    end note
    
    note right of WaitingPeriod
        - Waiting period elapsed
        - Can call withdrawDeposit()
        - Stake still locked
    end note
    
    note right of Slashed
        isSlashed = true
        - Cannot resign
        - Cannot withdraw stake
        - Excluded from pickAttesters()
        - Penalty for misbehavior
    end note
    
    note right of Withdrawn
        - Stake refunded
        - All records cleared
        - Can re-register later
    end note
```

**State Definitions:**

- **Unregistered**: No attester profile exists for this address
- **Active**: Registered attester with `exists = true`, can receive claims
- **ResignRequested**: Attester requested resignation, `exists = false`, waiting period started
- **WaitingPeriod**: Resignation waiting period (30 days) elapsed, can withdraw
- **Slashed**: Attester penalized for misbehavior, cannot withdraw stake
- **Withdrawn**: Stake refunded, attester fully exited

**Transitions:**

- `upsertAttester()`: Register or update profile, pay stake → **Active**
- `requestResign()`: Request resignation, become inactive → **ResignRequested**
- `slash(true)`: Admin penalizes attester → **Slashed**
- `withdrawDeposit()`: After waiting period, withdraw stake → **Withdrawn**

**Key Properties:**

- **exists**: Boolean indicating if attester is active
- **isSlashed**: Boolean indicating if attester is penalized
- **resignRequestedAt**: Timestamp when resignation was requested
- **refundableDeposit**: Amount of staked MRS that can be withdrawn

---

## Safe Configuration States

The safe configuration tracks the lifecycle of a registered Safe wallet in the Miras system.

```mermaid
stateDiagram-v2
    [*] --> Unregistered: Safe Deployed<br/>Not in Miras
    
    Unregistered --> Registered: insert()<br/>Pay 0.1 ETH<br/>Store configuration
    
    Registered --> Registered: update()<br/>Pay 0.1 ETH<br/>Modify configuration
    
    Registered --> ClaimPending: Claim Created<br/>Heir initiates claim
    
    ClaimPending --> ClaimPending: Multiple claims<br/>can exist
    
    ClaimPending --> Registered: Claim Rejected<br/>or Cancelled
    
    ClaimPending --> Transferred: Claim Approved<br/>Assets transferred
    
    Transferred --> [*]: Inheritance Complete
    
    note right of Unregistered
        - Safe exists on-chain
        - Not registered with Miras
        - No inheritance config
        - Standard Gnosis Safe
    end note
    
    note right of Registered
        createdAt > 0
        - Safe address stored
        - Waiting period configured
        - Attesters assigned
        - Encrypted data stored
        - Owner can update
    end note
    
    note right of ClaimPending
        - One or more claims exist
        - Attesters verifying
        - Owner can object
        - Waiting period active
    end note
    
    note right of Transferred
        - Claim approved
        - Heir has access
        - Assets transferred
        - Inheritance complete
    end note
```

**State Definitions:**

- **Unregistered**: Safe deployed but not registered with Miras
- **Registered**: Safe configuration stored on-chain, no active claims
- **ClaimPending**: One or more inheritance claims exist for this Safe
- **Transferred**: Claim approved, assets transferred to heir

**Transitions:**

- `insert()`: Register Safe with Miras, pay 0.1 ETH → **Registered**
- `update()`: Modify Safe configuration, pay 0.1 ETH → **Registered**
- `createClaim()`: Heir initiates claim → **ClaimPending**
- `setStatus(Approved)`: Treasury approves claim → **Transferred**
- `setStatus(Rejected/Cancelled)`: Treasury rejects claim → **Registered**

**Configuration Data:**

- **owner**: Address that registered the Safe
- **safe_address**: Gnosis Safe contract address
- **waiting_period**: Time before claim can be approved (e.g., 3 months)
- **death_certificate**: Boolean indicating if death certificate is required
- **attesters**: Array of 3 attester addresses
- **encryptedPhones**: Encrypted contact info for each attester
- **encryptedProtocolPhrases**: Encrypted protocol seed for each attester

---

## User Journey States

This diagram shows the overall user journey states for different user types in the Miras system.

### Asset Owner Journey

```mermaid
stateDiagram-v2
    [*] --> Visitor: Lands on Website
    
    Visitor --> Exploring: Reads Documentation<br/>Learns about Miras
    
    Exploring --> Preparing: Decides to Use Miras<br/>Acquires MRS/ETH
    
    Preparing --> CreatingSafe: Visits Launch Page<br/>Connects Wallet
    
    CreatingSafe --> SeedGeneration: Generates 3 Seeds<br/>User, Heir, Protocol
    
    SeedGeneration --> SeedVerification: Saves Seeds<br/>Takes Challenge
    
    SeedVerification --> SeedVerification: Failed Verification<br/>Try Again
    
    SeedVerification --> DeployingSafe: Passed Verification<br/>Deploys Safe
    
    DeployingSafe --> RegisteringSafe: Safe Deployed<br/>Registers with Miras
    
    RegisteringSafe --> SafeActive: Registration Complete<br/>Inheritance Configured
    
    SafeActive --> SafeActive: Updates Configuration<br/>Changes Attesters
    
    SafeActive --> Monitoring: Monitors Status<br/>Checks Claims
    
    Monitoring --> Objecting: Sees Fraudulent Claim<br/>Contacts Treasury
    
    Objecting --> SafeActive: Claim Cancelled<br/>Continues Monitoring
    
    SafeActive --> Deceased: Owner Passes Away
    
    Deceased --> [*]: Heir Inherits Assets
    
    note right of SafeActive
        - Safe deployed and registered
        - Assets stored in Safe
        - Can update configuration
        - Can monitor claims
        - Can object to fraud
    end note
```

### Heir Journey

```mermaid
stateDiagram-v2
    [*] --> Unaware: Has Heir Readiness Kit<br/>Owner Still Alive
    
    Unaware --> Notified: Owner Passes Away<br/>Learns of Inheritance
    
    Notified --> Preparing: Acquires MRS Tokens<br/>Prepares to Claim
    
    Preparing --> InitiatingClaim: Visits Claim Page<br/>Connects Wallet
    
    InitiatingClaim --> ClaimSubmitted: Submits Claim<br/>Pays 10 MRS
    
    ClaimSubmitted --> WaitingVerification: Attester Contacted<br/>Verification in Progress
    
    WaitingVerification --> ProvidingDocs: Attester Requests<br/>Death Certificate
    
    ProvidingDocs --> WaitingVerification: Submits Documents<br/>Waits for Review
    
    WaitingVerification --> ClaimApproved: Treasury Approves<br/>Verification Success
    
    WaitingVerification --> ClaimRejected: Treasury Rejects<br/>Verification Failed
    
    ClaimApproved --> AccessingSafe: Uses Key B + Key C<br/>2-of-3 Multisig
    
    AccessingSafe --> AssetsTransferred: Transfers Assets<br/>to Own Wallet
    
    AssetsTransferred --> [*]: Inheritance Complete
    
    ClaimRejected --> [*]: Claim Denied
    
    note right of ClaimSubmitted
        - Claim created on-chain
        - Status: Pending
        - Attester can view
        - Can update phone/attestor
    end note
    
    note right of ClaimApproved
        - Status: Approved
        - Can access Safe
        - Has Key B (from kit)
        - Protocol provides Key C
    end note
```

### Attester Journey

```mermaid
stateDiagram-v2
    [*] --> Visitor: Learns about Attesters
    
    Visitor --> Preparing: Decides to Register<br/>Acquires 100 MRS
    
    Preparing --> Registering: Visits Register Page<br/>Connects Wallet
    
    Registering --> KeyGeneration: Generates Keypair<br/>Public/Private
    
    KeyGeneration --> StakingTokens: Encrypts Private Key<br/>Stakes 100 MRS
    
    StakingTokens --> Active: Registration Complete<br/>Can Receive Claims
    
    Active --> ReceivingClaim: Claim Assigned<br/>Notification Received
    
    ReceivingClaim --> DecryptingClaim: Visits Track Page<br/>Decrypts with Private Key
    
    DecryptingClaim --> Verifying: Reviews Claim Details<br/>Contacts Claimer
    
    Verifying --> RequestingDocs: Requests Death Certificate<br/>Verifies Identity
    
    RequestingDocs --> Verifying: Receives Documents<br/>Continues Verification
    
    Verifying --> Recommending: Verification Complete<br/>Recommends to Treasury
    
    Recommending --> Active: Treasury Decides<br/>Attester Paid Fee
    
    Active --> Resigning: Decides to Resign<br/>Requests Resignation
    
    Resigning --> WaitingPeriod: Waiting 30 Days<br/>Cannot Receive Claims
    
    WaitingPeriod --> Withdrawn: Withdraws Stake<br/>Exits System
    
    Withdrawn --> [*]: Fully Exited
    
    Active --> Slashed: Misbehavior Detected<br/>Admin Slashes
    
    Slashed --> [*]: Permanently Penalized
    
    note right of Active
        - Can receive claims
        - Earns fees from claims
        - Can update profile
        - Can resign anytime
    end note
    
    note right of Verifying
        - Off-chain process
        - Contacts claimer
        - Reviews documents
        - Makes recommendation
    end note
```

---

## Token Flow States

This diagram shows the state transitions for MRS tokens in the system.

```mermaid
stateDiagram-v2
    [*] --> UserWallet: User Acquires MRS<br/>via Exchange
    
    UserWallet --> Approved: approve(Contract)<br/>ERC-20 Approval
    
    Approved --> AttestersContract: upsertAttester()<br/>100 MRS Staked
    
    Approved --> ClaimsContract: createClaim()<br/>10 MRS Fee
    
    AttestersContract --> AttestersContract: Held as Stake<br/>Refundable
    
    AttestersContract --> FeePool: Collected as Fee<br/>Non-refundable
    
    AttestersContract --> UserWallet: withdrawDeposit()<br/>After Resignation
    
    ClaimsContract --> FeePool: Collected as Fee<br/>Non-refundable
    
    FeePool --> TreasuryWallet: withdraw()<br/>Admin Withdraws
    
    TreasuryWallet --> [*]: Treasury Uses Funds
    
    note right of UserWallet
        - User holds MRS
        - Can approve contracts
        - Can transfer freely
    end note
    
    note right of Approved
        - Approval granted
        - Contract can spend
        - User still owns tokens
    end note
    
    note right of AttestersContract
        _feePool: Non-refundable fees
        _depositLiability: Refundable stakes
        - Tracks both separately
    end note
    
    note right of ClaimsContract
        - All fees non-refundable
        - Collected in contract
        - Treasury can withdraw
    end note
    
    note right of FeePool
        - Protocol revenue
        - Funds operations
        - Pays for infrastructure
    end note
```

**Token Flow Paths:**

1. **Attester Registration**: User → Approved → AttestersContract (100 MRS stake)
2. **Claim Creation**: User → Approved → ClaimsContract (10 MRS fee)
3. **Attester Resignation**: AttestersContract → UserWallet (refund stake)
4. **Fee Collection**: AttestersContract/ClaimsContract → FeePool → TreasuryWallet

**Key Concepts:**

- **Stake**: Refundable deposit held in AttestersV4 contract
- **Fee**: Non-refundable payment for protocol services
- **Deposit Liability**: Amount of staked tokens that must remain in contract
- **Fee Pool**: Accumulated fees available for treasury withdrawal

---

## State Transition Rules

### Claim Status Rules

| From State | To State | Trigger | Authorization | Conditions |
|------------|----------|---------|---------------|------------|
| N/A | Pending | `createClaim()` | Claimer | Pay 10 MRS fee |
| Pending | Pending | `updateEncryptedPhone()` | Claimer | Status must be Pending |
| Pending | Pending | `updateAttestor()` | Claimer | Status must be Pending |
| Pending | Approved | `setStatus(1)` | Treasury | Verification successful |
| Pending | Rejected | `setStatus(2)` | Treasury | Verification failed |
| Pending | Cancelled | `setStatus(3)` | Treasury | Owner objected or fraud |

### Attester Status Rules

| From State | To State | Trigger | Authorization | Conditions |
|------------|----------|---------|---------------|------------|
| Unregistered | Active | `upsertAttester()` | Attester | Pay 100 MRS stake |
| Active | Active | `upsertAttester()` | Attester | Update profile, pay stake |
| Active | ResignRequested | `requestResign()` | Attester | Not slashed |
| Active | Slashed | `slash(true)` | Admin | Misbehavior detected |
| ResignRequested | Active | `upsertAttester()` | Attester | Cancel resignation |
| ResignRequested | Withdrawn | `withdrawDeposit()` | Attester | Waiting period elapsed |

### Safe Configuration Rules

| From State | To State | Trigger | Authorization | Conditions |
|------------|----------|---------|---------------|------------|
| Unregistered | Registered | `insert()` | Owner | Pay 0.1 ETH fee |
| Registered | Registered | `update()` | Owner | Pay 0.1 ETH fee |
| Registered | ClaimPending | `createClaim()` | Heir | Safe must be registered |
| ClaimPending | Registered | `setStatus(2/3)` | Treasury | Claim rejected/cancelled |
| ClaimPending | Transferred | `setStatus(1)` | Treasury | Claim approved |

---

## State Invariants

### Claim Invariants

1. A claim can only be in one status at a time
2. Only Treasury can change claim status
3. Claimer can only modify Pending claims
4. Once a claim reaches a final state (Approved/Rejected/Cancelled), it cannot change

### Attester Invariants

1. An attester cannot be both Active and ResignRequested simultaneously
2. A slashed attester cannot withdraw their stake
3. Only active attesters (exists = true, isSlashed = false) can be selected by `pickAttesters()`
4. Resignation waiting period must elapse before withdrawal

### Safe Invariants

1. A Safe can only be registered once (createdAt > 0)
2. Only the owner can update Safe configuration
3. Multiple claims can exist for a single Safe
4. Safe configuration persists even after claims are resolved

### Token Invariants

1. Total contract balance ≥ deposit liability + fee pool
2. Deposit liability = sum of all refundable stakes
3. Fee pool = accumulated non-refundable fees
4. Treasury can only withdraw (balance - deposit liability)

---

## Conclusion

These state diagrams provide a comprehensive view of all stateful entities in the Miras system. Understanding these states and transitions is crucial for:

- **Developers**: Implementing correct state management logic
- **Auditors**: Verifying state transition security
- **Users**: Understanding their journey through the system
- **Operators**: Monitoring system health and detecting anomalies

Each state machine is designed with clear entry/exit conditions, authorization rules, and invariants to ensure system integrity and security.
