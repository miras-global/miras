// testnet 0xEc29414ABc3868954DE8cd450ed4635A6229BbBd
// testnet v2 0xc9a15ECc6AB6dA17E8EaF9177d31Ef55b0a50Ede
// mainnet 0xCE7E31048c7e6554A4A73fFa6E7f7748934571De -- deprecated
// mainnet 0x6eED1ce777F9ab8a75245D6538640Ab71B27C106

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../proxy.sol';

contract ClaimsProxy is ERC1967Proxy {
    constructor(address implementation, bytes memory initData)
        ERC1967Proxy(implementation, initData)
    {}
}
