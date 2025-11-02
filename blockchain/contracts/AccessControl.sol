// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AccessControl - Role-based access control system
contract AccessControl {
    enum Role {
        NONE,
        ADMIN,
        VERIFIER,
        MODERATOR
    }

    mapping(address => Role) public roles;
    address public owner;

    event RoleGranted(address indexed account, Role role);
    event RoleRevoked(address indexed account, Role role);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier onlyRole(Role role) {
        require(hasRole(msg.sender, role), "missing role");
        _;
    }

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.ADMIN;
        emit RoleGranted(msg.sender, Role.ADMIN);
    }

    function hasRole(address account, Role role) public view returns (bool) {
        return roles[account] == role;
    }

    function grantRole(address account, Role role) external onlyOwner {
        require(account != address(0), "zero address");
        require(role != Role.NONE, "cannot grant NONE");
        
        roles[account] = role;
        emit RoleGranted(account, role);
    }

    function revokeRole(address account) external onlyOwner {
        require(account != owner, "cannot revoke owner");
        
        roles[account] = Role.NONE;
        emit RoleRevoked(account, Role.NONE);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        require(newOwner != owner, "same owner");

        address oldOwner = owner;
        roles[oldOwner] = Role.NONE;
        owner = newOwner;
        roles[newOwner] = Role.ADMIN;

        emit OwnershipTransferred(oldOwner, newOwner);
        emit RoleRevoked(oldOwner, Role.NONE);
        emit RoleGranted(newOwner, Role.ADMIN);
    }
}

