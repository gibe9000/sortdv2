import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Sortd",
  description:
    "Privacy Policy for Sortd: how Gmail data is accessed, processed with Google Gemini, stored minimally, and protected. Covers scopes, retention, security, and user controls.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Privacy Policy for Sortd</h1>
      <p className="mt-2 text-sm text-gray-500">Effective Date: 30/3/2026</p>
      <p className="text-sm text-gray-500">Last Updated: 30/3/2026</p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">1. Overview</h2>
        <p>
          Sortd is a Gmail organization service that helps users label unread Gmail messages using their existing Gmail labels.
        </p>
        <p>
          To provide this service, Sortd accesses unread Gmail messages, temporarily processes message content to classify messages, and applies labels in the user’s Gmail account. Sortd is designed to minimize data retention and data sharing. Sortd does not store email body content, attachments, or persistent copies of subject lines. Sortd stores only the minimum data needed to operate the service, including message IDs and applied label information.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">2. Who We Are</h2>
        <p>If you have questions about this Privacy Policy or our data practices, contact:</p>
        <p>
          Email: <a className="underline" href="mailto:chrisinthemovies@gmail.com">chrisinthemovies@gmail.com</a>
          <br />
          Website: <a className="underline" href="https://sortd.tech" target="_blank" rel="noreferrer">sortd.tech</a>
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">3. Gmail Data We Access</h2>
        <p>When a user connects a Gmail account to Sortd, Sortd may access the following Gmail data:</p>
        <ul className="list-disc pl-5">
          <li>Unread email message content</li>
          <li>Email subject lines</li>
          <li>Sender information</li>
          <li>Message metadata made available through the Gmail API</li>
          <li>Existing Gmail labels and label identifiers</li>
        </ul>
        <p>
          Sortd accesses this data solely to determine which of the user’s existing Gmail labels should be applied to unread messages.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">4. Google OAuth Scopes We Request</h2>
        <p>Sortd requests the following Google OAuth scopes:</p>
        <ul className="list-disc pl-5">
          <li>https://www.googleapis.com/auth/gmail.readonly</li>
          <li>https://www.googleapis.com/auth/gmail.labels</li>
        </ul>
        <p>These scopes are used as follows:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong>gmail.readonly</strong>: allows Sortd to read unread Gmail messages so they can be classified
          </li>
          <li>
            <strong>gmail.labels</strong>: allows Sortd to read and apply Gmail labels
          </li>
        </ul>
        <p>Sortd does not request broader Gmail permissions than are needed for this functionality.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">5. How We Use Gmail Data</h2>
        <p>Sortd uses Gmail data only to provide the user-facing functionality of the service, specifically:</p>
        <ul className="list-disc pl-5">
          <li>Reading unread Gmail messages</li>
          <li>Determining which existing Gmail label best fits a message</li>
          <li>Applying that label in the user’s Gmail account</li>
          <li>Tracking which messages have already been processed to avoid duplicate labeling</li>
        </ul>
        <p>Sortd does not use Gmail data for:</p>
        <ul className="list-disc pl-5">
          <li>Advertising</li>
          <li>Sale of data</li>
          <li>Building marketing profiles</li>
          <li>Training generalized AI or machine learning models</li>
          <li>Any purpose unrelated to the user-facing functionality of Sortd</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">6. AI Processing</h2>
        <p>
          Sortd uses Google Gemini AI to analyze unread message content and determine which of the user’s existing Gmail labels should be applied.
        </p>
        <p>
          Sortd chose Gemini specifically to minimize data spread. Email content processed for classification remains within Google’s ecosystem rather than being sent to an unrelated third-party AI provider.
        </p>
        <p>
          Email content is processed only for the time needed to classify the message. Sortd does not store email content after processing.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">7. What Sortd Stores</h2>
        <p>Sortd stores only the minimum information required to operate the service. This may include:</p>
        <ul className="list-disc pl-5">
          <li>User account identifier or email address</li>
          <li>OAuth connection and token data</li>
          <li>Gmail message IDs</li>
          <li>Label names or label identifiers</li>
          <li>Records of which label was applied to which message</li>
          <li>Limited technical logs for security, debugging, and service reliability</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">8. What Sortd Does Not Store</h2>
        <p>Sortd does not store:</p>
        <ul className="list-disc pl-5">
          <li>Email body content</li>
          <li>Attachments</li>
          <li>Persistent copies of subject lines</li>
          <li>Persistent copies of sender or recipient message content</li>
          <li>Archived copies of users’ inboxes</li>
        </ul>
        <p>
          Email content is handled temporarily during active processing only and is not retained by Sortd after classification is complete.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">9. Third-Party Services and Data Sharing</h2>
        <p>Sortd uses the following service providers to operate the service:</p>
        <h3 className="text-lg font-semibold">Google</h3>
        <p>Used for:</p>
        <ul className="list-disc pl-5">
          <li>Gmail API access</li>
          <li>OAuth authentication</li>
          <li>Gemini AI processing</li>
        </ul>
        <p>
          Privacy Policy: <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">https://policies.google.com/privacy</a>
        </p>
        <h3 className="text-lg font-semibold">Supabase</h3>
        <p>Used for:</p>
        <ul className="list-disc pl-5">
          <li>Database and backend infrastructure</li>
        </ul>
        <p>
          Privacy Policy: <a className="underline" href="https://supabase.com/privacy" target="_blank" rel="noreferrer">https://supabase.com/privacy</a>
        </p>
        <p>Sortd does not sell user data.</p>
        <p>Sortd does not share Gmail content with data brokers or advertisers.</p>
        <p>Sortd does not send Gmail content to unrelated third-party AI providers for classification.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">10. Data Retention</h2>
        <p>Sortd retains stored account and processing data only as long as necessary to provide the service.</p>
        <p>This may include:</p>
        <ul className="list-disc pl-5">
          <li>Account and connection data while the account is active</li>
          <li>Message ID and label assignment records while needed for service functionality</li>
          <li>Technical logs for a limited time for security and operational purposes</li>
        </ul>
        <p>
          If a user deletes their account or requests deletion, Sortd will delete stored personal data within 7 days, except where retention is required by law or necessary for security or fraud prevention.
        </p>
        <p>Email content is not retained by Sortd after active processing.</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">11. Security</h2>
        <p>Sortd uses reasonable administrative, technical, and organizational safeguards to protect user data, including:</p>
        <ul className="list-disc pl-5">
          <li>Encryption in transit using HTTPS/TLS</li>
          <li>Secure handling of OAuth credentials</li>
          <li>Access controls for stored data</li>
          <li>Data minimization practices</li>
          <li>Use of established infrastructure providers such as Supabase</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">12. User Controls</h2>
        <p>Users may:</p>
        <ul className="list-disc pl-5">
          <li>Revoke Sortd’s Gmail access at any time through their Google account permissions</li>
          <li>Request deletion of their Sortd account and stored data</li>
          <li>Stop using the service at any time</li>
        </ul>
        <p>
          To request deletion or ask privacy-related questions, contact <a className="underline" href="mailto:chrisinthemovies@gmail.com">chrisinthemovies@gmail.com</a>.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">13. Compliance with Google API Services User Data Policy</h2>
        <p>
          Sortd’s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.
        </p>
        <p>Specifically:</p>
        <ul className="list-disc pl-5">
          <li>Gmail data is used only to provide or improve user-facing features requested by the user</li>
          <li>Gmail data is not used for advertising</li>
          <li>Gmail data is not sold</li>
          <li>Gmail data is not used to train generalized AI or machine learning models</li>
          <li>
            Gmail data is not transferred to third parties except as necessary to provide and secure the service in accordance with this Privacy Policy
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">14. International Users</h2>
        <p>
          If you access Sortd from outside the country where Sortd or its service providers operate, your information may be processed in other jurisdictions. Where required, Sortd will use appropriate safeguards for international data transfers.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">15. Children’s Privacy</h2>
        <p>
          Sortd is not intended for children under 13, or the minimum age required in the user’s jurisdiction. Sortd does not knowingly collect personal information from children.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">16. Changes to This Privacy Policy</h2>
        <p>
          Sortd may update this Privacy Policy from time to time. If material changes are made, Sortd will update the “Last Updated” date and may provide additional notice where appropriate.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">17. Contact</h2>
        <p>If you have questions about this Privacy Policy or would like to request deletion of your data, contact:</p>
        <p>
          <strong>Sortd</strong>
          <br />
          Email: <a className="underline" href="mailto:chrisinthemovies@gmail.com">chrisinthemovies@gmail.com</a>
          <br />
          Website: <a className="underline" href="https://sortd.tech" target="_blank" rel="noreferrer">sortd.tech</a>
        </p>
      </section>
    </main>
  );
}
