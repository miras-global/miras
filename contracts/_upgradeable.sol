// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/* -------------------------------------------------------------------------- */
/*                          UUPS Base (upgrade logic)                         */
/* -------------------------------------------------------------------------- */
abstract contract UUPSUpgradeable {
    bytes32 private constant IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    function upgradeTo(address newImplementation) external virtual {
        _authorizeUpgrade(newImplementation);
        _setImplementation(newImplementation);
    }

    function _setImplementation(address newImpl) internal {
        require(newImpl != address(0), "bad impl");
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImpl)
        }
    }

    function _authorizeUpgrade(address newImplementation) internal virtual;
}