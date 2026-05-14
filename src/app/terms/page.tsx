import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Terms of Service — STAG'D",
  description: "The terms and conditions governing your use of Stag'd.",
};

const LAST_UPDATED = 'May 14, 2026';

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '80px var(--gutter) 120px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>
          // Legal
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 8vw, 72px)', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text)', marginBottom: '12px' }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-faint)', marginBottom: '60px' }}>
          Last updated: {LAST_UPDATED}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)' }}>

          <section>
            <h2 style={h2}>1. Agreement to Terms</h2>
            <p>
              By creating an account or using stagd.app, you agree to be bound by these Terms of Service and our{' '}
              <Link href="/privacy" style={link}>Privacy Policy</Link>. These terms form a binding agreement between you and Stag'd ("we", "us"). If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 style={h2}>2. Who May Use Stag'd</h2>
            <p>
              You must be at least 16 years old to create an account. By registering, you confirm that the information you provide is accurate, that you are at least 16, and that you are legally permitted to enter into this agreement.
            </p>
            <p style={{ marginTop: '12px' }}>
              Accounts are personal and non-transferable. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
            </p>
          </section>

          <section>
            <h2 style={h2}>3. Account Types</h2>
            <p><strong style={strong}>Creative</strong> — For independent artists, musicians, photographers, illustrators, filmmakers, and other creators. Creatives receive a public portfolio page at stagd.app/[username], a commission inbox, and the ability to list ticketed events.</p>
            <p style={{ marginTop: '12px' }}><strong style={strong}>General</strong> — For people who discover, hire creatives, and attend events. General accounts do not have public portfolio pages.</p>
            <p style={{ marginTop: '12px' }}>Your account type is set at registration. General users may request a Creative upgrade through their profile settings — this is reviewed manually. Once upgraded, accounts cannot revert to General status.</p>
          </section>

          <section>
            <h2 style={h2}>4. Content You Post</h2>
            <p>
              You retain ownership of all content you upload to Stag'd — portfolio images, project descriptions, event listings, commission briefs, and messages.
            </p>
            <p style={{ marginTop: '12px' }}>
              By posting content on Stag'd, you grant us a non-exclusive, worldwide, royalty-free licence to display, distribute, and promote that content within the platform and in Stag'd's own marketing materials (social media, press, and promotional use). We will not alter your work or attribute it to anyone other than you.
            </p>
            <p style={{ marginTop: '12px' }}>You are solely responsible for ensuring your content:</p>
            <ul style={list}>
              <li>Does not infringe the intellectual property rights of any third party</li>
              <li>Does not contain unlawful, defamatory, or obscene material</li>
              <li>Does not misrepresent your identity, credentials, or the nature of your work</li>
            </ul>
            <p style={{ marginTop: '12px' }}>We reserve the right to remove content that violates these terms at our discretion, without prior notice.</p>
          </section>

          <section>
            <h2 style={h2}>5. Commissions</h2>
            <p>
              Stag'd provides the tools for Creatives and clients to find each other, negotiate, and document agreements. Any commission, project, or payment arrangement is a direct agreement between the two parties involved. Stag'd is not a party to those transactions and is not liable for disputes, non-delivery, or payment failures arising from them.
            </p>
            <p style={{ marginTop: '12px' }}>
              Commission payments in V1 are made off-platform. The payment confirmation layer inside Stag'd (mark as paid, confirm receipt) is a record-keeping tool only — it is not a payment processor, escrow, or guarantee of any kind.
            </p>
            <p style={{ marginTop: '12px' }}>
              In-app escrow is planned for a future version and will be communicated clearly when available.
            </p>
          </section>

          <section>
            <h2 style={h2}>6. Event Ticketing</h2>
            <p>Stag'd processes ticket payments on behalf of event organisers through our integrated payment gateway. When you purchase a ticket:</p>
            <ul style={list}>
              <li>Your payment is collected by Stag'd and held until the payout schedule defined in the Event Organiser Agreement is triggered</li>
              <li>A QR-coded ticket is issued to you immediately upon payment confirmation</li>
              <li>Your ticket is for single-entry use only — the QR code is invalidated upon first scan</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              <strong style={strong}>Refunds:</strong> If an event is cancelled by the organiser before doors open, you will receive a full refund including the service fee, returned to your original payment method. Refund processing times are subject to your payment provider.
            </p>
            <p style={{ marginTop: '12px' }}>
              Once an event's doors have opened and scanning has commenced, the event is considered to have taken place. Refunds are not available after this point except at the organiser's discretion.
            </p>
            <p style={{ marginTop: '12px' }}>
              Stag'd is not responsible for the quality, safety, or delivery of any event. Our responsibility is limited to the ticketing and payment infrastructure.
            </p>
          </section>

          <section>
            <h2 style={h2}>7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul style={list}>
              <li>Impersonate any person or entity, or misrepresent your identity, credentials, or affiliation</li>
              <li>Upload content that is defamatory, obscene, or infringes third-party intellectual property rights</li>
              <li>Use the platform to spam, harass, threaten, or abuse other users</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the platform in bulk</li>
              <li>Use automated tools or bots to create accounts or interact with the platform</li>
              <li>Resell, transfer, or fraudulently duplicate tickets issued through the platform</li>
              <li>List events with intent to defraud buyers</li>
              <li>Use the platform for any purpose that is unlawful under Pakistani law</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Violations may result in immediate account suspension or termination without notice.</p>
          </section>

          <section>
            <h2 style={h2}>8. Intellectual Property</h2>
            <p>
              The Stag'd name, logo, visual identity, platform design, code, and copy are the property of Stag'd. You may not reproduce, copy, or use them without prior written permission.
            </p>
            <p style={{ marginTop: '12px' }}>
              User-generated content remains the property of the user who created it, subject to the licence granted in Section 4.
            </p>
          </section>

          <section>
            <h2 style={h2}>9. Termination</h2>
            <p>
              You may delete your account at any time from your profile settings. Upon deletion, your public profile is removed within 30 days as described in our Privacy Policy. Active commission threads and ticketing records are retained as described in the Privacy Policy.
            </p>
            <p style={{ marginTop: '12px' }}>
              We may suspend or terminate accounts that violate these terms. Serious violations — including fraud, harassment, or repeated intellectual property infringement — may result in immediate termination without notice. We will provide notice where reasonably possible for less serious violations.
            </p>
          </section>

          <section>
            <h2 style={h2}>10. Disclaimers</h2>
            <p>Stag'd is provided "as is" without warranties of any kind, express or implied. We do not guarantee:</p>
            <ul style={list}>
              <li>Uninterrupted or error-free access to the platform</li>
              <li>The accuracy, completeness, or quality of user-generated content</li>
              <li>The outcome of any transaction, commission, or event between users</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Use of the platform is at your own risk.</p>
          </section>

          <section>
            <h2 style={h2}>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Stag'd is not liable for any indirect, incidental, consequential, or reputational damages arising from your use of — or inability to use — the platform, including losses arising from disputes between users, event cancellations, or payment failures.
            </p>
            <p style={{ marginTop: '12px' }}>
              Our total liability to you for any claim arising from these terms or your use of the platform shall not exceed the amount you paid to Stag'd in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 style={h2}>12. Governing Law</h2>
            <p>
              These terms are governed by the laws of Pakistan. Any disputes that cannot be resolved directly shall be subject to the jurisdiction of the courts of Karachi, Pakistan.
            </p>
          </section>

          <section>
            <h2 style={h2}>13. Changes to These Terms</h2>
            <p>
              We may update these terms as the platform evolves. Material changes will be communicated by email or through an in-app notice before they take effect. Continued use of the platform after that point constitutes acceptance of the revised terms.
            </p>
            <p style={{ marginTop: '12px' }}>
              The version date at the top of this page always reflects when the terms were last updated.
            </p>
          </section>

          <section>
            <h2 style={h2}>14. Contact</h2>
            <p>
              Stag'd<br />
              Karachi, Pakistan<br />
              <a href="mailto:info@stagd.app" style={link}>info@stagd.app</a>
            </p>
          </section>

        </div>

        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '24px' }}>
          <Link href="/privacy" style={link}>Privacy Policy →</Link>
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
