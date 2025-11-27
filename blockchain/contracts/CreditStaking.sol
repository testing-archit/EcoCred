// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonCreditToken.sol";
import "./ReentrancyGuard.sol";
import "./Pausable.sol";

/// @title CreditStaking - Staking mechanism for carbon credits with rewards
contract CreditStaking is ReentrancyGuard, Pausable {
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lockPeriod; // in seconds
        bool isLocked;
    }

    CarbonCreditToken public creditToken;
    address public minter; // Address that can mint rewards (should be set to this contract or a reward pool)
    
    uint256 public rewardRate; // basis points per year (100 = 1%)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_REWARD_RATE = 5000; // 50% max
    
    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public totalRewards;
    
    uint256 public totalStakedAmount;
    uint256 public totalRewardsDistributed;

    event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address tokenAddress, uint256 initialRewardRate) Pausable() {
        require(tokenAddress != address(0), "token address 0");
        require(initialRewardRate <= MAX_REWARD_RATE, "rate too high");
        creditToken = CarbonCreditToken(tokenAddress);
        rewardRate = initialRewardRate;
        // Note: minter should be set to this contract address after deployment
        // using creditToken.setMinter(address(this))
    }

    function setMinter(address newMinter) external onlyOwner {
        minter = newMinter;
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_REWARD_RATE, "rate too high");
        rewardRate = newRate;
    }

    function stake(uint256 amount, uint256 lockPeriodInDays) external nonReentrant whenNotPaused {
        require(amount > 0, "amount > 0");
        require(lockPeriodInDays > 0, "lock period > 0");
        require(creditToken.balanceOf(msg.sender) >= amount, "insufficient balance");

        // Transfer tokens to staking contract
        require(creditToken.transferFrom(msg.sender, address(this), amount), "transfer failed");

        uint256 lockPeriod = lockPeriodInDays * 1 days;
        
        stakes[msg.sender].push(Stake({
            amount: amount,
            timestamp: block.timestamp,
            lockPeriod: lockPeriod,
            isLocked: true
        }));

        totalStaked[msg.sender] += amount;
        totalStakedAmount += amount;

        emit Staked(msg.sender, stakes[msg.sender].length - 1, amount, lockPeriod);
    }

    function unstake(uint256 stakeIndex) external nonReentrant whenNotPaused {
        require(stakeIndex < stakes[msg.sender].length, "invalid index");
        
        Stake storage userStake = stakes[msg.sender][stakeIndex];
        require(userStake.isLocked, "already unstaked");
        require(
            block.timestamp >= userStake.timestamp + userStake.lockPeriod,
            "still locked"
        );

        uint256 stakedAmount = userStake.amount;
        uint256 reward = calculateReward(userStake);
        
        userStake.isLocked = false;
        totalStaked[msg.sender] -= stakedAmount;
        totalStakedAmount -= stakedAmount;

        // Mint reward tokens (requires this contract to be set as minter)
        if (minter == address(this)) {
            creditToken.mint(msg.sender, reward);
        } else if (minter != address(0)) {
            // If minter is set to another address (e.g., ledger), transfer from there
            require(creditToken.transferFrom(minter, msg.sender, reward), "reward transfer failed");
        } else {
            // No minter set - skip rewards or revert
            // For now, we'll skip rewards if minter not configured
            reward = 0;
        }
        
        // Transfer staked tokens back
        require(creditToken.transfer(msg.sender, stakedAmount), "transfer failed");

        totalRewards[msg.sender] += reward;
        totalRewardsDistributed += reward;

        emit Unstaked(msg.sender, stakeIndex, stakedAmount, reward);
    }

    function calculateReward(Stake memory stakeData) public view returns (uint256) {
        if (!stakeData.isLocked || block.timestamp < stakeData.timestamp + stakeData.lockPeriod) {
            return 0;
        }

        uint256 stakingDuration = block.timestamp - stakeData.timestamp;
        uint256 annualReward = (stakeData.amount * rewardRate) / BASIS_POINTS;
        uint256 reward = (annualReward * stakingDuration) / 365 days;

        return reward;
    }

    function getStakeCount(address user) external view returns (uint256) {
        return stakes[user].length;
    }

    function getStake(address user, uint256 index) external view returns (
        uint256 amount,
        uint256 timestamp,
        uint256 lockPeriod,
        bool isLocked,
        uint256 pendingReward
    ) {
        require(index < stakes[user].length, "invalid index");
        Stake memory stakeData = stakes[user][index];
        uint256 reward = 0;
        
        if (stakeData.isLocked && block.timestamp >= stakeData.timestamp + stakeData.lockPeriod) {
            reward = calculateReward(stakeData);
        }

        return (
            stakeData.amount,
            stakeData.timestamp,
            stakeData.lockPeriod,
            stakeData.isLocked,
            reward
        );
    }

    function getTotalPendingRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < stakes[user].length; i++) {
            if (stakes[user][i].isLocked) {
                Stake memory stakeData = stakes[user][i];
                if (block.timestamp >= stakeData.timestamp + stakeData.lockPeriod) {
                    total += calculateReward(stakeData);
                }
            }
        }
        return total;
    }
}

