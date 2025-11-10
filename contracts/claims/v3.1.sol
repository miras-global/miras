// tesnet 0x7010996c5638C3b557cA1B7f69AD18991821eA82 (v1)
// tesnet v2 0xAb9F4f36897d108ffc89aaDDc4B06928edAf1c75 (v2)
// tesnet v3 0x21952de9a37BA2fD014E36f553C42Df208db1818 (v3)
// testnet v3.1 0x81bE3f271eF26CE80835A5B335a3aAA6C84a7418 (v3.1)
// mainnet 0xCBED2362c00587720aC216C37E4b62bCAB2F53E1
// mainnet 3.1  0x5765E649f65945AbcE706e56788c68A7652Cd8Aa

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../_upgradeable.sol";

    // --- Minimal ERC20 interface ---
    interface IERC20 {
        function decimals() external view returns (uint8);
        function balanceOf(address) external view returns (uint256);
        function allowance(address owner, address spender) external view returns (uint256);
        function transfer(address to, uint256 value) external returns (bool);
        function transferFrom(address from, address to, uint256 value) external returns (bool);
    }

/// @title ClaimsDB V2 — ERC20 fee (default 10 tokens) instead of 1 ETH (UUPS)
/// @notice Mirrors v1 features but collects an ERC-20 token as the creation fee.
/// @dev Hardened for fee-on-transfer tokens (balance-delta), tolerant ERC-20 calls, and reentrancy-guarded.
///      `initializeDefault` derives the default fee from token decimals (falls back to 18).
/*
 * @changelog
 * - v2: ERC20 fee (10 tokens by default not 1 ether) + Slashing (UUPS)
 *
 * - v3: encrypts safe address
 */
