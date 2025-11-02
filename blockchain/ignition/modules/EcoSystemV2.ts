import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EcoSystemV2Module = buildModule("EcoSystemV2Module", (m) => {
  const baseURI = m.getParameter("baseURI", "https://example.com/metadata/");
  const marketplaceFee = m.getParameter("marketplaceFee", 250); // 2.5%
  const stakingRewardRate = m.getParameter("stakingRewardRate", 500); // 5% per year
  const verificationThreshold = m.getParameter("verificationThreshold", 2);
  const votingPeriod = m.getParameter("votingPeriod", 7 * 24 * 60 * 60); // 7 days in seconds
  const quorumThreshold = m.getParameter("quorumThreshold", 1000);
  const proposalThreshold = m.getParameter("proposalThreshold", 10000);

  // Deploy AccessControl first (used by multiple contracts)
  const accessControl = m.contract("AccessControl");

  // Deploy core tokens
  const carbonCredit = m.contract("CarbonCreditToken", [
    m.getAccount(0),
    m.getAccount(0), // Will be updated after ledger deployment
  ]);
  const ecoBadge = m.contract("EcoBadgeNFT", [baseURI]);

  // Deploy enhanced ledger
  const ecoLedgerV2 = m.contract("EcoLedgerV2", [
    carbonCredit,
    ecoBadge,
    accessControl,
    verificationThreshold,
  ]);

  // Set ledger as minter for token
  m.call(carbonCredit, "setMinter", [ecoLedgerV2]);

  // Deploy marketplace
  const marketplace = m.contract("CarbonCreditMarketplace", [
    carbonCredit,
    marketplaceFee,
  ]);

  // Deploy staking contract
  const staking = m.contract("CreditStaking", [
    carbonCredit,
    stakingRewardRate,
  ]);

  // Set staking contract as minter for rewards (optional - can be configured later)
  // m.call(carbonCredit, "setMinter", [staking]);
  // Or set staking to mint from itself after deployment
  // m.call(staking, "setMinter", [staking]);

  // Deploy leaderboard
  const leaderboard = m.contract("Leaderboard", [ecoLedgerV2]);

  // Deploy governance
  const governance = m.contract("Governance", [carbonCredit, accessControl]);

  // Grant roles in AccessControl
  // Admin role is automatically granted to deployer
  // Add verifier roles as needed after deployment

  return {
    accessControl,
    carbonCredit,
    ecoBadge,
    ecoLedgerV2,
    marketplace,
    staking,
    leaderboard,
    governance,
  };
});

export default EcoSystemV2Module;

