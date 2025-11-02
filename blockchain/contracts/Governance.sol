// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./AccessControl.sol";

/// @title Governance - DAO-style governance for the EcoCred platform
contract Governance {
    struct Proposal {
        address proposer;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        bytes data;
        address target;
    }

    CarbonCreditToken public creditToken;
    AccessControl public accessControl;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public votingPower; // snapshot at proposal time

    uint256 public votingPeriod = 7 days;
    uint256 public quorumThreshold = 1000 * 1e18; // minimum tokens to vote
    uint256 public proposalThreshold = 10000 * 1e18; // minimum tokens to propose

    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);

    modifier onlyTokenHolder() {
        require(creditToken.balanceOf(msg.sender) >= proposalThreshold, "insufficient tokens");
        _;
    }

    constructor(address tokenAddress, address accessControlAddress) {
        require(tokenAddress != address(0), "token address 0");
        require(accessControlAddress != address(0), "access control address 0");
        
        creditToken = CarbonCreditToken(tokenAddress);
        accessControl = AccessControl(accessControlAddress);
    }

    function createProposal(
        string calldata description,
        address target,
        bytes calldata data
    ) external onlyTokenHolder returns (uint256) {
        require(bytes(description).length > 0, "description required");
        require(target != address(0), "target address 0");

        uint256 proposalId = ++proposalCount;
        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + votingPeriod,
            executed: false,
            data: data,
            target: target
        });

        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "proposal not found");
        require(block.timestamp < proposal.deadline, "voting ended");
        require(!proposal.executed, "already executed");
        require(!hasVoted[proposalId][msg.sender], "already voted");

        uint256 votes = creditToken.balanceOf(msg.sender);
        require(votes >= quorumThreshold, "insufficient voting power");

        hasVoted[proposalId][msg.sender] = true;
        votingPower[proposalId][msg.sender] = votes;

        if (support) {
            proposal.votesFor += votes;
        } else {
            proposal.votesAgainst += votes;
        }

        emit VoteCast(proposalId, msg.sender, support, votes);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "proposal not found");
        require(block.timestamp >= proposal.deadline, "voting ongoing");
        require(!proposal.executed, "already executed");
        require(proposal.votesFor > proposal.votesAgainst, "proposal failed");

        proposal.executed = true;

        // Execute the proposal (call target with calldata)
        // Note: This is simplified - in production, you'd want more security
        (bool success, ) = proposal.target.call(proposal.data);
        require(success, "execution failed");

        emit ProposalExecuted(proposalId);
    }

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            string memory description,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 deadline,
            bool executed
        )
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "proposal not found");
        
        return (
            proposal.proposer,
            proposal.description,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.deadline,
            proposal.executed
        );
    }

    function setVotingPeriod(uint256 newPeriod) external {
        require(accessControl.hasRole(msg.sender, AccessControl.Role.ADMIN), "only admin");
        require(newPeriod >= 1 days && newPeriod <= 30 days, "invalid period");
        votingPeriod = newPeriod;
    }

    function setQuorumThreshold(uint256 newThreshold) external {
        require(accessControl.hasRole(msg.sender, AccessControl.Role.ADMIN), "only admin");
        quorumThreshold = newThreshold;
    }
}

