// testnet 0x44976f297eFCf57a0c96bD07704EB083EE4448fC
// new testnet 0xd2bC5499542688704930A7787e34fd3586bA3C16 - 0x354Ca87d709fBB8Afc853A7AF6EFB6C865023163
// mainnet 0xE29B5B8A909F77223133A67F4fA494DF548DF384

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../proxy.sol';

contract SafesProxy is ERC1967Proxy {
    constructor(address implementation, bytes memory initData)
        ERC1967Proxy(implementation, initData)
    {}
}
