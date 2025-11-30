# Role-Based Pricing - Final Implementation

## Pricing Structure (CLARIFIED)

### Option 1: Job Seeker Pro - ৳299/month
- **Plan Type:** `JOB_SEEKER_PRO`
- **Features:** Job Seeker Pro features ONLY
- **Important:** If user switches to Recruiter role, they LOSE Pro access
- **To get Recruiter features:** Must pay ৳999 for All Features Pro

### Option 2: All Features Pro - ৳999/month  
- **Plan Type:** `ALL_FEATURES_PRO`
- **Features:** BOTH Job Seeker AND Recruiter Pro features
- **Works for:** Any role (Job Seeker OR Recruiter)
- **Best Value:** Get everything for ৳999

## User Scenarios

### Scenario 1: Job Seeker pays ৳299
```
✅ Can use: Unlimited resumes, Auto-Apply
❌ Cannot use: Recruiter features (Rankings, Interviews, AI tools)
⚠️ If switches to Recruiter: Loses Pro access entirely
💡 To get Recruiter features: Pay ৳999 for All Features Pro
```

### Scenario 2: Recruiter pays ৳999
```
✅ Can use: ALL Recruiter features + ALL Job Seeker features
✅ If switches to Job Seeker: Still has Pro access
💡 Best option for users who might use both roles
```

### Scenario 3: Job Seeker (৳299) wants Recruiter features
```
Current: Job Seeker Pro (৳299/month)
Action: Pay ৳999 for All Features Pro
Result: Now has ALL features (Job Seeker + Recruiter)
Note: Should cancel ৳299 subscription to avoid double billing
```

## Feature Access Logic

### Job Seeker Features
```typescript
// Check if user has Job Seeker Pro OR All Features Pro
const hasJobSeekerPro = subscription?.planType === 'JOB_SEEKER_PRO' || 
                        subscription?.planType === 'ALL_FEATURES_PRO';

// Also check if user is currently in Job Seeker role
const canAccessJobSeekerPro = hasJobSeekerPro && user.role === 'JOB_SEEKER';
```

### Recruiter Features
```typescript
// Only All Features Pro can access Recruiter features
const hasRecruiterPro = subscription?.planType === 'ALL_FEATURES_PRO';

// Also check if user is currently in Recruiter role
const canAccessRecruiterPro = hasRecruiterPro && user.role === 'RECRUITER';
```

## Implementation Status

### ✅ Completed
- Database schema updated with `planType` field
- Payment flow determines correct plan type
- Job Seeker pages show ৳299
- Recruiter pages show ৳999
- Dev server restarted to load new Prisma client

### ⚠️ Next Steps Required

1. **Update Feature Access Checks**
   - Currently only checking `plan === 'PRO'`
   - Need to check `planType` AND `user.role`
   
2. **Handle Role Switching**
   - If Job Seeker Pro switches to Recruiter → Show upgrade prompt
   - If All Features Pro switches roles → Keep Pro access

3. **Subscription Management**
   - Allow users to see their current plan type
   - Show upgrade options (৳299 → ৳999)
   - Handle subscription cancellation

## Key Differences from Previous Implementation

**Before:**
- ৳299 + ৳999 = ৳1,298 for both features
- Two separate subscriptions

**Now:**
- ৳299 = Job Seeker ONLY (loses access if switches role)
- ৳999 = EVERYTHING (works for both roles)
- Simpler and clearer for users

## Testing Checklist

- [ ] Job Seeker pays ৳299 → Gets Job Seeker Pro features
- [ ] Job Seeker Pro switches to Recruiter → Loses Pro access
- [ ] Recruiter pays ৳999 → Gets ALL features
- [ ] All Features Pro switches to Job Seeker → Keeps Pro access
- [ ] Upgrade path: ৳299 → ৳999 works correctly
- [ ] Payment creates subscription with correct `planType`

## Recommendation

For best user experience, I recommend:
1. Show a warning when Job Seeker Pro tries to switch to Recruiter
2. Offer immediate upgrade to All Features Pro (৳999)
3. Clearly communicate that ৳999 includes EVERYTHING
