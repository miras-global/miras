// testnet 0x4457e7ed86d8a360bce9d6098023fe7163930476
// mainnet 0x7937A695Cc89a39ef6711bb7616f5ad41e094786

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../_upgradeable.sol";

/// @notice Minimal ERC-20 interface
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/// @title FixedPriceExchange1to1
/// @notice Fixed price: 10 tokens (10**decimals units each) == 1 ether
/// @dev Deposit your token inventory into this contract address before selling.
contract ExchangeV1 is UUPSUpgradeable {
    IERC20 public token;
    uint8  public tokenDecimals;

    address public owner;
    bool private _initialized;

    event Purchased(address indexed buyer, uint256 tokenAmount, uint256 weiPaid);
    event Sold(address indexed seller, uint256 tokenAmount, uint256 weiReceived);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RescueETH(address indexed to, uint256 amount);
    event RescueToken(address indexed to, uint256 amount);

    // simple non-reentrancy
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "REENTRANCY");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        require(_initialized, "not initialized");
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier whenInitialized() {
        require(_initialized, "not initialized");
        _;
    }

    constructor() {
        _initialized = true;
    }

    function initialize(address owner_, address token_) external {
        require(!_initialized, "already initialized");
        require(owner_ != address(0), "zero owner");
        require(token_ != address(0), "zero token");

        token = IERC20(token_);
        tokenDecimals = IERC20(token_).decimals();
        owner = owner_;
        locked = false;
        _initialized = true;

        emit OwnershipTransferred(address(0), owner_);
    }

    // --------- BUY at fixed price (10 tokens == 1 ETH) ---------

    /*
    /// @notice Buy an exact token amount (in smallest units). msg.value must match the price.
    function buyExact(uint256 tokenAmount) external payable nonReentrant whenInitialized {
        require(tokenAmount > 0, "amount=0");
        uint256 requiredWei = _weiForTokenAmount(tokenAmount);
        require(msg.value == requiredWei, "wrong ETH sent");

        require(token.balanceOf(address(this)) >= tokenAmount, "insufficient inventory");
        require(token.transfer(msg.sender, tokenAmount), "token transfer failed");

        emit Purchased(msg.sender, tokenAmount, msg.value);
    }

    /// @notice Convenience: buy N whole tokens (e.g., 3 -> 3 * 10**decimals).
    function buyWhole(uint256 wholeTokens) external payable nonReentrant whenInitialized {
        require(wholeTokens > 0, "whole=0");
        uint256 tokenAmount = wholeTokens * (10 ** tokenDecimals);
        uint256 requiredWei = _weiForTokenAmount(tokenAmount);
        require(msg.value == requiredWei, "wrong ETH sent");

        require(token.balanceOf(address(this)) >= tokenAmount, "insufficient inventory");
        require(token.transfer(msg.sender, tokenAmount), "token transfer failed");

        emit Purchased(msg.sender, tokenAmount, msg.value);
    }
    */

    // --------- SELL back at fixed price (optional) ---------

    /// @notice Sell an exact token amount (in smallest units) to receive ETH at 10:1.
    /// @dev User must `approve` this contract for at least tokenAmount before calling.
    function sellExact(uint256 tokenAmount) external nonReentrant whenInitialized {
        require(tokenAmount > 0, "amount=0");
        uint256 weiOut = _weiForTokenAmount(tokenAmount);
        require(address(this).balance >= weiOut, "insufficient ETH liquidity");

        // pull tokens then pay ETH
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "pull failed");

        (bool ok, ) = payable(msg.sender).call{value: weiOut}("");
        require(ok, "ETH transfer failed");

        emit Sold(msg.sender, tokenAmount, weiOut);
    }

    // --------- Owner ops ---------

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Withdraw ETH revenue
    function withdrawETH(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "zero addr");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdraw failed");
        emit RescueETH(to, amount);
    }

    /// @notice Withdraw any ERC-20 tokens (e.g., leftover inventory)
    function withdrawToken(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "zero addr");
        require(token.transfer(to, amount), "token withdraw failed");
        emit RescueToken(to, amount);
    }

    // receive ETH only from direct sends (not counted as purchase)
    receive() external payable whenInitialized {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // --------- Internal math ---------

    /// @dev price: 10 tokens (10**decimals each) == 1 ETH
    function _weiForTokenAmount(uint256 tokenAmount) internal view returns (uint256) {
        // wei = tokenAmount * 1e18 / (10 * 10**tokenDecimals)
        return ((tokenAmount * 1 ether) / (10 ** tokenDecimals)) / 10;
    }
}
