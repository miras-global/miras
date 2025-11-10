// testnet available at 0x3F738ca6B702aacD34c71e24fd9EE296eB15cb46 (v3)
// tesnet v4 0xd40C18eFfD79d28D16ffBEbB8Cb059825376dA7D
// mainnet 0x458F7192c97CfC909F0BC323A1306F660c7E91c9

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../proxy.sol';

contract AttestersProxy is ERC1967Proxy {
    constructor(address implementation, bytes memory initData)
        ERC1967Proxy(implementation, initData)
    {}
}
