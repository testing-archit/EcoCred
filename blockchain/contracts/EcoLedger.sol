// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./EcoBadgeNFT.sol";

/// @title EcoLedger - Logs eco actions, verifies them, and mints credits/badges
contract EcoLedger {
    struct Action {
        address company;
        string title;
        string description;
        uint256 estimatedCredits;
        string location;
        bool verified;
        uint256 actualCredits;
    }

    address public owner;
    CarbonCreditToken public creditToken;
    EcoBadgeNFT public badgeNFT;

    uint256 public actionCount;
    mapping(uint256 => Action) private _actions;

    event EcoActionLogged(uint256 indexed actionId, address indexed company, string title);
    event ActionVerified(uint256 indexed actionId, bool approved, uint256 credits);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(address token, address badge) {
        owner = msg.sender;
        creditToken = CarbonCreditToken(token);
        badgeNFT = EcoBadgeNFT(badge);
    }

    function logEcoAction(
        string calldata title,
        string calldata description,
        uint256 estimatedCredits,
        string calldata location
    ) external returns (uint256) {
        require(bytes(title).length > 0, "title required");
        require(estimatedCredits > 0, "estimate > 0");
        uint256 id = ++actionCount;
        _actions[id] = Action({
            company: msg.sender,
            title: title,
            description: description,
            estimatedCredits: estimatedCredits,
            location: location,
            verified: false,
            actualCredits: 0
        });
        emit EcoActionLogged(id, msg.sender, title);
        return id;
    }

    function verifyAction(uint256 actionId, bool approved, uint256 actualCredits) external onlyOwner {
        Action storage a = _actions[actionId];
        require(a.company != address(0), "no action");
        require(!a.verified, "already verified");
        if (approved) {
            require(actualCredits > 0, "credits > 0");
            a.verified = true;
            a.actualCredits = actualCredits;
            creditToken.mint(a.company, actualCredits * 1e18);
            // milestone example: mint a badge if >= 100 credits
            if (actualCredits >= 100) {
                badgeNFT.safeMint(a.company);
            }
        } else {
            a.verified = true;
            a.actualCredits = 0;
        }
        emit ActionVerified(actionId, approved, actualCredits);
    }

    function getAction(uint256 actionId)
        external
        view
        returns (
            string memory title,
            string memory description,
            uint256 estimatedCredits,
            string memory location,
            bool verified,
            uint256 actualCredits
        )
    {
        Action storage a = _actions[actionId];
        require(a.company != address(0), "no action");
        return (a.title, a.description, a.estimatedCredits, a.location, a.verified, a.actualCredits);
    }
}


