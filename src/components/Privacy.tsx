import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Information We Collect</h2>
          <p>
            We collect information you provide directly to us when you create an account, 
            including your email address, username, and any optional profile information 
            you choose to share such as a bio or social media links.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To allow you to participate in interactive features when you choose to do so</li>
            <li>To provide customer support</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Information Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal identification information to others. 
            We may share generic aggregated demographic information not linked to any personal 
            identification information regarding visitors and users with our business partners 
            and trusted affiliates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Data Security</h2>
          <p>
            We implement appropriate data collection, storage, processing practices, and security 
            measures to protect against unauthorized access, alteration, disclosure, or destruction 
            of your personal information and data stored on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to our processing of your personal data</li>
            <li>Request transfer of your personal data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through 
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
