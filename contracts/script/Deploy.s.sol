// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import "../src/BagBazaarFactory.sol";

import { BaseScript } from "./Base.s.sol";
import { SocialDexDeployer } from "../src/BagBazaarFactory.sol";
import {LockerFactory} from "../src/LockerFactory.sol";
import {LpLocker} from "../src/LpLocker.sol";
import {console2} from "forge-std/src/console2.sol";

/// @dev See the Solidity Scripting tutorial: https://book.getfoundry.sh/tutorials/solidity-scripting
contract Deploy is BaseScript {
    function run() public broadcast returns (SocialDexDeployer factory) {

        address guy = msg.sender;

        LockerFactory lFactory = new LockerFactory();
        address weth = 0x4200000000000000000000000000000000000006;
        address uniFactory = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        address positionManager = 0xB7F724d6dDDFd008eFf5cc2834edDE5F9eF0d075;
        uint64 defaultLockingPeriod = 4132317178;
        address swapRouter = 0xd1AAE39293221B77B0C71fBD6dCb7Ea29Bb5B166;


        factory = new SocialDexDeployer(
            guy,
            weth,
            address(lFactory),
            uniFactory,
            positionManager,
            defaultLockingPeriod,
            swapRouter
        );

//        (Token token, ) = factory.deployToken(
//            "TestToken",
//            "TEST",
//            1_000 * 10 ** 18,
//            -207400,
//            10000,
//            bytes32(uint256(0xe)),
//            guy
//        );
//
//        console2.logAddress(address(token));
//        console2.logUint(token.balanceOf(guy));

    }
}
