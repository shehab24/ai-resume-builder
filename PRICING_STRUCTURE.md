# ResumeAI Pro - Pricing Structure & Features

## Pricing Plans

### Free Plan
- **Price:** ৳0/month
- **Available to:** All users (Job Seekers & Recruiters)

### Pro Plan - Job Seeker
- **Price:** ৳299/month
- **Target:** Job Seekers

### Pro Plan - Recruiter
- **Price:** ৳999/month
- **Target:** Recruiters

---

## Feature Comparison

### Job Seeker Features

| Feature | Free | Pro (৳299/month) |
|---------|------|------------------|
| **Resume Creation** | 2 resumes max | ✅ Unlimited resumes |
| **AI Resume Builder** | ✅ Yes | ✅ Yes |
| **Job Search** | ✅ Yes | ✅ Yes |
| **Manual Job Applications** | ✅ Yes | ✅ Yes |
| **Auto-Apply to Jobs** | ❌ No | ✅ Yes (95-100% match) |
| **Resume Download** | ✅ Yes | ✅ Yes |
| **Profile Management** | ✅ Yes | ✅ Yes |
| **Interview Invitations** | ✅ Yes | ✅ Yes |

**Pro Features Summary (৳299/month):**
- ✅ **Unlimited AI-generated resumes**
- ✅ **Auto-Apply feature** - Automatically apply to hundreds of matching jobs
- ✅ **Priority support**

---

### Recruiter Features

| Feature | Free | Pro (৳999/month) |
|---------|------|------------------|
| **Post Jobs** | ✅ Yes | ✅ Yes |
| **View Applications** | ✅ Yes | ✅ Yes |
| **Basic Candidate Search** | ✅ Yes | ✅ Yes |
| **AI Candidate Rankings** | ❌ No | ✅ Yes |
| **Schedule Video Interviews** | ❌ No | ✅ Yes |
| **AI Task Evaluation** | ❌ No | ✅ Yes |
| **AI Interview Questions Generator** | ❌ No | ✅ Yes |
| **Interview Panel Invitations** | ❌ No | ✅ Yes |
| **Advanced Analytics** | ❌ No | ✅ Yes |

**Pro Features Summary (৳999/month):**
- ✅ **AI-powered candidate ranking** - Smart scoring and top candidate identification
- ✅ **Video interview scheduling** - Schedule and manage interviews with calendar integration
- ✅ **AI task evaluation** - Automated analysis of candidate submissions
- ✅ **AI interview questions** - Generate personalized technical and behavioral questions
- ✅ **Team collaboration** - Invite panel members to interviews
- ✅ **Priority support**

---

## Upgrade Scenarios

### Scenario 1: Job Seeker Upgrading
**User:** Job Seeker (Free)  
**Action:** Clicks "Upgrade to Pro"  
**Payment:** ৳299/month  
**Result:** Gets Job Seeker Pro features (unlimited resumes, auto-apply)

### Scenario 2: Recruiter Upgrading
**User:** Recruiter (Free)  
**Action:** Clicks "Unlock Rankings" or "Schedule Interview"  
**Payment:** ৳999/month  
**Result:** Gets Recruiter Pro features (AI ranking, interviews, AI tools)

### Scenario 3: Role Switching
**Current Implementation:**
- Each user has ONE role (Job Seeker OR Recruiter)
- Subscription is tied to the user account, not the role
- If a user switches roles, their Pro status remains

**Example:**
1. User signs up as Job Seeker
2. Upgrades to Pro for ৳299/month
3. Later switches to Recruiter role
4. **Current behavior:** Still has Pro status, but paid ৳299 (Job Seeker rate)

**Recommendation for Future:**
Consider implementing role-specific subscriptions where:
- If user switches from Job Seeker Pro (৳299) to Recruiter, they need to upgrade to Recruiter Pro (৳999)
- Or offer a "Both Roles" plan at ৳999/month that includes all features

---

## Payment Flow

### Current Implementation
1. User clicks "Upgrade to Pro" button
2. System initiates bKash payment with role-specific amount:
   - Job Seeker: ৳299
   - Recruiter: ৳999
3. User completes payment on bKash
4. System validates payment
5. User subscription status updated to PRO
6. Features unlocked immediately

### Subscription Management
- **Duration:** Monthly recurring
- **Payment Method:** bKash
- **Auto-renewal:** Not implemented yet (manual renewal required)
- **Cancellation:** Can be implemented via admin panel

---

## Technical Implementation

### Price Configuration Locations

**Job Seeker Pages (৳299):**
- `/dashboard/job-seeker/profile` - Auto-apply toggle
- `/dashboard/job-seeker/jobs` - Auto-apply card
- `/dashboard/job-seeker/resume/create` - Resume limit prompt

**Recruiter Pages (৳999):**
- `/dashboard/recruiter/jobs` - Rankings button
- `/dashboard/recruiter/jobs/[id]/applications` - Schedule interview button
- `/dashboard/recruiter/applications/[id]` - Schedule, AI evaluation, AI questions
- `/dashboard/recruiter/interviews` - Full page access

**Shared Component:**
- `src/components/upgrade-prompt.tsx` - Accepts `price` prop (defaults to 999)

### Code Example
```tsx
// Job Seeker
<Button onClick={() => subscribe('PRO', 299)}>
  Upgrade to Pro - ৳299/month
</Button>

// Recruiter
<Button onClick={() => subscribe('PRO', 999)}>
  Upgrade to Pro - ৳999/month
</Button>

// Using UpgradePrompt component
<UpgradePrompt 
  title="Feature Locked"
  message="This is a Pro feature"
  price={299} // or 999 for recruiters
/>
```

---

## Future Enhancements

### Recommended Improvements

1. **Dual-Role Subscription**
   - Allow users to have both Job Seeker and Recruiter roles
   - Offer combined plan at ৳999/month with all features
   - Or charge separately: ৳299 + ৳999 = ৳1,298/month

2. **Upgrade Path**
   - If Job Seeker Pro (৳299) wants Recruiter Pro features
   - Option 1: Pay difference (৳700 more) to upgrade to ৳999 plan
   - Option 2: Pay full ৳999 and cancel ৳299 subscription

3. **Annual Plans**
   - Job Seeker Pro: ৳2,990/year (save ৳598)
   - Recruiter Pro: ৳9,990/year (save ৳1,998)

4. **Team Plans (for Recruiters)**
   - Multiple recruiter accounts under one subscription
   - ৳999/month per seat with volume discounts

5. **Trial Period**
   - 7-day free trial for Pro features
   - Helps conversion rates

---

## FAQ

**Q: What happens if a Job Seeker Pro user switches to Recruiter?**
A: Currently, they retain Pro status but only paid ৳299. This should be addressed with proper role-specific subscription handling.

**Q: Can a user have both Job Seeker and Recruiter Pro?**
A: Not currently implemented. The system supports one role per user.

**Q: What happens when subscription expires?**
A: User reverts to Free plan. Pro features are locked until renewal.

**Q: Is there a refund policy?**
A: Should be defined in Terms of Service. Typically no refunds for digital subscriptions.

**Q: Can users downgrade from Pro to Free?**
A: Yes, by canceling subscription. Access continues until end of billing period.

---

## Contact & Support

For subscription issues or questions:
- Email: support@resumeai.com (to be configured)
- In-app support ticket system (to be implemented)
- Priority support for Pro users
