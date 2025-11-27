-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COMPANY', 'VERIFIER', 'ADMIN', 'AUDITOR');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('ALL_TIME', 'MONTHLY', 'WEEKLY', 'DAILY');

-- CreateEnum
CREATE TYPE "AudienceScope" AS ENUM ('GLOBAL', 'COMPANY', 'VERIFIER', 'AUDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "GuidelineCategory" AS ENUM ('GENERAL', 'PLATFORM', 'VERIFICATION', 'AUDIT', 'MARKETPLACE', 'STAKING', 'GOVERNANCE', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'COMPANY',
    "walletAddress" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "industryId" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "location" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "creditsAwarded" INTEGER NOT NULL DEFAULT 0,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "blockchainActionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "comments" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "pricePerCredit" TEXT NOT NULL,
    "totalPrice" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "buyerAddress" TEXT,
    "listingId" INTEGER,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stake" (
    "id" TEXT NOT NULL,
    "stakerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" INTEGER NOT NULL DEFAULT 0,
    "stakeId" INTEGER,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "voterId" TEXT NOT NULL,
    "support" BOOLEAN NOT NULL,
    "votingPower" INTEGER NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "totalCompanies" INTEGER NOT NULL,
    "totalActions" INTEGER NOT NULL,
    "totalCreditsIssued" INTEGER NOT NULL,
    "totalBadgesMinted" INTEGER NOT NULL,
    "totalStaked" INTEGER NOT NULL,
    "totalMarketVolume" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionType" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "minCreditsPerUnit" INTEGER NOT NULL DEFAULT 0,
    "maxCreditsPerUnit" INTEGER NOT NULL DEFAULT 0,
    "defaultCreditsPerUnit" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "BadgeTier" NOT NULL,
    "icon" TEXT,
    "imageUrl" TEXT,
    "creditsRequired" INTEGER NOT NULL,
    "criteria" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarnedBadge" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tokenId" INTEGER,
    "txHash" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarnedBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "totalBadges" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "period" "LeaderboardPeriod" NOT NULL DEFAULT 'ALL_TIME',
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "value" TEXT NOT NULL,
    "valueType" "SettingValueType" NOT NULL DEFAULT 'STRING',
    "metadata" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickAction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "route" TEXT NOT NULL,
    "audience" "AudienceScope" NOT NULL DEFAULT 'GLOBAL',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guideline" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "category" "GuidelineCategory" NOT NULL DEFAULT 'GENERAL',
    "audience" "AudienceScope" NOT NULL DEFAULT 'GLOBAL',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "audience" "AudienceScope" NOT NULL DEFAULT 'GLOBAL',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyId_key" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Company_walletAddress_key" ON "Company"("walletAddress");

-- CreateIndex
CREATE INDEX "Company_walletAddress_idx" ON "Company"("walletAddress");

-- CreateIndex
CREATE INDEX "Company_verified_idx" ON "Company"("verified");

-- CreateIndex
CREATE INDEX "Company_industryId_idx" ON "Company"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "Action_txHash_key" ON "Action"("txHash");

-- CreateIndex
CREATE INDEX "Action_companyId_idx" ON "Action"("companyId");

-- CreateIndex
CREATE INDEX "Action_status_idx" ON "Action"("status");

-- CreateIndex
CREATE INDEX "Action_actionType_idx" ON "Action"("actionType");

-- CreateIndex
CREATE INDEX "Action_createdAt_idx" ON "Action"("createdAt");

-- CreateIndex
CREATE INDEX "Document_actionId_idx" ON "Document"("actionId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_txHash_key" ON "Verification"("txHash");

-- CreateIndex
CREATE INDEX "Verification_actionId_idx" ON "Verification"("actionId");

-- CreateIndex
CREATE INDEX "Verification_verifierId_idx" ON "Verification"("verifierId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_listingId_key" ON "Listing"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_txHash_key" ON "Listing"("txHash");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Stake_stakeId_key" ON "Stake"("stakeId");

-- CreateIndex
CREATE UNIQUE INDEX "Stake_txHash_key" ON "Stake"("txHash");

-- CreateIndex
CREATE INDEX "Stake_stakerId_idx" ON "Stake"("stakerId");

-- CreateIndex
CREATE INDEX "Stake_claimed_idx" ON "Stake"("claimed");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_txHash_key" ON "Vote"("txHash");

-- CreateIndex
CREATE INDEX "Vote_proposalId_idx" ON "Vote"("proposalId");

-- CreateIndex
CREATE INDEX "Vote_voterId_idx" ON "Vote"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_proposalId_voterId_key" ON "Vote"("proposalId", "voterId");

-- CreateIndex
CREATE INDEX "Analytics_snapshotDate_idx" ON "Analytics"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "ActionType_type_key" ON "ActionType"("type");

-- CreateIndex
CREATE INDEX "ActionType_type_idx" ON "ActionType"("type");

-- CreateIndex
CREATE INDEX "ActionType_active_idx" ON "ActionType"("active");

-- CreateIndex
CREATE INDEX "BadgeDefinition_tier_idx" ON "BadgeDefinition"("tier");

-- CreateIndex
CREATE INDEX "BadgeDefinition_active_idx" ON "BadgeDefinition"("active");

-- CreateIndex
CREATE INDEX "BadgeDefinition_displayOrder_idx" ON "BadgeDefinition"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EarnedBadge_tokenId_key" ON "EarnedBadge"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "EarnedBadge_txHash_key" ON "EarnedBadge"("txHash");

-- CreateIndex
CREATE INDEX "EarnedBadge_companyId_idx" ON "EarnedBadge"("companyId");

-- CreateIndex
CREATE INDEX "EarnedBadge_badgeId_idx" ON "EarnedBadge"("badgeId");

-- CreateIndex
CREATE INDEX "EarnedBadge_earnedAt_idx" ON "EarnedBadge"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EarnedBadge_badgeId_companyId_key" ON "EarnedBadge"("badgeId", "companyId");

-- CreateIndex
CREATE INDEX "Leaderboard_period_rank_idx" ON "Leaderboard"("period", "rank");

-- CreateIndex
CREATE INDEX "Leaderboard_snapshotDate_idx" ON "Leaderboard"("snapshotDate");

-- CreateIndex
CREATE INDEX "Leaderboard_companyId_idx" ON "Leaderboard"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_companyId_period_snapshotDate_key" ON "Leaderboard"("companyId", "period", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE INDEX "Industry_name_idx" ON "Industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "QuickAction_audience_idx" ON "QuickAction"("audience");

-- CreateIndex
CREATE INDEX "QuickAction_isActive_idx" ON "QuickAction"("isActive");

-- CreateIndex
CREATE INDEX "QuickAction_order_idx" ON "QuickAction"("order");

-- CreateIndex
CREATE INDEX "Guideline_category_idx" ON "Guideline"("category");

-- CreateIndex
CREATE INDEX "Guideline_audience_idx" ON "Guideline"("audience");

-- CreateIndex
CREATE INDEX "Guideline_isActive_idx" ON "Guideline"("isActive");

-- CreateIndex
CREATE INDEX "Faq_audience_idx" ON "Faq"("audience");

-- CreateIndex
CREATE INDEX "Faq_isActive_idx" ON "Faq"("isActive");

-- CreateIndex
CREATE INDEX "Faq_displayOrder_idx" ON "Faq"("displayOrder");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stake" ADD CONSTRAINT "Stake_stakerId_fkey" FOREIGN KEY ("stakerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnedBadge" ADD CONSTRAINT "EarnedBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnedBadge" ADD CONSTRAINT "EarnedBadge_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
