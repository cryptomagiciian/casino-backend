# 🔧 Troubleshooting Guide

## 🐛 "Games stop working after 10 seconds"

### Possible Causes:

#### 1. **JWT Token Expiration** (Most Common)
**Symptom**: Games work fine, then suddenly stop with 401 errors after a few minutes.

**Solution**:
- The JWT token expires after 15 minutes by default
- Updated `api.ts` now handles 401 errors and redirects to login
- Check browser console for "Token expired" messages

**Quick Fix**:
- Just login again when this happens
- Or extend JWT expiration time (see Backend Configuration below)

---

#### 2. **Rate Limiting**
**Symptom**: Too many requests message, 429 errors.

**Solution**:
- Backend allows 100 requests per 60 seconds
- If playing very fast, you might hit this limit
- Wait 60 seconds and try again
- Updated `api.ts` now shows friendly rate limit message

---

#### 3. **Browser Console Errors**
**Check These**:
```
F12 → Console Tab
```

Look for:
- ❌ `401 Unauthorized` = Token expired, login again
- ❌ `429 Too Many Requests` = Rate limit hit, wait 60s
- ❌ `Game not found` = Game name mismatch (should be fixed now)
- ❌ `Network error` = Backend is down or CORS issue

---

## 🔍 Debugging Steps

### Step 1: Open Browser Console
1. Press `F12` or right-click → Inspect
2. Go to **Console** tab
3. Try the game again
4. Look for error messages

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Filter by "XHR" or "Fetch"
3. Try the game
4. Look for RED (failed) requests
5. Click on failed request to see details

### Step 3: Check JWT Token
```javascript
// Paste this in browser console:
localStorage.getItem('accessToken')
```

If it returns `null`, you need to login again.

### Step 4: Test Backend
Open these URLs in a new tab:
- Health check: https://casino-backend-production-8186.up.railway.app/api/v1/health
- API docs: https://casino-backend-production-8186.up.railway.app/docs

If these don't load, backend might be down.

---

## 🛠️ Backend Configuration

### Extend JWT Token Expiration

In Railway, set environment variable:
```
JWT_EXPIRES_IN=1h
```

Options:
- `15m` = 15 minutes (default)
- `1h` = 1 hour
- `24h` = 1 day
- `7d` = 7 days (not recommended for production)

### Increase Rate Limit

In Railway, set these variables:
```
THROTTLE_TTL=60          # seconds
THROTTLE_LIMIT=200       # requests per TTL
```

This would allow 200 requests per minute instead of 100.

---

## 🔄 Common Fixes

### "Session expired" Message
**Solution**: Login again. Your session expired after 15 minutes.

### "Too many requests" Message
**Solution**: Wait 60 seconds. You've hit the rate limit.

### Games load but don't respond
**Solution**: 
1. Check browser console for errors
2. Refresh the page
3. Login again if token expired

### Balance doesn't update
**Solution**:
1. Refresh the page
2. Click on wallet to force reload
3. Check if bet actually went through (network tab)

---

## 🎮 Testing Checklist

If games stop working:

- [ ] Open browser console (F12)
- [ ] Check for 401 errors → Login again
- [ ] Check for 429 errors → Wait 60 seconds
- [ ] Check localStorage has token
- [ ] Test backend health endpoint
- [ ] Try refreshing the page
- [ ] Try different browser
- [ ] Clear cache and cookies
- [ ] Login again

---

## 📊 Expected Behavior

### Normal Flow:
1. ✅ Login → Get JWT token (15min expiration)
2. ✅ Play games → Token sent with each request
3. ✅ After 15 minutes → Token expires
4. ✅ Next request → 401 error
5. ✅ Frontend → Auto logout + redirect to login
6. ✅ Login again → Get new token

---

## 🚨 Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Session expired` | JWT token expired | Login again |
| `Too many requests` | Rate limit hit | Wait 60 seconds |
| `Game not found` | Wrong game name | Update to use underscores |
| `Network error` | Backend down / CORS | Check backend health |
| `Unauthorized` | No token or expired | Login again |
| `Bad Request` | Invalid bet params | Check game parameters |

---

## 💡 Pro Tips

1. **Keep Console Open**: Always have browser console open while testing
2. **Monitor Network**: Watch network tab to see API calls
3. **Check Timing**: Note when errors start (after 15 min = token expiration)
4. **Test Systematically**: Try one game at a time
5. **Document Errors**: Screenshot console errors for troubleshooting

---

## 🔐 Security Note

**Why tokens expire?**
- Security best practice
- Prevents session hijacking
- Forces periodic re-authentication
- Limits damage if token is stolen

**Production Recommendation:**
- Keep token expiration at 15-60 minutes
- Implement refresh tokens for seamless UX
- Add auto-refresh before token expires

---

## 📞 Still Having Issues?

### Collect This Info:
1. Browser console screenshot
2. Network tab screenshot (failed request)
3. Exact error message
4. What were you doing when it failed?
5. How long had you been playing?

### Backend Logs:
Check Railway logs for server-side errors:
https://railway.app/dashboard → Your Project → Deployments → Logs

---

## ✅ API.ts Update Summary

The updated `api.ts` file now:
- ✅ Logs all requests/responses to console
- ✅ Handles 401 errors gracefully
- ✅ Shows user-friendly error for rate limiting
- ✅ Auto-logs out on token expiration
- ✅ Redirects to login when needed

Copy the updated `api.ts` from `lovable-files/api.ts` to your project!

---

**Most Common Issue**: JWT token expiration after 15 minutes. Just login again!

