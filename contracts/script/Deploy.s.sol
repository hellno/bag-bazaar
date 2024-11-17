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
        address weth = 0x9661Ad5FAE2e37B5fe636499659225F5D18Ddc5e;
        address uniFactory = 0x8520a30af22d6599aD863e1264f3553b42A33BDC;
        address positionManager = 0x1De430dbD59783390dab0BDDfACA23A0E1B23c67;
        uint64 defaultLockingPeriod = 4132317178;
        address swapRouter = 0x55cDd9462ac2F63806854Ff4C82D15F533cbDC28;


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
