# Frontend Performance Optimization Tips

## Current Issues in Donor Detail Page

The donor detail page (`/dashboard/donors/[id]/page.tsx`) makes multiple API calls on load:

1. `fetchDonor()` - Get donor details
2. `fetchDonations()` - Get donations (limit 100)
3. `fetchDonorInsights()` - Get insights
4. `fetchTemplates()` - Get templates
5. `fetchFamilyMembers()` - Get family members
6. `fetchSpecialOccasions()` - Get special occasions
7. `fetchPledges()` - Get pledges
8. `fetchSponsoredBeneficiaries()` - Get sponsorships
9. `fetchTimeline()` - Get timeline
10. `fetchCommunicationLogs()` - Get communication logs

**Problem**: All these run sequentially on page load, causing 2-3 second delays.

## Recommended Optimizations

### 1. Lazy Load Non-Critical Data

Only load essential data on initial page load:
- Donor details (critical)
- Basic stats (critical)

Load other data when user switches tabs:
- Donations (load when "Donations" tab is clicked)
- Timeline (load when "Timeline" tab is clicked)
- Communication logs (load when "Communication" tab is clicked)

### 2. Implement Data Prefetching

Use Next.js features:
```typescript
// In page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds
```

### 3. Add Loading States

Show skeleton loaders instead of blank screens:
```typescript
{loading ? <Skeleton /> : <DonorData />}
```

### 4. Reduce Initial Data Fetch

Change donation limit from 100 to 10:
```typescript
const res = await fetchWithAuth(
  `/api/donations?donorId=${donorId}&limit=10`, // Changed from 100
);
```

### 5. Implement Pagination

For large datasets:
- Donations: Show 10, load more on scroll
- Timeline: Already paginated (good!)
- Communication logs: Add pagination

### 6. Use React Query or SWR

For better caching and data management:
```bash
npm install @tanstack/react-query
```

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: donor, isLoading } = useQuery({
  queryKey: ['donor', donorId],
  queryFn: () => fetchDonor(donorId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 7. Optimize useEffect Dependencies

Current code has many useEffect hooks. Consolidate them:
```typescript
// Instead of multiple useEffects
useEffect(() => {
  fetchDonor();
}, [fetchDonor]);

useEffect(() => {
  fetchDonations();
}, [fetchDonations]);

// Use one with Promise.all
useEffect(() => {
  Promise.all([
    fetchDonor(),
    fetchDonations(),
  ]);
}, [donorId]);
```

## Quick Wins (Implement Now)

### 1. Reduce Donation Limit
**File**: `apps/web/src/app/(dashboard)/dashboard/donors/[id]/page.tsx`

Change line ~420:
```typescript
// Before
const res = await fetchWithAuth(`/api/donations?donorId=${donorId}&limit=100`);

// After
const res = await fetchWithAuth(`/api/donations?donorId=${donorId}&limit=20`);
```

### 2. Lazy Load Tabs
Only fetch data when tab is active:
```typescript
const [activeTab, setActiveTab] = useState('overview');

useEffect(() => {
  if (activeTab === 'donations' && donations.length === 0) {
    fetchDonations();
  }
}, [activeTab]);
```

### 3. Add Debouncing
For search and filter operations:
```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((query) => fetchResults(query), 300),
  []
);
```

## Performance Metrics to Track

1. **Time to First Byte (TTFB)**: < 200ms
2. **First Contentful Paint (FCP)**: < 1.5s
3. **Largest Contentful Paint (LCP)**: < 2.5s
4. **Time to Interactive (TTI)**: < 3.5s

## Testing

Use Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check:
   - Number of requests
   - Total load time
   - Waterfall view

## Next Steps

1. Implement lazy loading for tabs
2. Reduce initial data fetch
3. Add React Query for caching
4. Implement virtual scrolling for long lists
5. Add service worker for offline support

---

**Priority**: Medium  
**Impact**: 2-3x faster page loads  
**Effort**: 2-4 hours
