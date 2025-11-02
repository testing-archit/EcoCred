import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script to grant roles in AccessControl
 * Usage: npx hardhat run scripts/grant-role.ts --network <network>
 */
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Granting role with account:", signer.address);

  const accessControlAddress = process.env.ACCESS_CONTROL_CONTRACT || process.argv[2];
  const targetAddress = process.argv[3];
  const roleName = process.argv[4]?.toUpperCase() || "VERIFIER"; // ADMIN, VERIFIER, MODERATOR

  if (!accessControlAddress || !targetAddress) {
    throw new Error("Please provide AccessControl contract address and target address");
  }

  // Map role names to enum values
  const roleMap: Record<string, number> = {
    NONE: 0,
    ADMIN: 1,
    VERIFIER: 2,
    MODERATOR: 3,
  };

  const role = roleMap[roleName];
  if (role === undefined) {
    throw new Error(`Invalid role. Use: ADMIN, VERIFIER, or MODERATOR`);
  }

  const accessControlAbi = [
    "function grantRole(address account, uint8 role)",
    "function hasRole(address account, uint8 role) view returns (bool)",
    "function roles(address account) view returns (uint8)",
  ];

  const accessControl = new ethers.Contract(accessControlAddress, accessControlAbi, signer);

  // Check current role
  try {
    const currentRole = await accessControl.roles(targetAddress);
    console.log("Current role:", currentRole.toString());
    
    const hasRole = await accessControl.hasRole(targetAddress, role);
    if (hasRole) {
      console.log("Address already has this role");
      return;
    }
  } catch (error) {
    console.error("Error checking role:", error);
  }

  // Grant role
  try {
    const tx = await accessControl.grantRole(targetAddress, role);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log(`Successfully granted ${roleName} role to ${targetAddress}`);
  } catch (error: any) {
    console.error("Error granting role:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

