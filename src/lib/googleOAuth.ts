// Shared Google OAuth options for login and reconnect flows.
// Client-side only (uses location.origin).
//
// forceConsent shows Google's full permission screen and guarantees a fresh
// refresh token. Only needed when we don't have one (first connect after a
// disconnect, or a dead token). Normal logins skip it: Google shows consent
// automatically for first-time grants, and returning users keep their stored
// refresh token (the auth callback never overwrites it with an empty value).
export function googleOAuthOptions(opts?: { forceConsent?: boolean }) {
    return {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
            access_type: 'offline',
            ...(opts?.forceConsent ? { prompt: 'consent' } : {}),
        },
        scopes: 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.modify email profile openid',
    }
}
