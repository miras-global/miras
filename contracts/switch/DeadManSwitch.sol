// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DeadMansSwitch
 * @notice Inheritance-style ETH vault:
 *  - Anyone can send ETH to the contract
 *  - ONLY owner activity (owner deposits OR owner ping) refreshes the 1-year timeout
 *  - Owner can withdraw at any time
 *  - Heir can withdraw ALL funds after timeout (if owner hasn't withdrawn them)
 *  - Includes reentrancy guard + 2-step owner rotation + improved events
 *
 * Key fix vs your original:
 *  - Non-owner deposits DO NOT reset the timer (prevents griefing / denial-of-inheritance).
 */
contract DeadMansSwitch {
    // -----------------------------
    // Errors (cheaper than strings)
    // -----------------------------
    error NotOwner();
    error NotHeir();
    error ZeroAddress();
    error TransferFailed();
    error InsufficientBalance();
    error NotTimedOut();
    error NoFunds();
    error NoPendingOwner();
    error NotPendingOwner();

    // -----------------------------
    // State
    // -----------------------------
    address public owner;
    address public pendingOwner;
    address public heir;

    uint256 public lastActivityTimestamp;
    uint256 public constant TIMEOUT_PERIOD = 365 days;

    // -----------------------------
    // Events (improved semantics)
    // -----------------------------
    event DepositReceived(address indexed from, uint256 amount, bytes data);
    event OwnerActivity(address indexed owner, uint256 indexed timestamp, string action);

    event OwnerWithdrawal(address indexed owner, uint256 amount);
    event HeirWithdrawal(address indexed heir, uint256 amount);

    event HeirChanged(address indexed oldHeir, address indexed newHeir);

    event OwnershipTransferStarted(address indexed previousOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCanceled(address indexed owner);

    // -----------------------------
    // Modifiers
    // -----------------------------
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyHeir() {
        if (msg.sender != heir) revert NotHeir();
        _;
    }

    // Minimal reentrancy guard (OZ-style)
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "REENTRANCY");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // -----------------------------
    // Constructor
    // -----------------------------
    constructor(address _heir) {
        if (_heir == address(0)) revert ZeroAddress();
        owner = msg.sender;
        heir = _heir;

        lastActivityTimestamp = block.timestamp;
        emit OwnerActivity(owner, lastActivityTimestamp, "deploy");
    }

    // -----------------------------
    // Receive / Fallback
    // - Accept ETH from anyone
    // - ONLY OWNER deposits refresh timer
    // -----------------------------
    receive() external payable {
        _onDeposit(msg.sender, msg.value, "");
    }

    fallback() external payable {
        _onDeposit(msg.sender, msg.value, msg.data);
    }

    function _onDeposit(address from, uint256 amount, bytes memory data) internal {
        emit DepositReceived(from, amount, data);

        // Only owner deposit counts as "activity" (prevents outsiders griefing the timer)
        if (from == owner) {
            _refreshActivity("owner-deposit");
        }
    }

    // -----------------------------
    // View helpers
    // -----------------------------
    function isTimedOut() public view returns (bool) {
        return block.timestamp >= lastActivityTimestamp + TIMEOUT_PERIOD;
    }

    function timeUntilTimeout() external view returns (uint256) {
        uint256 timeoutAt = lastActivityTimestamp + TIMEOUT_PERIOD;
        if (block.timestamp >= timeoutAt) return 0;
        return timeoutAt - block.timestamp;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // -----------------------------
    // Owner activity / configuration
    // -----------------------------
    /**
     * @notice Owner-only ping to refresh the timeout without sending ETH
     */
    function ping() external onlyOwner {
        _refreshActivity("ping");
    }

    function _refreshActivity(string memory action) internal {
        lastActivityTimestamp = block.timestamp;
        emit OwnerActivity(owner, lastActivityTimestamp, action);
    }

    /**
     * @notice Owner can change heir address
     */
    function setHeir(address newHeir) external onlyOwner {
        if (newHeir == address(0)) revert ZeroAddress();
        address oldHeir = heir;
        heir = newHeir;
        emit HeirChanged(oldHeir, newHeir);

        // treat as owner activity
        _refreshActivity("setHeir");
    }

    // -----------------------------
    // Withdrawals
    // -----------------------------
    /**
     * @notice Owner can withdraw funds at any time
     * @param amount Amount to withdraw (0 = withdraw all)
     */
    function ownerWithdraw(uint256 amount) external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        uint256 withdrawAmount = (amount == 0) ? bal : amount;
        if (withdrawAmount > bal) revert InsufficientBalance();

        (bool success, ) = payable(owner).call{value: withdrawAmount}("");
        if (!success) revert TransferFailed();

        emit OwnerWithdrawal(owner, withdrawAmount);

        // Withdrawal = strong liveness signal
        _refreshActivity("ownerWithdraw");
    }

    /**
     * @notice Heir can withdraw ALL funds after timeout
     */
    function heirWithdraw() external onlyHeir nonReentrant {
        if (!isTimedOut()) revert NotTimedOut();

        uint256 bal = address(this).balance;
        if (bal == 0) revert NoFunds();

        (bool success, ) = payable(heir).call{value: bal}("");
        if (!success) revert TransferFailed();

        emit HeirWithdrawal(heir, bal);
    }

    // -----------------------------
    // Owner rotation (2-step)
    // -----------------------------
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);

        _refreshActivity("transferOwnership-start");
    }

    function acceptOwnership() external {
        if (pendingOwner == address(0)) revert NoPendingOwner();
        if (msg.sender != pendingOwner) revert NotPendingOwner();

        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);

        emit OwnershipTransferred(oldOwner, owner);

        // New owner just proved liveness
        lastActivityTimestamp = block.timestamp;
        emit OwnerActivity(owner, lastActivityTimestamp, "transferOwnership-accept");
    }

    function cancelOwnershipTransfer() external onlyOwner {
        if (pendingOwner == address(0)) revert NoPendingOwner();
        pendingOwner = address(0);
        emit OwnershipTransferCanceled(owner);

        _refreshActivity("transferOwnership-cancel");
    }
}
