// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./IZabuton.sol";

contract ZabutonImage is IZabuton {
    function getImage(uint256 num) public pure returns (string memory) {
        string
            memory zabuton = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1080 1080"><defs><g id="a" ><path fill="#57D75F" d="m938 562-63-33-163-40-59-6-124 12-84-6 41-2-74-4 36-4-126 8-179 73 69-9 7 7 59-16 24 6 114-8 63 10 44-4 10 12 74-18 39 8 64-5 7 21 29-20z"/><path fill="#3DAE28" d="m746 544-29 20-7-21-64 5-39-8-74 18-10-12-44 4-63-10-114 8-24-6-59 16-7-7-69 9 79 31 109 9 114-6 26 6 205-14 11 10 28-4 37 5 77-16 38-2 71-17z"/><path fill="#40863B" d="m829 581-77 16-37-5-28 4-11-10-205 14-26-6-114 6 436-1 100-20z"/><path fill="#9DF6A0" d="m486 487-41 2 84 6 124-12-113 4-92-8-36 4z"/></g></defs>';
        for (uint256 idx = 0; idx < num; idx++) {
            zabuton = string.concat(zabuton, '<use xlink:href="#a" x="0" y="');
            int256 yPos = 490 - ((int256)(idx) * 100);
            if (yPos < 0) {
                zabuton = string.concat(zabuton, "-");
                zabuton = string.concat(zabuton, Strings.toString(uint256(yPos * -1)));
            } else {
                zabuton = string.concat(zabuton, Strings.toString((uint256)(yPos)));
            }

            zabuton = string.concat(zabuton, '"/>');
        }
        zabuton = string.concat(zabuton, "</svg>");
        return zabuton;
    }
}
