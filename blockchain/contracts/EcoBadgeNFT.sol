// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title EcoBadgeNFT - Minimal ERC721-like NFT with baseURI metadata
contract EcoBadgeNFT {
    string public name = "EcoBadge";
    string public symbol = "ECOB";

    string public baseURI;
    address public owner;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    // naive owner enumeration for demo (not updated on transfers)
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    uint256 public nextId = 1;

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(string memory base) {
        owner = msg.sender;
        baseURI = base;
    }

    function setBaseURI(string calldata base) external onlyOwner {
        baseURI = base;
    }

    function tokenURI(uint256 id) public view returns (string memory) {
        require(_ownerOf[id] != address(0), "not minted");
        return string(abi.encodePacked(baseURI, _toString(id)));
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "zero addr");
        return _balanceOf[account];
    }

    function ownerOf(uint256 id) public view returns (address) {
        address o = _ownerOf[id];
        require(o != address(0), "not minted");
        return o;
    }

    function approve(address spender, uint256 id) external {
        address o = ownerOf(id);
        require(msg.sender == o || isApprovedForAll[o][msg.sender], "not authorized");
        getApproved[id] = spender;
        emit Approval(o, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 id) public {
        require(from == ownerOf(id), "from not owner");
        require(to != address(0), "to zero");
        require(
            msg.sender == from ||
            msg.sender == getApproved[id] ||
            isApprovedForAll[from][msg.sender],
            "not authorized"
        );
        delete getApproved[id];
        _balanceOf[from] -= 1;
        _balanceOf[to] += 1;
        _ownerOf[id] = to;
        emit Transfer(from, to, id);
    }

    function safeMint(address to) external onlyOwner returns (uint256) {
        require(to != address(0), "to zero");
        uint256 id = nextId++;
        _ownerOf[id] = to;
        _balanceOf[to] += 1;
        _ownedTokens[to].push(id);
        emit Transfer(address(0), to, id);
        return id;
    }

    // minimal enumeration for frontend queries (not updated on transfer)
    function tokenOfOwnerByIndex(address owner_, uint256 index) external view returns (uint256) {
        require(index < _ownedTokens[owner_].length, "index oob");
        return _ownedTokens[owner_][index];
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}


