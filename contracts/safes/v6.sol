// tesnet 0xE06c6F03Eb924050e8663A36D40A42F4aCDBc886
// mainnet 0x617242104212250Bd3e3d337290b29Fe0CFA0A08

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../_upgradeable.sol";

/**
 * @title SafeTableV5 — With variable fee and encryptedPhones support + getBySafeAddress
 * @notice Fee-gated registry of "safe" rows. Anyone can insert/update rows by paying at least the configured fee per call.
 *         Collected ETH can be withdrawn only by a fixed treasury address.
 * 
 * V3 Changes vs V2:
 * - Replaced constant fee with storage variable `fee`
 * - Default fee set to 0.1 ether in `initialize`
 * - Added `setFee()` (treasury-only) and public getter via `fee` variable
 * - Added row ownership (consumes one more slot)
 * - Added `getOwner()` and `transferOwner()` (treasury-only)
 *
 * V5 Changes vs previous:
 * - `rows` mapping is now keyed by `safe_address`: `mapping(address => Row)`.
 * - Added `getBySafeAddress(address)` to fetch without owner context.
 * - Legacy functions `get(owner, safe_address)` and `hasRow(owner, safe_address)` preserve behavior by
 *   returning data only when `rows[safe_address].owner == owner`.
 */
contract SafeTableV6 is UUPSUpgradeable {
    // --- Minimal Initializable (proxy-safe) ---
    bool private _initialized;
    bool private _initializing;
    modifier initializer() {
        require(!_initialized || _initializing, "already initialized");
        bool isTopLevel = !_initializing;
        if (isTopLevel) {
            _initializing = true;
            _initialized = true;
        }
        _;
        if (isTopLevel) {
            _initializing = false;
        }
    }

    modifier whenInitialized() {
        require(_initialized && !_initializing, "not initialized");
        _;
    }

    // --- Minimal ReentrancyGuard ---
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus = _NOT_ENTERED;
    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "reentrancy");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    // --- Fee/Treasury config ---
    address public treasury;

    /// @notice Initializer to replace constructor for proxies.
    function initialize(address _treasury) public initializer {
        require(_treasury != address(0), "treasury=0");
        treasury = _treasury;
        fee = 0.1 ether;
    }

    constructor() {
        _initialized = true;
        _reentrancyStatus = _NOT_ENTERED;
    }

    struct Row {
        address owner;
        address safe_address;
        uint8 waiting_period;
        bool death_certificate;
        address[] attesters;
        string[] encryptedPhones;
        uint256 feePaid;
        uint64 createdAt;
        string[] encryptedProtocolPhrases;
    }

    // rows[safe_address] => Row
    mapping(address => Row) private rows;
    // enumeration of safes per owner
    mapping(address => address[]) private ownerSafes;

    uint256 public totalSafes;
    
    // Configurable fee
    uint256 public fee; // default 0.1 ether


    // --- Events ---
    event RowInserted(
        address indexed owner,
        address indexed safe_address,
        uint8 waiting_period,
        bool death_certificate,
        address[] attesters,
        string[] encryptedPhones,
        string[] encryptedProtocolPhrases,
        uint64 createdAt
    );
    event RowUpdated(
        address indexed owner,
        address indexed safe_address,
        uint8 waiting_period,
        bool death_certificate,
        address[] attesters,
        string[] encryptedPhones,
        string[] encryptedProtocolPhrases
    );
    event FeeCollected(address indexed payer, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);
    event FeeChanged(uint256 oldFee, uint256 newFee);

    // --- External API ---

    /// @notice Insert a new row with encrypted contact info (requires >= fee; excess kept in contract).
    function insert(
        address safe_address,
        uint8 waiting_period,
        bool death_certificate,
        address[] calldata attesters,
        string[] calldata encryptedPhones,
        string[] calldata encryptedProtocolPhrases
    ) external payable whenInitialized {
        Row storage r = rows[safe_address];
        require(r.createdAt == 0, "exists");
        require(msg.value >= fee, "fee not met");
        require(attesters.length == encryptedPhones.length, "length mismatch");

        r.owner = msg.sender;
        r.safe_address = safe_address;
        r.waiting_period = waiting_period;
        r.death_certificate = death_certificate;
        r.createdAt = uint64(block.timestamp);
        r.feePaid += msg.value;

        for (uint256 i = 0; i < attesters.length; i++) {
            r.attesters.push(attesters[i]);
            r.encryptedPhones.push(encryptedPhones[i]);
            r.encryptedProtocolPhrases.push(encryptedProtocolPhrases[i]);
        }

        ownerSafes[msg.sender].push(safe_address);

        totalSafes += 1;

        emit FeeCollected(msg.sender, msg.value);
        emit RowInserted(msg.sender, safe_address, waiting_period, death_certificate, attesters, encryptedPhones, encryptedProtocolPhrases, r.createdAt);
    }

    /// @notice Update an existing row (requires >= fee; excess kept in contract).
    function update(
        address safe_address,
        uint8 waiting_period,
        bool death_certificate,
        address[] calldata attesters,
        string[] calldata encryptedPhones,
        string[] calldata encryptedProtocolPhrases
    ) external payable whenInitialized {
        Row storage r = rows[safe_address];
        require(r.createdAt != 0, "missing");
        require(r.owner == msg.sender, "not owner");
        require(msg.value >= fee, "fee not met");
        require(attesters.length == encryptedPhones.length, "length mismatch");

        r.waiting_period = waiting_period;
        r.death_certificate = death_certificate;
        r.feePaid += msg.value;

        delete r.attesters;
        delete r.encryptedPhones;
        delete r.encryptedProtocolPhrases;
        for (uint256 i = 0; i < attesters.length; i++) {
            r.attesters.push(attesters[i]);
            r.encryptedPhones.push(encryptedPhones[i]);
            r.encryptedProtocolPhrases.push(encryptedProtocolPhrases[i]);
        }

        emit FeeCollected(msg.sender, msg.value);
        emit RowUpdated(msg.sender, safe_address, waiting_period, death_certificate, attesters, encryptedPhones, encryptedProtocolPhrases);
    }


    /// @notice New: Get a row directly by safe address.
    function get(address safe_address) external view whenInitialized returns (
        address owner,
        address _safe_address,
        uint8 waiting_period,
        bool death_certificate,
        address[] memory attesters,
        string[] memory encryptedPhones,
        string[] memory encryptedProtocolPhrases,
        uint64 createdAt
    ) {
        Row storage r = rows[safe_address];
        return (r.owner, r.safe_address, r.waiting_period, r.death_certificate, r.attesters, r.encryptedPhones, r.encryptedProtocolPhrases, r.createdAt);
    }

    /// @notice Check if an owner has a row for a given safe.
    function hasRow(address safe_address) external view whenInitialized returns (bool) {
        Row storage r = rows[safe_address];
        return r.createdAt != 0;
    }

    /// @notice List all safes registered by an owner.
    function listSafes(address owner) external view whenInitialized returns (address[] memory) {
        return ownerSafes[owner];
    }

    /// @notice Count safes registered by an owner.
    function countOwnerSafes(address owner) external view whenInitialized returns (uint256) {
        return ownerSafes[owner].length;
    }

    function countSafes() external view whenInitialized returns (uint256) {
        return totalSafes;
    }

    // --- Treasury-only config and withdrawals of native ETH ---

    modifier onlyTreasury() {
        require(_initialized && !_initializing, "not initialized");
        require(msg.sender == treasury, "not treasury");
        _;
    }

    function setTreasury(address newTreasury) external onlyTreasury {
        require(newTreasury != address(0), "treasury=0");
        emit TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setFee(uint256 newFee) external onlyTreasury {
        uint256 old = fee;
        fee = newFee;
        emit FeeChanged(old, newFee);
    }

    function withdraw(uint256 amount) external onlyTreasury nonReentrant {
        (bool ok, ) = payable(treasury).call{value: amount}("");
        require(ok, "withdraw failed");
        emit Withdrawn(treasury, amount);
    }

    function withdrawAll() external onlyTreasury nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(treasury).call{value: bal}("");
        require(ok, "withdraw failed");
        emit Withdrawn(treasury, bal);
    }

    receive() external payable whenInitialized {}

    function _authorizeUpgrade(address) internal override onlyTreasury {}

    uint256[50] private __gap;
}
