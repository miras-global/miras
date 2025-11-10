// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MRS Votes Wrapper
/// @notice ERC-20 wrapper over an existing ERC-20 (MRS) that adds ERC20Votes-compatible governance.
/// Users deposit the underlying token to receive voting-enabled wrapped tokens 1:1 and can withdraw back.
contract VotesWrapper {
    // --- Underlying minimal interface ---
    interface IERC20Minimal {
        function name() external view returns (string memory);
        function symbol() external view returns (string memory);
        function decimals() external view returns (uint8);
        function totalSupply() external view returns (uint256);
        function balanceOf(address) external view returns (uint256);
        function transfer(address to, uint256 value) external returns (bool);
        function transferFrom(address from, address to, uint256 value) external returns (bool);
        function approve(address spender, uint256 value) external returns (bool);
        function allowance(address owner, address spender) external view returns (uint256);
    }

    // --- Metadata ---
    string public name;
    string public symbol;
    uint8 public immutable decimals;

    // --- ERC-20 state ---
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // --- Ownership (for rescue/admin if needed) ---
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    // --- Underlying ---
    IERC20Minimal public immutable underlying;

    // --- Governance/Votes (ERC20Votes-like minimal implementation) ---
    // Delegation
    mapping(address => address) public delegates; // delegator => delegatee
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    // Checkpoints
    struct Checkpoint { uint32 fromBlock; uint224 votes; }
    mapping(address => Checkpoint[]) private _checkpoints; // account vote checkpoints
    Checkpoint[] private _totalCheckpoints; // totalSupply checkpoints for voting power

    constructor(IERC20Minimal _underlying, string memory _name, string memory _symbol) {
        underlying = _underlying;
        name = _name;
        symbol = _symbol;
        decimals = _underlying.decimals();
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // --- Ownership management ---
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    // --- ERC-20 ---
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 current = allowance[from][msg.sender];
        require(current >= value, "ERC20: insufficient allowance");
        unchecked { allowance[from][msg.sender] = current - value; }
        _transfer(from, to, value);
        return true;
    }

    function increaseAllowance(address spender, uint256 added) external returns (bool) {
        uint256 newAllow = allowance[msg.sender][spender] + added;
        allowance[msg.sender][spender] = newAllow;
        emit Approval(msg.sender, spender, newAllow);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtracted) external returns (bool) {
        uint256 current = allowance[msg.sender][spender];
        require(current >= subtracted, "ERC20: below zero");
        unchecked { allowance[msg.sender][spender] = current - subtracted; }
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }

    // --- Wrap/Unwrap ---
    /// @notice Deposit underlying tokens and mint wrapped governance tokens to `to`.
    function depositFor(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "wrap: to zero");
        require(amount > 0, "wrap: zero amount");
        // Effects
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        // Votes: total supply up, move voting power to delegate of receiver if any
        _writeTotalCheckpoint(_add, amount);
        _moveVotingPower(address(0), delegates[to], amount);
        // Interactions last
        require(underlying.transferFrom(msg.sender, address(this), amount), "wrap: transferFrom failed");
        return true;
    }

    /// @notice Deposit for self.
    function deposit(uint256 amount) external returns (bool) {
        return depositFor(msg.sender, amount);
    }

    /// @notice Withdraw underlying by burning wrapped tokens from caller.
    function withdraw(uint256 amount) external returns (bool) {
        require(amount > 0, "unwrap: zero amount");
        uint256 bal = balanceOf[msg.sender];
        require(bal >= amount, "unwrap: balance too low");
        // Effects
        unchecked { balanceOf[msg.sender] = bal - amount; }
        unchecked { totalSupply -= amount; }
        emit Transfer(msg.sender, address(0), amount);
        // Votes: total supply down, move voting power away from caller's delegate
        _writeTotalCheckpoint(_subtract, amount);
        _moveVotingPower(delegates[msg.sender], address(0), amount);
        // Interactions last
        require(underlying.transfer(msg.sender, amount), "unwrap: transfer failed");
        return true;
    }

    // --- Internal transfer with votes ---
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ERC20: transfer to zero");
        uint256 bal = balanceOf[from];
        require(bal >= value, "ERC20: balance too low");
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
        _moveVotingPower(delegates[from], delegates[to], value);
    }

    // --- Governance/Votes API ---
    /// @notice Delegate votes to `delegatee`.
    function delegate(address delegatee) external {
        address current = delegates[msg.sender];
        if (current == delegatee) return;
        delegates[msg.sender] = delegatee;
        emit DelegateChanged(msg.sender, current, delegatee);
        uint256 bal = balanceOf[msg.sender];
        _moveVotingPower(current, delegatee, bal);
    }

    /// @notice Returns the current votes balance for `account`.
    function getVotes(address account) public view returns (uint256) {
        uint256 pos = _checkpoints[account].length;
        return pos == 0 ? 0 : _checkpoints[account][pos - 1].votes;
    }

    /// @notice Returns the past votes for `account` as of `blockNumber`.
    function getPastVotes(address account, uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "ERC20Votes: block not yet mined");
        return _checkpointsLookup(_checkpoints[account], blockNumber);
    }

    /// @notice Returns the past total supply of votes as of `blockNumber`.
    function getPastTotalSupply(uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "ERC20Votes: block not yet mined");
        return _checkpointsLookup(_totalCheckpoints, blockNumber);
    }

    // --- Internal vote accounting ---
    function _moveVotingPower(address src, address dst, uint256 amount) internal {
        if (amount == 0 || src == dst) return;
        if (src != address(0)) {
            (uint256 oldVal, uint256 newVal) = _writeCheckpoint(_checkpoints[src], _subtract, amount);
            emit DelegateVotesChanged(src, oldVal, newVal);
        }
        if (dst != address(0)) {
            (uint256 oldVal, uint256 newVal) = _writeCheckpoint(_checkpoints[dst], _add, amount);
            emit DelegateVotesChanged(dst, oldVal, newVal);
        }
    }

    function _writeTotalCheckpoint(function(uint256,uint256) pure returns (uint256) op, uint256 amount) internal {
        (, ) = _writeCheckpoint(_totalCheckpoints, op, amount);
    }

    function _writeCheckpoint(
        Checkpoint[] storage ckpts,
        function(uint256, uint256) pure returns (uint256) op,
        uint256 delta
    ) internal returns (uint256 oldValue, uint256 newValue) {
        uint256 pos = ckpts.length;
        oldValue = pos == 0 ? 0 : ckpts[pos - 1].votes;
        newValue = op(oldValue, delta);

        if (pos > 0 && ckpts[pos - 1].fromBlock == block.number) {
            ckpts[pos - 1].votes = uint224(newValue);
        } else {
            ckpts.push(Checkpoint({fromBlock: uint32(block.number), votes: uint224(newValue)}));
        }
    }

    function _checkpointsLookup(Checkpoint[] storage ckpts, uint256 blockNumber) internal view returns (uint256) {
        // Binary search by blockNumber
        uint256 high = ckpts.length;
        uint256 low = 0;
        while (low < high) {
            uint256 mid = (low + high) / 2;
            if (ckpts[mid].fromBlock > blockNumber) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high == 0 ? 0 : ckpts[high - 1].votes;
    }

    function _add(uint256 a, uint256 b) internal pure returns (uint256) { return a + b; }
    function _subtract(uint256 a, uint256 b) internal pure returns (uint256) { return a - b; }
}
