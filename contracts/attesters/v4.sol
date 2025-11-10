// testnet 0xdB4Efb8fa3685C62D6dF7CE3c65fc3EcD373E665
// mainnet 0xd73C60EF977D9E53afA093FA4e12569ea96833A6

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../_upgradeable.sol";

interface IERC20 {
    function decimals() external view returns (uint8);
    function balanceOf(address) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract AttestersV4 is UUPSUpgradeable {
    struct Attester {
        address wallet;
        string publicKey;
        string name;
        string meta;
        uint64 updatedAt;
        bool exists;
        bool isSlashed;
        uint256 totalFeesPaid;
        uint256 lastFeePaid;
        uint64  lastPaidAt;
        uint256 totalOverpaid;
        uint256 lastOverpaid;
    }

    uint256 private constant NAME_MAX_LEN = 128;
    uint256 private constant META_MAX_LEN = 1024;

    address private _withdrawer;
    address private _pendingAdmin;
    IERC20 public feeTokenContract;
    uint256 private _registerFee;
    bool private _initialized;

    uint256 private _feePool;
    uint256 private _overpayAndDonationPool;

    mapping(address => Attester) private attesters;
    address[] private _wallets;

    event AttesterUpserted(address indexed wallet, string publicKey, string name, string meta, uint64 updatedAt);
    event AttesterDeleted(address indexed wallet, bool stillExists);
    event AttesterSlashed(address indexed wallet, bool isSlashed);
    event FeeCollected(address indexed payer, uint256 feeAmount, uint256 overpaid);
    event DonationReceived(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount, uint256 fromFeePool, uint256 fromOverpayPool);
    event OverpayWithdrawn(address indexed to, uint256 amount);
    event RegisterFeeUpdated(uint256 oldFee, uint256 newFee);
    event AdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    uint256 private _locked; // 0 = unlocked, 1 = locked
    modifier nonReentrant() {
        require(_locked == 0, "reentrancy");
        _locked = 1;
        _;
        _locked = 0;
    }
    modifier whenInitialized() {
        require(_initialized, "not initialized");
        _;
    }
    modifier onlyAdmin() {
        require(_initialized, "not initialized");
        require(msg.sender == _withdrawer, "not admin");
        _;
    }

    mapping(address => uint64) private _resignRequestedAt;
    mapping(address => uint64) private _resignRequestedAtBlock;
    mapping(address => uint256) private _refundableDeposit;
    uint256 private _depositLiability;

    uint64 private _resignWaitSeconds;
    uint64 private _resignWaitBlocks;

    constructor() {
        _initialized = true;
    }

    function initialize(address admin, address token, uint256 fee) external {
        _initialize(admin, token, fee);
    }

    function initializeDefault(address admin, address token) external {
        _initialize(admin, token, 100 * 1e18);
    }

    function _initialize(address admin, address token, uint256 fee) internal {
        require(!_initialized, "already initialized");
        require(admin != address(0), "admin=0");
        require(token != address(0), "token=0");
        _withdrawer = admin;
        feeTokenContract = IERC20(token);
        _registerFee = fee;
        _initialized = true;
        _resignWaitSeconds = 30 days;
        _resignWaitBlocks = 0;
    }

    function _authorizeUpgrade(address) internal override onlyAdmin {}

    function feeToken() public view returns (address) { return address(feeTokenContract); }
    function registerFee() public view returns (uint256) { return _registerFee; }
    function withdrawer() public view returns (address) { return _withdrawer; }
    function pendingAdmin() public view returns (address) { return _pendingAdmin; }
    function contractTokenBalance() external view returns (uint256) { return feeTokenContract.balanceOf(address(this)); }
    function pools() external view returns (uint256 feePool, uint256 overpayAndDonationPool) { return (_feePool, _overpayAndDonationPool); }
    function depositLiability() external view returns (uint256) { return _depositLiability; }

    function feeInfo() external view returns (uint256 registerFee_, uint256 effectiveMinimum_) {
        return (_registerFee, _registerFee);
    }

    function resignationInfo(address wallet) external view returns (
        bool requested,
        uint64 requestedAt,
        uint64 readyAt,
        uint256 refundable
    ) {
        uint64 reqAt = _resignRequestedAt[wallet];
        uint64 ready = 0;
        if (reqAt > 0) {
            if (_resignWaitBlocks > 0) {
                ready = reqAt + _resignWaitSeconds;
            } else {
                ready = reqAt + _resignWaitSeconds;
            }
        }
        return (reqAt > 0, reqAt, ready, _refundableDeposit[wallet]);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "admin=0");
        _pendingAdmin = newAdmin;
        emit AdminTransferStarted(_withdrawer, newAdmin);
    }

