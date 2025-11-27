// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CarbonCreditToken - Minimal ERC20-compatible token with controlled minting
contract CarbonCreditToken {
    string public name = "Carbon Credit";
    string public symbol = "CCT";
    uint8 public immutable decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public minter; // EcoLedger or admin allowed to mint
    address public owner;  // contract owner who can set minter

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MinterUpdated(address indexed newMinter);
    event Burn(address indexed from, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "only minter");
        _;
    }

    constructor(address initialOwner, address initialMinter) {
        require(initialOwner != address(0), "owner 0");
        owner = initialOwner;
        minter = initialMinter;
        emit MinterUpdated(initialMinter);
    }

    function setMinter(address newMinter) external onlyOwner {
        minter = newMinter;
        emit MinterUpdated(newMinter);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "insufficient allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "mint to 0");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Burn tokens (remove from supply permanently)
    /// @param amount Amount of tokens to burn
    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        unchecked {
            balanceOf[msg.sender] -= amount;
            totalSupply -= amount;
        }
        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    /// @notice Burn tokens from another address (requires allowance)
    /// @param from Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burnFrom(address from, uint256 amount) external {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "insufficient allowance");
        require(balanceOf[from] >= amount, "insufficient balance");
        
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }
        
        unchecked {
            balanceOf[from] -= amount;
            totalSupply -= amount;
        }
        emit Burn(from, amount);
        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "to 0");
        uint256 bal = balanceOf[from];
        require(bal >= amount, "insufficient balance");
        unchecked {
            balanceOf[from] = bal - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}


