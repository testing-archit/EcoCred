import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EcoSystemModule = buildModule("EcoSystemModule", (m) => {
  const baseURI = m.getParameter("baseURI", "https://example.com/metadata/");

  // Deploy placeholders to pass constructor params; we wire minter after deploy
  const carbonCredit = m.contract("CarbonCreditToken", [m.getAccount(0), m.getAccount(0)]);
  const ecoBadge = m.contract("EcoBadgeNFT", [baseURI]);

  const ecoLedger = m.contract("EcoLedger", [carbonCredit, ecoBadge]);

  // After deploy, set the ledger as minter
  m.call(carbonCredit, "setMinter", [ecoLedger]);

  return { carbonCredit, ecoBadge, ecoLedger };
});

export default EcoSystemModule;