    function acceptAdmin() external whenInitialized {
        require(msg.sender == _pendingAdmin, "not pending");
        address old = _withdrawer;
        _withdrawer = _pendingAdmin;
        _pendingAdmin = address(0);
        emit AdminTransferred(old, _withdrawer);
    }

    function setRegisterFee(uint256 newFee) external onlyAdmin {
        uint256 old = _registerFee;
        _registerFee = newFee;
        emit RegisterFeeUpdated(old, newFee);
    }

    function setResignationWait(uint64 waitSeconds, uint64 waitBlocks) external onlyAdmin {
        _resignWaitSeconds = waitSeconds;
        _resignWaitBlocks = waitBlocks;
    }

    function slash(address wallet, bool slashed) external onlyAdmin {
        Attester storage a = attesters[wallet];
        require(a.exists || _resignRequestedAt[wallet] != 0 || a.wallet == wallet, "not found");
        a.isSlashed = slashed;
        a.updatedAt = uint64(block.timestamp);
        emit AttesterSlashed(wallet, slashed);
    }

    function upsertAttester(
        string calldata publicKey,
        string calldata name,
        string calldata meta,
        uint256 amount
    ) external nonReentrant whenInitialized {
        uint256 fee = _registerFee;
        require(amount >= fee, "fee too low");
        require(bytes(name).length <= NAME_MAX_LEN, "name too long");
        require(bytes(meta).length <= META_MAX_LEN, "meta too long");
        require(feeTokenContract.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        uint256 overpaid = amount - fee;
        Attester storage a = attesters[msg.sender];
        bool firstTime = !a.exists && _resignRequestedAt[msg.sender] == 0 && a.wallet == address(0);
        a.wallet = msg.sender;
        a.publicKey = publicKey;
        a.name = name;
        a.meta = meta;
        a.updatedAt = uint64(block.timestamp);
        a.exists = true;
        if (firstTime) { _wallets.push(msg.sender); }
        a.totalFeesPaid += fee;
        a.lastFeePaid = fee;
        a.lastPaidAt = uint64(block.timestamp);
        a.totalOverpaid += overpaid;
        a.lastOverpaid = overpaid;
        _feePool += fee;
        _overpayAndDonationPool += overpaid;
        uint256 oldDep = _refundableDeposit[msg.sender];
        if (oldDep != fee) {
            if (oldDep > 0) { _depositLiability -= oldDep; }
            _refundableDeposit[msg.sender] = fee;
            _depositLiability += fee;
        }
        if (_resignRequestedAt[msg.sender] != 0) {
            _resignRequestedAt[msg.sender] = 0;
        }
        emit FeeCollected(msg.sender, fee, overpaid);
        emit AttesterUpserted(msg.sender, publicKey, name, meta, a.updatedAt);
    }

    function requestResign() external whenInitialized {
        Attester storage a = attesters[msg.sender];
        require(a.exists, "not active");
        require(!_isSlashed(msg.sender), "slashed");
        a.exists = false;
        a.updatedAt = uint64(block.timestamp);
        _resignRequestedAt[msg.sender] = uint64(block.timestamp);
        _resignRequestedAtBlock[msg.sender] = uint64(block.number);
        emit AttesterDeleted(msg.sender, a.exists);
    }

    function withdrawDeposit() external nonReentrant whenInitialized {
        uint256 amount = _refundableDeposit[msg.sender];
        require(amount > 0, "no deposit");
        require(!_isSlashed(msg.sender), "slashed");
        uint64 reqAt = _resignRequestedAt[msg.sender];
        require(reqAt > 0, "no resign req");
        if (_resignWaitBlocks > 0) {
            uint64 reqBlock = _resignRequestedAtBlock[msg.sender];
            require(reqBlock > 0, "no resign block");
            require(block.number >= uint256(reqBlock) + uint256(_resignWaitBlocks), "wait blocks");
        } else {
            require(block.timestamp >= uint256(reqAt) + uint256(_resignWaitSeconds), "wait time");
        }
        _refundableDeposit[msg.sender] = 0;
        _resignRequestedAt[msg.sender] = 0;
        _resignRequestedAtBlock[msg.sender] = 0;
        _depositLiability -= amount;
        require(feeTokenContract.transfer(msg.sender, amount), "transfer failed");
    }

    function deleteSelf() external whenInitialized {
        Attester storage a = attesters[msg.sender];
        require(a.exists, "not found");
        a.exists = false;
        a.updatedAt = uint64(block.timestamp);
        emit AttesterDeleted(msg.sender, a.exists);
    }

    function getAttester(address wallet)
        external
        view
        whenInitialized
        returns (
            address,
            string memory,
            string memory,
            string memory,
            uint64,
            bool,
            bool,
            uint256,
            uint256,
            uint64,
            uint256,
            uint256
        )
    {
        Attester storage a = attesters[wallet];
        return (
            a.wallet,
            a.publicKey,
            a.name,
            a.meta,
            a.updatedAt,
            a.exists,
            a.isSlashed,
            a.totalFeesPaid,
            a.lastFeePaid,
            a.lastPaidAt,
            a.totalOverpaid,
            a.lastOverpaid
        );
    }

    function getAttesters(uint256 offset, uint256 max)
        external
        view
        whenInitialized
        returns (
            address[] memory wallets,
            string[] memory publicKeys,
            string[] memory names,
            string[] memory metas,
            uint64[] memory updatedAts,
            bool[] memory existences,
            bool[] memory slashed
        )
    {
        uint256 n = _wallets.length;
        if (offset > n) offset = n;
        uint256 end = offset + max;
        if (end > n) end = n;
        uint256 count = end > offset ? (end - offset) : 0;

        wallets = new address[](count);
        publicKeys = new string[](count);
        names = new string[](count);
        metas = new string[](count);
        updatedAts = new uint64[](count);
        existences = new bool[](count);
        slashed = new bool[](count);

        for (uint256 i = 0; i < count; i++) {
            address w = _wallets[offset + i];
            Attester storage a = attesters[w];
            wallets[i] = a.wallet;
            publicKeys[i] = a.publicKey;
            names[i] = a.name;
            metas[i] = a.meta;
            updatedAts[i] = a.updatedAt;
            existences[i] = a.exists;
            slashed[i] = a.isSlashed;
        }
    }

    function pickAttesters(uint256 num) public view whenInitialized returns (address[] memory picked) {
        uint256 total = _wallets.length;
        uint256 lActiveCount = 0;
        for (uint256 i = 0; i < total; i++) {
            if (attesters[_wallets[i]].exists) lActiveCount++;
        }
        if (lActiveCount == 0) return new address[](0);
        if (num > lActiveCount) num = lActiveCount;

        address[] memory active = new address[](lActiveCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; i++) {
            address w = _wallets[i];
            if (attesters[w].exists) active[idx++] = w;
        }

        picked = new address[](num);
        uint256[] memory indices = new uint256[](lActiveCount);
        for (uint256 i = 0; i < lActiveCount; i++) indices[i] = i;
        uint256 rand = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, lActiveCount)));
        for (uint256 i = 0; i < num; i++) {
            rand = uint256(keccak256(abi.encodePacked(rand, i)));
            uint256 j = i + (rand % (lActiveCount - i));
            (indices[i], indices[j]) = (indices[j], indices[i]);
            picked[i] = active[indices[i]];
        }
    }

    function pickAttesters() external view whenInitialized returns (address[] memory) {
        return pickAttesters(3);
    }

    function attesterCount() external view whenInitialized returns (uint256) { return _wallets.length; }

    function activeCount() public view whenInitialized returns (uint256) {
        uint256 total = _wallets.length;
        uint256 active = 0;
        for (uint256 i = 0; i < total; i++) if (attesters[_wallets[i]].exists) active++;
        return active;
    }

    function getActiveAttesters(uint256 offset, uint256 max)
        external
        view
        whenInitialized
        returns (
            address[] memory wallets,
            string[] memory publicKeys,
            string[] memory names,
            string[] memory metas,
            uint64[] memory updatedAts,
            bool[] memory slashed
        )
    {
        uint256 total = _wallets.length;
        if (max == 0) {
            return (new address[](0), new string[](0), new string[](0), new string[](0), new uint64[](0), new bool[](0));
        }

        wallets = new address[](max);
        publicKeys = new string[](max);
        names = new string[](max);
        metas = new string[](max);
        updatedAts = new uint64[](max);
        slashed = new bool[](max);

        uint256 collected = 0;
        uint256 seen = 0;
        for (uint256 i = 0; i < total; i++) {
            address w = _wallets[i];
            Attester storage a = attesters[w];
            if (!a.exists) continue;
            if (seen < offset) { unchecked { ++seen; } continue; }
            if (collected == max) break;
            wallets[collected] = a.wallet;
            publicKeys[collected] = a.publicKey;
            names[collected] = a.name;
            metas[collected] = a.meta;
            updatedAts[collected] = a.updatedAt;
            slashed[collected] = a.isSlashed;
            unchecked { ++collected; }
        }

        assembly {
            mstore(wallets, collected)
            mstore(publicKeys, collected)
            mstore(names, collected)
            mstore(metas, collected)
            mstore(updatedAts, collected)
            mstore(slashed, collected)
        }
    }

    function withdraw(uint256 amount) external onlyAdmin nonReentrant {
        uint256 bal = feeTokenContract.balanceOf(address(this));
        require(bal >= amount, "insufficient balance");
        uint256 available = bal > _depositLiability ? (bal - _depositLiability) : 0;
        require(available >= amount, "exceeds available");
        uint256 fromOverpay = amount <= _overpayAndDonationPool ? amount : _overpayAndDonationPool;
        uint256 fromFee = amount - fromOverpay;
        if (fromOverpay > 0) _overpayAndDonationPool -= fromOverpay;
        if (fromFee > 0) {
            require(_feePool >= fromFee, "fee pool short");
            _feePool -= fromFee;
        }
        require(feeTokenContract.transfer(_withdrawer, amount), "transfer failed");
        emit Withdrawn(_withdrawer, amount, fromFee, fromOverpay);
    }

    function withdrawOverpay(uint256 amount) external onlyAdmin nonReentrant {
        uint256 bal = feeTokenContract.balanceOf(address(this));
        uint256 available = bal > _depositLiability ? (bal - _depositLiability) : 0;
        require(amount <= _overpayAndDonationPool, "overpay pool short");
        require(amount <= available, "exceeds available");
        _overpayAndDonationPool -= amount;
        require(feeTokenContract.transfer(_withdrawer, amount), "transfer failed");
        emit OverpayWithdrawn(_withdrawer, amount);
    }

    function withdrawAll() external onlyAdmin nonReentrant {
        uint256 bal = feeTokenContract.balanceOf(address(this));
        require(bal > 0, "no balance");
        uint256 available = bal > _depositLiability ? (bal - _depositLiability) : 0;
        require(available > 0, "no available");
        uint256 fromOverpay = _overpayAndDonationPool <= available ? _overpayAndDonationPool : available;
        uint256 remaining = available - fromOverpay;
        uint256 fromFee = remaining;
        if (fromFee > _feePool) { fromFee = _feePool; fromOverpay = available - fromFee; }
        _overpayAndDonationPool -= fromOverpay;
        _feePool -= fromFee;
        require(feeTokenContract.transfer(_withdrawer, fromOverpay + fromFee), "transfer failed");
        emit Withdrawn(_withdrawer, fromOverpay + fromFee, fromFee, fromOverpay);
    }

    function donate(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        require(feeTokenContract.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        _overpayAndDonationPool += amount;
        emit DonationReceived(msg.sender, amount);
    }

    function _isSlashed(address wallet) internal view returns (bool) {
        return attesters[wallet].isSlashed;
    }
}
