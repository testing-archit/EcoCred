// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AccessControl.sol";

/// @title TimelockController - Time-delayed execution for critical operations
/// @notice Adds a delay before executing critical operations for security
contract TimelockController {
    struct Operation {
        address target;
        bytes data;
        uint256 timestamp;
        bool executed;
        bool cancelled;
    }

    AccessControl public accessControl;
    uint256 public minDelay; // minimum delay in seconds
    uint256 public operationCount;

    mapping(uint256 => Operation) public operations;
    mapping(bytes32 => uint256) public operationHashes; // hash => operationId

    event OperationScheduled(
        uint256 indexed operationId,
        address indexed target,
        bytes data,
        uint256 timestamp
    );
    event OperationExecuted(uint256 indexed operationId);
    event OperationCancelled(uint256 indexed operationId);
    event MinDelayUpdated(uint256 newDelay);

    modifier onlyRole(AccessControl.Role role) {
        require(accessControl.hasRole(msg.sender, role), "missing role");
        _;
    }

    constructor(address accessControlAddress, uint256 delay) {
        require(accessControlAddress != address(0), "access control address 0");
        require(delay >= 1 hours && delay <= 30 days, "invalid delay");
        
        accessControl = AccessControl(accessControlAddress);
        minDelay = delay;
    }

    /// @notice Schedule an operation for future execution
    /// @param target Address to call
    /// @param data Calldata for the call
    /// @return operationId ID of the scheduled operation
    function schedule(address target, bytes calldata data) external onlyRole(AccessControl.Role.ADMIN) returns (uint256) {
        require(target != address(0), "zero address");
        
        bytes32 hash = keccak256(abi.encodePacked(target, data, block.timestamp));
        require(operationHashes[hash] == 0, "duplicate operation");

        uint256 operationId = ++operationCount;
        uint256 executeTime = block.timestamp + minDelay;

        operations[operationId] = Operation({
            target: target,
            data: data,
            timestamp: executeTime,
            executed: false,
            cancelled: false
        });

        operationHashes[hash] = operationId;

        emit OperationScheduled(operationId, target, data, executeTime);
        return operationId;
    }

    /// @notice Execute a scheduled operation
    /// @param operationId ID of the operation to execute
    function execute(uint256 operationId) external onlyRole(AccessControl.Role.ADMIN) {
        Operation storage operation = operations[operationId];
        require(operation.target != address(0), "operation not found");
        require(!operation.executed, "already executed");
        require(!operation.cancelled, "operation cancelled");
        require(block.timestamp >= operation.timestamp, "too early");

        operation.executed = true;

        (bool success, ) = operation.target.call(operation.data);
        require(success, "execution failed");

        emit OperationExecuted(operationId);
    }

    /// @notice Cancel a scheduled operation
    /// @param operationId ID of the operation to cancel
    function cancel(uint256 operationId) external onlyRole(AccessControl.Role.ADMIN) {
        Operation storage operation = operations[operationId];
        require(operation.target != address(0), "operation not found");
        require(!operation.executed, "already executed");
        require(!operation.cancelled, "already cancelled");

        operation.cancelled = true;

        emit OperationCancelled(operationId);
    }

    /// @notice Update minimum delay (admin only)
    /// @param newDelay New minimum delay in seconds
    function setMinDelay(uint256 newDelay) external onlyRole(AccessControl.Role.ADMIN) {
        require(newDelay >= 1 hours && newDelay <= 30 days, "invalid delay");
        minDelay = newDelay;
        emit MinDelayUpdated(newDelay);
    }

    /// @notice Get operation details
    /// @param operationId ID of the operation
    function getOperation(uint256 operationId)
        external
        view
        returns (
            address target,
            bytes memory data,
            uint256 timestamp,
            bool executed,
            bool cancelled
        )
    {
        Operation storage operation = operations[operationId];
        require(operation.target != address(0), "operation not found");
        
        return (
            operation.target,
            operation.data,
            operation.timestamp,
            operation.executed,
            operation.cancelled
        );
    }
}