contract ClaimsDBV3_1 is UUPSUpgradeable {


    // --- Data model (same as v1) ---
    enum Status { Pending, Approved, Rejected, Cancelled }

    struct Claim {
        address claimer;         // who created the claim (payer)
        string  encryptedSafe;   // encrypted safe identifier (replaces address safe)
        address attestor;        // designated attestor
        string  encryptedPhone;  // encrypted phone blob (e.g., ciphertext)
        uint64  createdAt;       // timestamp at creation
        Status  status;          // current status
    }

    // --- Config / admin ---
    address public treasury;               // admin/withdrawer (same role as v1)
    IERC20  public feeToken;               // ERC-20 used for fee (e.g., MRS)
    uint256 public registerFee;            // fee in token units (e.g., 10 * 10**decimals)
    bool    private _initialized;

    // --- Storage ---
    uint256 public nextId;                 // auto-incremented claim id
    mapping(uint256 => Claim) private claims;
    uint256[] public ids;                  // optional enumeration

    // --- Reentrancy guard ---
    uint256 private _entered;              // 0 = unlocked, 1 = locked
    modifier nonReentrant() {
        require(_entered == 0, "reentrancy");
        _entered = 1;
        _;
        _entered = 0;
    }

    modifier whenInitialized() {
        require(_initialized, "not initialized");
        _;
    }

    modifier onlyTreasury() {
        require(_initialized, "not initialized");
        require(msg.sender == treasury, "not treasury");
        _;
    }

    // --- Events (aligned with v1 updated events) ---
    event ClaimCreated(
        uint256 indexed id,
        address indexed claimer,
        string encryptedSafe,
        address attestor,
        string encryptedPhone,
        uint64 createdAt
    );
    event StatusChanged(uint256 indexed id, Status fromStatus, Status toStatus);
    event PhoneUpdated(uint256 indexed id, string oldEncryptedPhone, string newEncryptedPhone);
    event AttestorUpdated(uint256 indexed id, address oldAttestor, address newAttestor);
    event Withdrawn(address indexed to, uint256 amount);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);
    event RegisterFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeReceived(address indexed payer, uint256 amount);

    // --- Constructor ---
    constructor() {
        _initialized = true; // lock the implementation
    }

    // --- Initializers ---
    /// @notice Initialize with explicit fee value (token units)
    function initialize(address _treasury, address _feeToken, uint256 _fee) external {
        _initialize(_treasury, _feeToken, _fee);
    }

    /// @notice Initialize with default fee of "10 tokens", respecting token decimals (fallback = 18)
    function initializeDefault(address _treasury, address _feeToken) external {
        uint256 fee;
        // Best-effort decimals read; default to 18 on failure
        try IERC20(_feeToken).decimals() returns (uint8 dec) {
            fee = 10 * (10 ** dec);
        } catch {
            fee = 10 * 1e18;
        }
        _initialize(_treasury, _feeToken, fee);
    }

    function _initialize(address _treasury, address _feeToken, uint256 _fee) internal {
        require(!_initialized, "already initialized");
        require(_treasury != address(0), "treasury=0");
        require(_feeToken != address(0), "token=0");
        treasury = _treasury;
        feeToken = IERC20(_feeToken);
        registerFee = _fee;
        _entered = 0;
        _initialized = true;
    }

    // --- Core: create a claim by paying token fee ---
    /// @param encryptedSafe Encrypted safe identifier (required)
    /// @param attestor Designated attestor (required)
    /// @param encryptedPhone Opaque encrypted blob
    /// @param amount Amount of tokens to attempt to pay (must result in received >= registerFee)
    function createClaim(
        string calldata encryptedSafe,
        address attestor,
        string calldata encryptedPhone,
        uint256 amount
    ) external whenInitialized nonReentrant returns (uint256 id) {
        require(amount > 0, "amount=0");
        //require(bytes(encryptedSafe).length > 0, "encryptedSafe=empty");
        require(attestor != address(0), "attestor=0");

        // Pull tokens; verify actual amount received against registerFee (handles fee-on-transfer)
        uint256 received = _pullReceived(feeToken, msg.sender, amount);
        require(received >= registerFee, "fee too low");

        unchecked { id = ++nextId; }
        Claim storage c = claims[id];
        c.claimer = msg.sender;
        c.encryptedSafe = encryptedSafe;    
        c.attestor = attestor;
        c.encryptedPhone = encryptedPhone;
        c.createdAt = uint64(block.timestamp);
        c.status = Status.Pending;

        ids.push(id);

        emit ClaimCreated(id, msg.sender, encryptedSafe, attestor, encryptedPhone, c.createdAt);
        emit FeeReceived(msg.sender, received);
    }

    // --- Admin (treasury) can change status ---
    function setStatus(uint256 id, Status newStatus) external onlyTreasury {
        Claim storage c = _mustGet(id);
        Status old = c.status;
        if (old != newStatus) {
            c.status = newStatus;
            emit StatusChanged(id, old, newStatus);
        }
    }

    /// @notice Change the treasury address. Only current treasury may call.
    function setTreasury(address newTreasury) external onlyTreasury {
        require(newTreasury != address(0), "treasury=0");
        address old = treasury;
        treasury = newTreasury;
        emit TreasuryChanged(old, newTreasury);
    }

    /// @notice Update the register fee amount (token units). Only treasury may call.
    function setRegisterFee(uint256 newFee) external onlyTreasury {
        uint256 old = registerFee;
        registerFee = newFee;
        emit RegisterFeeUpdated(old, newFee);
    }

    // --- Claimer can update encrypted phone & attestor while Pending ---
    function updateEncryptedPhone(uint256 id, string calldata newEncryptedPhone) external whenInitialized {
        Claim storage c = _mustGet(id);
        require(msg.sender == c.claimer, "not claimer");
        require(c.status == Status.Pending, "locked");
        string memory old = c.encryptedPhone;
        c.encryptedPhone = newEncryptedPhone;
        emit PhoneUpdated(id, old, newEncryptedPhone);
    }

    function updateAttestor(uint256 id, address newAttestor) external whenInitialized {
        require(newAttestor != address(0), "attestor=0");
        Claim storage c = _mustGet(id);
        require(msg.sender == c.claimer, "not claimer");
        require(c.status == Status.Pending, "locked");
        address old = c.attestor;
        c.attestor = newAttestor;
        emit AttestorUpdated(id, old, newAttestor);
    }

    // --- Views ---

