
## Goal

Temporarily bypass SMTP for password resets. When a user submits their email on the Forgot Password page, generate a recovery link server-side and display it directly on the page so they (or an admin helping them) can copy/paste it into the browser. No email is sent.

This is acceptable because the app is internal-only while IT sorts out the relay.

## How it works

```text
ForgotPassword page
   │  email
   ▼
Edge Function: generate-recovery-link  (uses SERVICE_ROLE_KEY)
   │  supabase.auth.admin.generateLink({ type: 'recovery', email,
   │     redirectTo: <site>/reset-password })
   ▼
Returns { action_link }
   │
   ▼
ForgotPassword page shows the link in a read-only box with a "Copy" button
```

The existing `/reset-password` page already handles the recovery token in the URL hash, so no changes are needed there.

## Changes

1. **New edge function** `supabase/functions/generate-recovery-link/index.ts`
   - Public (no JWT required) — same access surface as the current "send reset email" call.
   - Input: `{ email: string }`.
   - Uses `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_URL` (already configured).
   - Calls `supabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: '<origin>/reset-password' }})`.
   - Returns `{ action_link }` on success. Always returns 200 with a generic shape even if the email doesn't exist, to avoid user enumeration — but since this is internal-only and the goal is usability, we'll return the link when the email exists and a clear "no user found" message when it doesn't. (Confirm preference below.)
   - CORS headers included.

2. **Update `src/pages/ForgotPassword.tsx`**
   - Replace the current `supabase.auth.resetPasswordForEmail(...)` call with `supabase.functions.invoke('generate-recovery-link', { body: { email, redirectTo: `${window.location.origin}/reset-password` } })`.
   - On success: render the returned link in a read-only `<Input>` (or textarea) with a "Copy link" button (uses `navigator.clipboard.writeText`) and a short instruction: "Send this link to the user — it expires in 1 hour."
   - Keep existing error handling for invalid email / unknown user.
   - Add a small amber banner: "Temporary: links are shown here while email delivery is being configured."

3. **No DB migration, no changes to `/reset-password`, no auth config changes.**

## Reverting later

When SMTP is fixed, swap the `ForgotPassword.tsx` handler back to `supabase.auth.resetPasswordForEmail(...)` and delete the edge function. Nothing else is affected.

## One thing to confirm

- Who should be able to use this page? Two options:
  - **(a) Anyone** (current behaviour) — anyone who knows an email can generate a working reset link for that account. Fine on a closed internal network, risky if the app is reachable externally.
  - **(b) Admins only** — require the caller to be signed in as an `admin`/`content_admin`. Regular users who forgot their password ask an admin to generate the link.

Which do you prefer?
