# Database Seed Data Summary

## Overview

The EcoCred database has been populated with realistic synthetic data representing a functioning carbon credit ecosystem.

---

## 📊 Data Summary

### Companies (8 total)
- **6 Verified Companies**
- **2 Unverified Companies**

| Company Name | Industry | Location | Verified | Actions |
|-------------|----------|----------|----------|---------|
| GreenTech Solutions | Renewable Energy | San Francisco, CA | ✅ | 2 |
| EcoManufacturing Inc | Manufacturing | Portland, OR | ✅ | 2 |
| Forest Guardians | Environmental Conservation | Seattle, WA | ✅ | 2 |
| CleanOcean Initiative | Environmental Conservation | Miami, FL | ✅ | 2 |
| SolarPower Corp | Renewable Energy | Austin, TX | ❌ | 2 |
| RecycleRight | Waste Management | Denver, CO | ✅ | 2 |
| WindEnergy Partners | Renewable Energy | Chicago, IL | ❌ | 2 |
| Urban Green Spaces | Urban Planning | New York, NY | ✅ | 2 |

### Eco Actions (16 total)
- **14 Verified Actions** (with credits awarded)
- **2 Pending Actions** (awaiting verification)

**Action Types:**
- Tree Planting: 5 actions
- Solar Installation: 2 actions
- Renewable Energy Generation: 4 actions
- Recycling: 2 actions
- Ocean Cleanup: 2 actions
- Energy Efficiency: 1 action
- Composting: 1 action
- Carbon Capture: 1 action (pending)

### Carbon Credits
- **Total Credits Issued**: 465,500 CCT
- **Average per Verified Action**: 33,250 CCT
- **Highest Single Award**: 100,000 CCT (Wind Energy)
- **Lowest Single Award**: 8,000 CCT (Composting)

**Top Credit Earners:**
1. WindEnergy Partners: 100,000 CCT
2. Forest Guardians: 80,000 CCT
3. GreenTech Solutions: 75,000 CCT
4. EcoManufacturing Inc: 65,000 CCT
5. RecycleRight: 58,000 CCT

### Marketplace (4 listings)
- **3 Active Listings**
- **1 Sold Listing**

| Seller | Amount | Price/Credit | Total | Status |
|--------|--------|--------------|-------|--------|
| GreenTech Solutions | 10,000 | $0.05 | $500 | Active |
| Forest Guardians | 15,000 | $0.045 | $675 | Active |
| RecycleRight | 8,000 | $0.055 | $440 | Active |
| EcoManufacturing Inc | 5,000 | $0.05 | $250 | Sold |

**Total Market Volume**: $1,865

### Staking (3 stakes)
- **2 Active Stakes**
- **1 Claimed Stake**

| Staker | Amount | Duration | Rewards | Status |
|--------|--------|----------|---------|--------|
| GreenTech Solutions | 20,000 | 30 days | 2,000 | Active |
| Forest Guardians | 30,000 | 60 days | 4,500 | Active |
| RecycleRight | 15,000 | 30 days | 1,500 | Claimed |

**Total Staked**: 65,000 CCT  
**Total Rewards**: 8,000 CCT

### Governance (7 votes across 2 proposals)

**Proposal #1**: 4 votes
- For: 3 votes (177,500 voting power)
- Against: 1 vote (80,000 voting power)
- **Result**: Passing

**Proposal #2**: 3 votes
- For: 2 votes (93,000 voting power)
- Against: 1 vote (75,000 voting power)
- **Result**: Passing

---

## 🔍 Sample Data Details

### Example Company: GreenTech Solutions
```json
{
  "name": "GreenTech Solutions",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "industry": "Renewable Energy",
  "location": "San Francisco, CA",
  "verified": true,
  "actions": 2,
  "totalCredits": 75000
}
```

### Example Action: Solar Installation
```json
{
  "actionType": "solar_installation",
  "description": "Installed 500kW solar panel system on commercial building rooftop",
  "quantity": 500,
  "unit": "kW",
  "status": "VERIFIED",
  "creditsAwarded": 25000,
  "company": "GreenTech Solutions"
}
```

### Example Marketplace Listing
```json
{
  "seller": "Forest Guardians",
  "amount": 15000,
  "pricePerCredit": "0.045",
  "totalPrice": "675",
  "status": "ACTIVE"
}
```

---

## 🎯 Use Cases Enabled

With this seeded data, you can now:

1. **View Company Profiles** - Browse 8 different companies with varied industries
2. **Track Eco Actions** - See 16 real sustainability initiatives
3. **Monitor Credits** - Track 465,500 carbon credits across the platform
4. **Browse Marketplace** - View 3 active listings for credit trading
5. **Check Staking** - See active and completed staking positions
6. **Review Governance** - Examine voting patterns on proposals
7. **Analyze Trends** - View historical data and analytics

---

## 📡 API Endpoints with Real Data

All endpoints now return real data:

```bash
# Get all companies
GET /api/companies
→ Returns 8 companies

# Get platform analytics
GET /api/analytics/overview
→ Returns real statistics

# Get marketplace listings
GET /api/marketplace/listings
→ Returns 3 active listings

# Get all actions
GET /api/actions
→ Returns 16 eco actions

# Get company details
GET /api/companies/{id}
→ Returns full company profile with actions
```

---

## 🔄 Re-seeding

To re-seed the database with fresh data:

```bash
cd backend
npm run db:seed
```

This will:
1. Clear all existing data
2. Create new companies
3. Generate new actions
4. Create verifications
5. Add marketplace listings
6. Create stakes and votes
7. Generate analytics snapshot

---

## 📝 Notes

- All wallet addresses are example addresses (not real wallets)
- Dates are randomized within the last 30 days
- Credit amounts are calculated based on realistic multipliers
- All data relationships are properly maintained
- No mock data remains - everything is real database records

---

**Generated**: November 22, 2025  
**Total Records**: 52 (8 companies + 16 actions + 14 verifications + 4 listings + 3 stakes + 7 votes)  
**Database**: Neon PostgreSQL  
**Status**: ✅ Fully Seeded and Operational