function getClaimsByAttester(address _attestor)
    external
    view
    whenInitialized
    returns (
        uint256[] memory outIds,
        address[] memory claimers,
        string[] memory encryptedSafes,
        address[] memory attestors,
        string[] memory encryptedPhones,
        uint64[] memory createdAts,
        Status[] memory statuses
    )
{
    // First pass: count matches
    uint256 count = 0;
    for (uint256 i = 0; i < ids.length; i++) {
        if (claims[ids[i]].attestor == _attestor) {
            unchecked { count++; }
        }
    }

    // Allocate outputs
    outIds = new uint256[](count);
    claimers = new address[](count);
    encryptedSafes = new string[](count);
    attestors = new address[](count);
    encryptedPhones = new string[](count);
    createdAts = new uint64[](count);
    statuses = new Status[](count);

    if (count == 0) {
        return (outIds, claimers, encryptedSafes, attestors, encryptedPhones, createdAts, statuses);
    }

    // Second pass: fill arrays (newest first)
    uint256 idx = 0;
    for (uint256 i = ids.length; i > 0; i--) {
        uint256 id = ids[i - 1];
        Claim storage c = claims[id];
        if (c.attestor == _attestor) {
            outIds[idx] = id;
            claimers[idx] = c.claimer;
            encryptedSafes[idx] = c.encryptedSafe;
            attestors[idx] = c.attestor;
            encryptedPhones[idx] = c.encryptedPhone;
            createdAts[idx] = c.createdAt;
            statuses[idx] = c.status;
            unchecked { idx++; }
            if (idx == count) break;
        }
    }

    return (outIds, claimers, encryptedSafes, attestors, encryptedPhones, createdAts, statuses);
}

    function idsLength() external view whenInitialized returns (uint256) {
        return ids.length;
    }

    // --- Treasury-only withdrawals of collected fee tokens ---
    function withdrawTokens(uint256 amount) external onlyTreasury nonReentrant {
        require(amount > 0, "amount=0");
        require(feeToken.balanceOf(address(this)) >= amount, "insufficient balance");
        require(_safeTransfer(feeToken, treasury, amount), "withdraw failed");
        emit Withdrawn(treasury, amount);
    }

    function withdrawAllTokens() external onlyTreasury nonReentrant {
        uint256 bal = feeToken.balanceOf(address(this));
        if (bal == 0) return;
        require(_safeTransfer(feeToken, treasury, bal), "withdraw failed");
        emit Withdrawn(treasury, bal);
    }

    // --- internal ---
    function _authorizeUpgrade(address) internal override onlyTreasury {}

    function _mustGet(uint256 id) internal view returns (Claim storage c) {
        c = claims[id];
        require(c.createdAt != 0, "claim not found");
    }

    // --- Internal helpers ---
    // Accept both no-return and bool-return ERC-20s; bubble up reverts.
    function _safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        require(ok, "transferFrom revert");
        return (data.length == 0) || abi.decode(data, (bool));
    }

    function _safeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(ok, "transfer revert");
        return (data.length == 0) || abi.decode(data, (bool));
    }

    /// @notice Pull tokens and return the actual amount received (handles fee-on-transfer).
    function _pullReceived(IERC20 token, address from, uint256 requested) internal returns (uint256 received) {
        uint256 beforeBal = token.balanceOf(address(this));
        require(_safeTransferFrom(token, from, address(this), requested), "transferFrom failed");
        unchecked {
            received = token.balanceOf(address(this)) - beforeBal;
        }
        require(received > 0, "nothing received");
    }
}
