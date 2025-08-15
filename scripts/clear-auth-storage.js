// This script provides browser console commands to clear auth storage
console.log(`
🧹 AUTH STORAGE CLEANUP COMMANDS:

Copy and paste these commands in the browser console:

1. Clear Supabase auth data:
localStorage.removeItem('supabase.auth.token');
sessionStorage.clear();

2. Clear all localStorage:
localStorage.clear();

3. Clear all cookies:
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

4. Force page reload:
window.location.reload(true);

5. ALL IN ONE COMMAND:
localStorage.clear(); sessionStorage.clear(); document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); }); window.location.reload(true);

After running these commands, try signing in again.
`);


