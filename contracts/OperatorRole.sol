// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OperatorRole is Ownable {
    address[] private operators;
    address private allowedContract;

    // operator role functions
    function _isOperator(address user) internal view returns (bool) {
        if (user == owner()) {
            return true;
        }
        if (msg.sender == allowedContract) {
            return true;
        }
        for (uint256 i = 0; i < operators.length; i++) {
            if (operators[i] == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Operator Modifier
     */
    modifier onlyOperator() {
        require(_isOperator(msg.sender), "Err: caller does not have the Operator role");
        _;
    }

    function grantOperatorRoleToUser(address user) public onlyOwner {
        operators.push(user);
    }

    function revokeOperatorRoleFromUser(address user) public onlyOwner {
        for (uint256 i = 0; i < operators.length; i++) {
            if (operators[i] == user) {
                operators[i] = operators[operators.length - 1];
                operators.pop();
                break;
            }
        }
    }

    function hasOperatorRole(address user) public view returns (bool) {
        return _isOperator(user);
    }

    function getOperatorMemberCount() public view returns (uint256) {
        return operators.length;
    }

    function getOperatorMember(uint256 index) public view returns (address) {
        return operators[index];
    }

    function setAllowedContract(address _allowedContract) public onlyOwner {
        allowedContract = _allowedContract;
    }

    function getAllowedContract() public view returns (address) {
        return allowedContract;
    }
}
