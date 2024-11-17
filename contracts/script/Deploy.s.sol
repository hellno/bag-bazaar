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
        address weth = 0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8;
        address uniFactory = 0x0d922Fb1Bc191F64970ac40376643808b4B74Df9;
        address positionManager = 0x5911cB3633e764939edc2d92b7e1ad375Bb57649;
        uint64 defaultLockingPeriod = 4132317178;
        address swapRouter = 0x738fD6d10bCc05c230388B4027CAd37f82fe2AF2;


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
