import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
      
      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Show Your Bits, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. User Conduct</h2>
          <p>You agree to:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Provide accurate and complete information when creating your account</li>
            <li>Maintain the security of your account credentials</li>
            <li>Take responsibility for all activities that occur under your account</li>
            <li>Not use the service for any illegal or unauthorized purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. Content Guidelines</h2>
          <p>Users must not post content that:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Is illegal, harmful, or offensive</li>
            <li>Infringes on intellectual property rights</li>
            <li>Contains malware or malicious code</li>
            <li>Violates the privacy of others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">4. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms 
            or engage in inappropriate behavior. Users may also delete their own accounts 
            at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">5. Service Modifications</h2>
          <p>
            We may modify or discontinue any part of our service at any time. We will make 
            reasonable efforts to notify users of significant changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
          <p>
            Show Your Bits is provided "as is" without warranties of any kind. We are not 
            liable for any damages arising from your use of our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">7. Contact</h2>
          <p>
            If you have questions about these Terms of Service, please contact us through 
            the feedback form available in the application.
          </p>
        </section>

        <section className="text-sm text-gray-400">
          <p>Last updated: January 18, 2025</p>
        </section>
      </div>
    </div>
  );
}
