// Shared Google OAuth options for login and reconnect flows.
// Client-side only (uses location.origin).
export function googleOAuthOptions() {
    return {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
            access_type: 'offline',
            prompt: 'consent',
        },
        scopes: 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.modify email profile openid',
    }
}
