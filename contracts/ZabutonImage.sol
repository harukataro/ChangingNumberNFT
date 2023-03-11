// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./IZabuton.sol";

contract ZabutonImage is IZabuton {
    function getImage(uint256 num) public pure returns (string memory) {
        string
            memory zabuton = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1080 1080"><defs><g id="a"><path fill="#9df6a0" d="m486 487-41 2 57 6h27l-10-4 21-1 23-4 53-4h37l-19-2h-38l-23 2h-3l-10 1-4 1-16 3h-11l-58-6-23-2-36 4 74 4z"/><path fill="#57d75f" d="M911 561h26l-2-2h-21l-19-10-2-1-18-19h-1l-41-10-17-5-13-3-24-6-67-16-26-3-33-4h-37l-53 4-23 4-21 1 10 4h-27l-57-6 41-2-74-4 36-4-12-1-46 4-26 2-25 2-17 1-45 16-16 6-15 5-79 39-9 3-8 3-4 1h13l9-2 19-5 11-1 14-1 7 7 2-8 10-3 31 1 23-3 8 5h1l4-13 1 3 3 8 2-5 22 5 30-4 24-4h1l12 2h11l12-2 12 5h26l3 6 22-1 8-4 3-1 33 1 10 12-8-17 1 1 8 4h5l10-6 18 4 6-4h1l19 11 1-1 13-10 18 11 1 1h11l-5-4h14l1-3h8l17-5 15-3 23 6 7 21 29-20h-6l28 2 16 1 18-2h2l22 7h2l32 4-13-6 2 1 11 5h4l20-1 1 5 13-2-12-3 2 1 23 5z"/><path fill="#3dae28" d="M937 561h-26l-13-3-13 2-1-5-24 1-32-4-9-3-15-4-20 2-7-1-31-2-29 20-7-21-23-6h-1l-14 3-17 5h-8l-1 3h-14l5 4h-11l-19-12-7 6-6 5-20-11-7 4-18-4-10 6h-5l-9-5 8 17-10-12h-8l-25-1-11 5-22 1-3-6h-25l-13-5-13 2h-10l-13-2h-2l-52 8-22-5-2 5-4-11-4 13-9-5-16 2-7 1h-1l-30-1-10 3-2 8-7-7h-1l-14 1-10 1-11 3-9 2-8 2h-17l33 11 7 3 15 5 4 1 6 4 15 7 30 4h4l14 1 11 1 38 2 12 1 35-4 46 3 10-5 12 2 11-2 26 6 15-12 13 2 3 7h4l5-5 20 5 14-5 23 2 22 6 35-9-5 6 9 2 22-1 25-12 11 10h17l11-4 12 4 6-3 19 4 27-5 17-1 9-5 24-5h23l9-3 6 1 16-5 13-5 9-4 33-3-1-1z"/><path fill="#40863b" d="M852 581h-23l-24 5-9 5-17 1-27 5-18-4-7 3-12-4-11 4h-17l-11-10-25 12-22 1-9-2 5-6-35 9-22-6-23-2-14 5-19-5-6 5h-4l-3-7-13-2-15 12-26-6-11 2-12-2-10 5-46-3-35 4 12 1h59l96 1h1l30-1h55l16 1h3l21-1 39-1 71-1h33l15-2 15-1 3-1 6-2 13-3 35-6 13-5-6-1-9 3z"/></g></defs>';

        for (uint256 idx = 0; idx < num; idx++) {
            zabuton = string.concat(zabuton, '<use xlink:href="#a" transform="translate(0 ');
            int256 yPos = 490 - ((int256)(idx) * 100);
            if (yPos < 0) {
                zabuton = string.concat(zabuton, "-");
                zabuton = string.concat(zabuton, Strings.toString(uint256(yPos * -1)));
            } else {
                zabuton = string.concat(zabuton, Strings.toString((uint256)(yPos)));
            }

            zabuton = string.concat(zabuton, ')"/>');
        }
        zabuton = string.concat(zabuton, "</svg>");
        return zabuton;
    }
}
