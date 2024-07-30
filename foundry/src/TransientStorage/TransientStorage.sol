// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract TransientStorage {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;
    error ReentrancyGuardReentrantCall();

    modifier nonReentrant1() {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    modifier nonReentrant2() {
        assembly {
            if tload(0) { revert(0, 0) }
            tstore(0, 1)
        }
        _;
        assembly {
            tstore(0, 0)
        }
    }

    function test_gas_1() external nonReentrant1 {}
    function test_gas_2() external nonReentrant2 {}
}