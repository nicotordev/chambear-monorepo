# Implementation Plan - Billing and Monetization System

Define and implement the monetization strategy for Careercare.ai, including subscription tiers, credit system, and documentation.

## Proposed Tier Structure

| Tier       | Price (USD/mo) | Monthly Credits | Features                                            |
| :--------- | :------------- | :-------------- | :-------------------------------------------------- |
| **FREE**   | $0             | 5               | Access to public/free jobs (limit 10), basic scans. |
| **BASE**   | $19.99         | 50              | Full job descriptions, ATS optimization.            |
| **PRO**    | $49.99         | 200             | Priority AI processing, advanced stealth writing.   |
| **RESULT** | $99.99         | 500             | Biometric coaching sessions, unlimited history.     |

## Credit Costs

- **Job Scan**: 1 credit
- **CV Optimization**: 5 credits
- **Cover Letter Generation**: 3 credits
- **Interview Simulation**: 10 credits
- **Skill Gap Analysis**: 5 credits

## User Tasks

- [ ] Create a seed script to populate `Plan` table in Prisma.
- [ ] Implement `billingService.initializePlans()` to ensure plans exist.
- [ ] Refine `billingService.canUserAction` to check specific tier permissions or credit balances.
- [ ] Implement automated credit renewal logic (mocked or scheduled).
- [ ] Create Comprehensive Documentation (`docs/monetization.md`).

## Verification Plan

### Automated Tests

- Test credit consumption for `JOB_SCAN`.
- Test insufficient credits error.
- Test subscription status impact on `canUserAction`.

### Manual Verification

- verify `GET /api/v1/billing/plans` returns the correct tiers.
- Verify `GET /api/v1/billing/me` returns the current user's wallet and sub.
