# Monetization & Billing System Documentation

## Overview

Careercare.ai uses a credit-based monetization system combined with subscription tiers. Users consume credits to perform AI-intensive actions, while subscriptions provide a recurring bucket of credits and higher operational limits.

## Subscription Tiers

| Tier       | Price (USD/mo) | Monthly Credits | Key Benefits                                     |
| :--------- | :------------- | :-------------- | :----------------------------------------------- |
| **FREE**   | $0             | 5               | Basic exploration, public job access.            |
| **BASE**   | $19.99         | 50              | Full ATS optimization and detailed job matching. |
| **PRO**    | $49.99         | 200             | Priority processing and stealth writing mode.    |
| **RESULT** | $99.99         | 500             | Biometric coaching and maximum velocity.         |

## Credit Costs

AI actions are priced in credits to reflect their computational cost:

| Action                 | Credit Cost | Description                                          |
| :--------------------- | :---------- | :--------------------------------------------------- |
| `JOB_SCAN`             | 1           | AI-powered job recommendation search.                |
| `CV_OPTIMIZATION`      | 5           | Full rewrite of a resume to match a job description. |
| `COVER_LETTER`         | 3           | Tailored cover letter generation.                    |
| `INTERVIEW_SIMULATION` | 10          | Biometric-enabled interview practice session.        |
| `SKILL_GAP_ANALYSIS`   | 5           | Deep dive into missing skills for a target role.     |

## Technical Implementation

### Wallet & Credits

- Every user has a `CreditWallet`.
- `CreditMovement` logs every transaction (refills and consumptions).
- Credits are deducted at the moment of the request.

### Limits (`TIER_LIMITS`)

We enforce daily and total limits based on the tier:

- **Daily Scans**: Limits how many times a user can trigger the `scanJobs` agent per day.
- **Priority**: Higher tiers get priority in the AI processing queue.

### API Endpoints

- `GET /api/v1/billing/plans`: List all active plans.
- `GET /api/v1/billing/me`: Get current user balance and subscription info.
- `POST /api/v1/billing/topup`: (Alpha) Manually add credits or simulate a purchase.

### Future Roadmap

- **Stripe Integration**: Connect webhooks to `billingService.syncSubscription`.
- **Auto-Renewal**: Logic to reset and refill credits every 30 days.
- **Enterprise Tier**: Custom pricing for recruitment agencies.
