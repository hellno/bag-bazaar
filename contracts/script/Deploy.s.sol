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

        address guy = 0x5423d9035f6EF88206E7d3d05423b655f29f9Db3;

        LockerFactory lFactory = new LockerFactory();
        address weth = 0x4200000000000000000000000000000000000006;
        address uniFactory = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
        address positionManager = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
        uint64 defaultLockingPeriod = 4132317178;
        address swapRouter = 0x2626664c2603336E57B271c5C0b26F421741e481;


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
