# 🚀 QUICK START GUIDE - Phase 1 Candidate Module

## ⚡ Immediate Testing (5 Minutes)

### Step 1: Start Backend Server
```bash
cd d:/AskoxyliveWeb
npm start
```
✅ Backend should run on `http://localhost:3001`

### Step 2: Start Frontend
```bash
cd d:/AskoxyliveWeb/askoxy
npm start
```
✅ Frontend should run on `http://localhost:3000`

### Step 3: Test Candidate Module
Open browser and navigate to:
```
http://localhost:3000/candidate/dashboard
```

---

## 🧪 Quick Test Checklist

### Dashboard Page
- [ ] Navigate to `/candidate/dashboard`
- [ ] See 4 stat cards (Resume Score, ATS Score, Total Interviews, Passed)
- [ ] See "Upcoming Interviews" section
- [ ] See "Recent Activity" section
- [ ] See "Latest Scorecards" section

### Interview History
- [ ] Navigate to `/candidate/history`
- [ ] See search bar
- [ ] See filter dropdown (All/Passed/Failed/Pending)
- [ ] See interview list
- [ ] Click "View Details" button
- [ ] Click "Download Scorecard" button
- [ ] Test pagination (if more than 10 items)

### Upcoming Interviews
- [ ] Navigate to `/candidate/upcoming`
- [ ] See list of upcoming interviews
- [ ] See date, time, job title, company
- [ ] See status badges

### Profile Settings
- [ ] Navigate to `/candidate/profile`
- [ ] Fill in personal information
- [ ] Add skills (type and click Add)
- [ ] Remove skills (click X)
- [ ] Upload resume (PDF/DOC/DOCX)
- [ ] Click "Save Changes"
- [ ] See success toast notification

### Notifications
- [ ] Navigate to `/candidate/notifications`
- [ ] See notification list
- [ ] Click "Mark as Read" on individual notification
- [ ] Click "Mark All as Read"
- [ ] Click delete icon
- [ ] See unread count badge in sidebar

### Responsive Design
- [ ] Resize browser to mobile width (< 768px)
- [ ] Click hamburger menu icon
- [ ] Navigate between pages
- [ ] Verify mobile layout works

---

## 🔍 What to Look For

### ✅ Success Indicators
- Pages load without errors
- Navigation works smoothly
- Forms are functional
- Buttons respond to clicks
- Loading states appear
- Empty states show when no data
- Toast notifications appear
- Responsive design works

### ❌ Potential Issues
- 404 errors → Check backend is running
- Blank pages → Check browser console
- API errors → Verify backend endpoints
- Style issues → Check Tailwind config
- Redux errors → Check store configuration

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /candidate/dashboard"
**Solution**: Ensure React Router is configured
```bash
# Restart frontend
npm start
```

### Issue: "Network Error" or API 404
**Solution**: Backend not running or wrong port
```bash
# Check backend is on port 3001
cd d:/AskoxyliveWeb
npm start
```

### Issue: "Module not found"
**Solution**: Install dependencies
```bash
cd d:/AskoxyliveWeb/askoxy
npm install
```

### Issue: Tailwind styles not working
**Solution**: Check tailwind.config.js includes src folder
```javascript
content: ['./src/**/*.{js,jsx,ts,tsx}']
```

### Issue: Redux state undefined
**Solution**: Check store/index.ts has reducers
```typescript
candidate: candidateReducer,
notification: notificationReducer,
```

---

## 📊 Expected API Calls

When you navigate to pages, these API calls should be made:

### Dashboard
```
GET /api/candidate/dashboard/:userId
```

### Interview History
```
GET /api/candidate/interviews/:userId
```

### Upcoming Interviews
```
GET /api/candidate/upcoming/:userId
```

### Profile
```
GET /api/candidate/profile/:userId
PUT /api/candidate/profile/:userId
```

### Notifications
```
GET /api/notifications/:userId
PUT /api/notifications/:id/read
```

### Resume Upload
```
POST /api/upload-resume
```

---

## 🎯 Mock Data for Testing

If backend is not ready, you can test with mock data:

### Option 1: Use Browser Console
```javascript
// Set mock user
localStorage.setItem('userId', 'test-user-123');
localStorage.setItem('user', JSON.stringify({
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com'
}));
```

### Option 2: Mock API Responses
Update `candidateAPI.ts` temporarily:
```typescript
export const getDashboard = async (userId: string) => {
  // Mock response
  return {
    resumeScore: 85,
    atsScore: 90,
    totalInterviews: 10,
    passedInterviews: 7,
    upcomingInterviews: [],
    recentActivity: [],
    latestScorecards: []
  };
};
```

---

## 📱 Mobile Testing

### iOS Safari
1. Open Safari on iPhone
2. Navigate to `http://YOUR_IP:3000/candidate/dashboard`
3. Test touch interactions
4. Test hamburger menu

### Android Chrome
1. Open Chrome on Android
2. Navigate to `http://YOUR_IP:3000/candidate/dashboard`
3. Test touch interactions
4. Test hamburger menu

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Click device toolbar icon
3. Select iPhone/iPad/Android
4. Test responsive design

---

## 🎨 Visual Verification

### Colors Should Be
- Primary buttons: Blue (#2563eb)
- Success badges: Green (#16a34a)
- Error badges: Red (#dc2626)
- Warning badges: Yellow (#eab308)

### Layout Should Have
- Sidebar on left (desktop)
- Main content area
- White background cards
- Gray borders
- Rounded corners
- Shadows on cards

### Interactions Should
- Buttons change color on hover
- Cards have hover effects
- Forms validate on submit
- Toasts appear top-right
- Loading spinners show

---

## ✅ Success Criteria

Phase 1 is successful if:

1. ✅ All 5 pages load without errors
2. ✅ Navigation between pages works
3. ✅ Forms can be filled and submitted
4. ✅ Search and filter work
5. ✅ Pagination works (if data available)
6. ✅ Notifications can be marked as read
7. ✅ Resume can be uploaded
8. ✅ Skills can be added/removed
9. ✅ Mobile responsive design works
10. ✅ No console errors

---

## 📞 Next Steps After Testing

### If Everything Works ✅
1. Review code quality
2. Add more test data
3. Test edge cases
4. Prepare for Phase 2

### If Issues Found ❌
1. Check browser console
2. Check network tab
3. Verify backend is running
4. Review error messages
5. Check documentation

---

## 🚀 Ready for Phase 2?

Once Phase 1 testing is complete and successful, we can proceed with:

### Phase 2: Recruiter Enhancements
- Advanced filtering
- Bulk actions
- Interview scheduling
- Email templates
- Analytics dashboard
- Export functionality

---

## 📚 Documentation Links

- **Complete Guide**: `PHASE1_CANDIDATE_MODULE.md`
- **Component Usage**: `COMPONENT_USAGE_GUIDE.md`
- **Summary**: `PHASE1_SUMMARY.md`
- **This Guide**: `QUICK_START.md`

---

## 🎉 You're Ready!

Everything is set up and ready to test. Just follow the steps above and verify each feature works as expected.

**Happy Testing! 🚀**

---

*Last Updated: ${new Date().toISOString()}*
