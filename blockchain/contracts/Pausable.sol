// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Pausable - Emergency pause functionality
/// @notice Allows owner to pause contract operations in case of emergency
contract Pausable {
    bool public paused;

    address public owner;

    event Paused(address account);
    event Unpaused(address account);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Pausable: not paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        owner = newOwner;
    }
}

