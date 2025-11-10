// testnet 0xb1d080F4F56A6ef848cDfacD7B125ac50B0D2ced
// mainnet 0x95324aE4b5D91C7444868228E10fAa7Fa9Fbe48a

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MRS (MRS)
 * @notice Minimal ERC-20 token with owner-controlled mint, optional burn, and EIP-2612 permit support.
 *
 * Key properties:
 * - Standard ERC-20 semantics (no fee-on-transfer, no rebasing).
 * - Owner can mint arbitrarily until an optional one-time supply cap is set with `setCap()`.
 *   After cap is set, total supply cannot exceed it.
 * - Supports EIP-2612 `permit` for gasless approvals.
 * - Includes allowance helpers `increaseAllowance` and `decreaseAllowance`.
 * - Holders can burn their own tokens to reduce `totalSupply`.
 *
 * Important notes / caveats:
 * - **Fee-on-transfer tokens**: This token itself is NOT fee-on-transfer.
 *   Contracts integrating arbitrary ERC-20s should still use a balance-delta
 *   pattern to protect against fee-on-transfer tokens elsewhere.
 *
 * - **Rebasing tokens**: Not supported. Balances remain fixed except by transfer,
 *   mint, or burn.
 *
 * - **Cap semantics**: Until `setCap()` is called, supply is uncapped.
 *   The owner can mint freely before the cap is set.
 *   Once set, the cap is permanent and enforced on further mints.
 *
 * - **Ownership events**: Ownership can be transferred or renounced.
 *   After renounce, no further minting is possible.
 *
 * - **Allowance UX**: Like standard ERC-20, `approve()` can be front-run if changed
 *   from one nonzero value to another. Use `permit`, `increaseAllowance`, or
 *   `decreaseAllowance` where possible.
 *
 */
contract MRS {
    // Metadata
    string public constant name = "Miras";
    string public constant symbol = "MRS";
    uint8 public immutable decimals = 18;

    // Supply
    uint256 public totalSupply;
    uint256 public cap = 0; // 0 means "no cap"

    // Ownership (simple access control)
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ERC-20 storage
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ERC-20 events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event CapSet(uint256 indexed oldCap, uint256 indexed newCap);

    // --- ERC-2612 Permit (EIP-2612) ---
    mapping(address => uint256) public nonces;
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 private constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );
    bytes32 private constant _HASHED_VERSION = keccak256(bytes("1"));
    bytes32 private immutable _HASHED_NAME;
    uint256 private immutable _INITIAL_CHAIN_ID;
    bytes32 private immutable _INITIAL_DOMAIN_SEPARATOR;

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    /// @param _initialSupply Whole tokens to mint to deployer (pre-decimals)
    constructor(
        uint256 _initialSupply
    ) {

        _HASHED_NAME = keccak256(bytes(name));
        _INITIAL_CHAIN_ID = block.chainid;
        _INITIAL_DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                _HASHED_NAME,
                _HASHED_VERSION,
                block.chainid,
                address(this)
            )
        );

        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);

        uint256 initial = _initialSupply * (10 ** decimals);
        totalSupply = initial;

        balanceOf[msg.sender] = initial;
        emit Transfer(address(0), msg.sender, initial);
    }

    function setCap(uint256 _cap) external onlyOwner {
        require(cap == 0, "Cap: can be set only once");
        require(_cap > 0, "Cap: must be greater than 0");
        require(_cap >= totalSupply, "Cap: must be greater than or equal to total supply");
        uint256 old = cap;
        cap = _cap;
        emit CapSet(old, _cap);
    }

    // --- Ownership management ---
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: zero address");
        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }

    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    // --- ERC-20 ---
    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 current = allowance[from][msg.sender];
        require(current >= value, "ERC20: insufficient allowance");
        unchecked { 
            allowance[from][msg.sender] = current - value; 
        }
        emit Approval(from, msg.sender, allowance[from][msg.sender]);
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

    /// @notice Set allowance via EIP-2612 permit
    /// @dev See https://eips.ethereum.org/EIPS/eip-2612
    function permit(
    address owner_,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external {
    require(block.timestamp <= deadline, "Permit: expired deadline");
    require(owner_ != address(0), "Permit: owner zero");

    // ECDSA malleability checks
    require(v == 27 || v == 28, "Permit: invalid v");
    require(uint256(s) <= 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0, "Permit: invalid s");

    uint256 current = nonces[owner_];
    bytes32 digest = keccak256(
        abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR(),
            keccak256(abi.encode(
                PERMIT_TYPEHASH,
                owner_,
                spender,
                value,
                current,
                deadline
            ))
        )
    );

    address recovered = ecrecover(digest, v, r, s);
    require(recovered != address(0) && recovered == owner_, "Permit: invalid signature");

    nonces[owner_] = current + 1; // increment after verification
    allowance[owner_][spender] = value;
    emit Approval(owner_, spender, value);
}

    /// @notice EIP-712 domain separator (recomputes if chainid changed)
    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        if (block.chainid == _INITIAL_CHAIN_ID) {
            return _INITIAL_DOMAIN_SEPARATOR;
        }
        return keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                _HASHED_NAME,
                _HASHED_VERSION,
                block.chainid,
                address(this)
            )
        );
    }

    /// @notice Allow holders to burn their tokens (reduces totalSupply)
    function burn(uint256 value) external returns (bool) {
        uint256 bal = balanceOf[msg.sender];
        require(bal >= value, "ERC20: burn exceeds balance");
        unchecked {
            balanceOf[msg.sender] = bal - value;
            totalSupply -= value;
        }
        emit Transfer(msg.sender, address(0), value);
        return true;
    }

    /// @notice Mint new tokens to `to`. Only owner can call.
    /// @dev Respects `cap` if set (cap == 0 means uncapped).
    function mint(address to, uint256 value) external onlyOwner returns (bool) {
        require(to != address(0), "ERC20: mint to zero");
        if (cap != 0) {
            require(totalSupply + value <= cap, "Cap: mint exceeds cap");
        }
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
        return true;
    }

    // Internal transfer with basic checks
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ERC20: transfer to zero");
        uint256 bal = balanceOf[from];
        require(bal >= value, "ERC20: balance too low");
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}
