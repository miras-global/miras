// testnet 0x75378e8a880007136c6C6C179158cc4b348ea89f
// mainnet 0x17df63dA8E4e42e9636C00d9C18EC0F0A10dA4Da
/*
 call
web3.eth.abi.encodeFunctionCall(
  {
    name: "initialize",
    type: "function",
    inputs: [
      { type: "address", name: "owner_" },
      { type: "address", name: "token_" }
    ]
  },
  ["0xA2582E07D5883f867810e558553d880578a3b233", "0xb1d080F4F56A6ef848cDfacD7B125ac50B0D2ced"]
) 
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../proxy.sol';

contract ExchangeProxy is ERC1967Proxy {
    constructor(address implementation, bytes memory initData)
        ERC1967Proxy(implementation, initData)
    {}
}
