import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Privacy Policy — STAG'D",
  description: "How Stag'd collects, uses, and protects your personal information.",
};

const LAST_UPDATED = 'May 14, 2026';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '80px var(--gutter) 120px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>
          // Legal
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 8vw, 72px)', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text)', marginBottom: '12px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-faint)', marginBottom: '60px' }}>
          Last updated: {LAST_UPDATED}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>

          <section>
            <h2 style={h2}>1. Who We Are</h2>
            <p>
              Stag'd is a creative economy platform based in Karachi, Pakistan. We connect independent creatives — illustrators, photographers, musicians, muralists, filmmakers, and more — with the people who want to discover, hire, and experience them.
            </p>
            <p style={{ marginTop: '12px' }}>
              This policy explains what personal information we collect when you use stagd.app, how we use it, and what rights you have over it.
            </p>
            <p style={{ marginTop: '12px' }}>
              Questions? Email us at <a href="mailto:info@stagd.app" style={link}>info@stagd.app</a>
            </p>
          </section>

          <section>
            <h2 style={h2}>2. Information We Collect</h2>
            <p><strong style={strong}>Account information</strong><br />
              When you create an account, we collect your name, phone number, and account type (Creative or General). If you sign in with Google, we receive your name, email address, and profile photo from Google.</p>

            <p style={{ marginTop: '12px' }}><strong style={strong}>Profile information</strong><br />
              Information you choose to add to your profile: bio, city, disciplines, portfolio images, starting rate, social media handles, and availability status. For Creatives who send invoices, we also store bank account details (account title, bank name, account number, and IBAN). This financial information is stored securely and is never displayed publicly.</p>

            <p style={{ marginTop: '12px' }}><strong style={strong}>Commission and booking data</strong><br />
              When you use the commissions feature — whether as a client or a creative — we store the content of your brief, proposals, messages, payment confirmation records, and project status updates. This data exists to document your agreement and protect both parties.</p>

            <p style={{ marginTop: '12px' }}><strong style={strong}>Ticketing data</strong><br />
              When you purchase a ticket, we collect your name, email address, payment information (processed by Safepay), and a record of your purchase including the ticket ID and tier. When your ticket is scanned at a venue, the scan time and entry status are logged against your ticket record.</p>

            <p style={{ marginTop: '12px' }}><strong style={strong}>Event organiser data</strong><br />
              If you list events on Stag'd, we collect your event details, ticket tier configuration, door staff assignments, and payout bank or wallet details.</p>

            <p style={{ marginTop: '12px' }}><strong style={strong}>Usage data</strong><br />
              Standard server logs: IP addresses, browser type, pages visited, and timestamps. This data is used for platform security and performance — not for advertising profiles.</p>
          </section>

          <section>
            <h2 style={h2}>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul style={list}>
              <li>Create and maintain your account</li>
              <li>Display your public Creative profile to other users</li>
              <li>Facilitate commissions, briefs, and negotiations between creatives and clients</li>
              <li>Process ticket purchases and generate QR codes for event entry</li>
              <li>Manage door verification and entry logging at events</li>
              <li>Process payouts to event organisers and creatives</li>
              <li>Send transactional communications — ticket confirmations, commission updates, invoice delivery, and account changes</li>
              <li>Detect and prevent fraud, abuse, and unauthorised access</li>
              <li>Improve the platform based on aggregated, anonymised usage patterns</li>
              <li>Publish industry reports (e.g. our annual Creative Economy Report) using aggregated, non-attributable platform data</li>
            </ul>
            <p style={{ marginTop: '12px' }}>We do not sell your personal data. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 style={h2}>4. What Is Public vs. Private</h2>
            <p><strong style={strong}>Publicly visible on your Creative profile:</strong><br />
              Name, bio, disciplines, city, portfolio images, availability status, social media handles, and follower count. Your public profile is accessible at stagd.app/[username] and is indexed by search engines.</p>

            <p style={{ marginTop: '12px' }}><strong style={strong}>Visible only to relevant parties:</strong><br />
              Commission messages and proposal details are only visible to the client and creative involved in that thread. Ticket purchase records are visible to the buyer and the event organiser (name and tier only — not payment method). Invoice details are shared between the creative and the client for that project.</p>

            <p style={{ marginTop: '12px' }}><strong style={strong}>Never publicly visible:</strong><br />
              Bank account details, IBAN, phone number, email address, and payment method information.<br />
              General (non-creative) user accounts do not have public profile pages.</p>
          </section>

          <section>
            <h2 style={h2}>5. Third-Party Services</h2>
            <p>We use the following services to operate the platform. Each processes only the data necessary for its function.</p>
            <ul style={list}>
              <li><strong style={strong}>Supabase</strong> — Database, authentication, and file storage</li>
              <li><strong style={strong}>Vercel</strong> — Web hosting and delivery</li>
              <li><strong style={strong}>Safepay</strong> — Payment processing (tickets and payouts)</li>
              <li><strong style={strong}>Resend</strong> — Transactional email delivery</li>
              <li><strong style={strong}>Google OAuth</strong> — Optional sign-in method</li>
              <li><strong style={strong}>Google Maps</strong> — Optional venue map embed on event pages</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Each provider is bound by their own privacy terms. We encourage you to review them if you'd like to understand how they handle data.</p>
          </section>

          <section>
            <h2 style={h2}>6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account remains active. If you delete your account, your profile and portfolio are removed within 30 days.
              Commission records, ticket purchase records, and payout logs may be retained for up to 7 years to comply with financial record-keeping obligations and to resolve any disputes that arise.
            </p>
          </section>

          <section>
            <h2 style={h2}>7. Your Rights</h2>
            <p>You may at any time:</p>
            <ul style={list}>
              <li>Access and update your profile information from your profile settings</li>
              <li>Delete your account from the profile settings page — this removes your public profile and portfolio</li>
              <li>Request a copy of your data by emailing <a href="mailto:info@stagd.app" style={link}>info@stagd.app</a></li>
              <li>Request deletion of specific data by emailing <a href="mailto:info@stagd.app" style={link}>info@stagd.app</a> — subject to retention obligations noted above</li>
              <li>Opt out of marketing communications via the unsubscribe link in any email</li>
            </ul>
            <p style={{ marginTop: '12px' }}>We aim to respond to all data requests within 14 days.</p>
          </section>

          <section>
            <h2 style={h2}>8. Cookies and Local Storage</h2>
            <p>
              We use session cookies and local storage to keep you signed in and to remember your preferences (such as theme). We do not use tracking cookies, advertising cookies, or third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2 style={h2}>9. Children</h2>
            <p>
              Stag'd is not intended for use by anyone under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has created an account, please contact us at <a href="mailto:info@stagd.app" style={link}>info@stagd.app</a> and we will remove it.
            </p>
          </section>

          <section>
            <h2 style={h2}>10. Changes to This Policy</h2>
            <p>
              We may update this policy as the platform grows. If we make material changes, we will notify you by email or through an in-app notice before the changes take effect. Continued use of the platform after that point constitutes acceptance of the updated policy.
            </p>
            <p style={{ marginTop: '12px' }}>
              The version date at the top of this page always reflects when the policy was last updated.
            </p>
          </section>

          <section>
            <h2 style={h2}>11. Contact</h2>
            <p>
              Stag'd<br />
              Karachi, Pakistan<br />
              <a href="mailto:info@stagd.app" style={link}>info@stagd.app</a>
            </p>
          </section>

        </div>

        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '24px' }}>
          <Link href="/terms" style={link}>Terms of Service →</Link>
          <Link href="/" style={{ ...link, color: 'var(--text-faint)' }}>Back to Home</Link>
        </div>

      </div>
    </div>
  );
}

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '20px',
  textTransform: 'uppercase',
  letterSpacing: '-0.01em',
  color: 'var(--text)',
  marginBottom: '12px',
};

const strong: React.CSSProperties = {
  color: 'var(--text)',
  fontWeight: 700,
};

const link: React.CSSProperties = {
  color: 'var(--text)',
  textDecorationLine: 'underline',
  textDecorationThickness: '1px',
  textUnderlineOffset: '3px',
};

const list: React.CSSProperties = {
  paddingLeft: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};
