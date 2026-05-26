import { createFileRoute } from "@tanstack/react-router";
import {
  LegalShell,
  LegalSection,
  LegalList,
  LegalCallout,
  type LegalSection as LegalSectionType,
} from "@/components/marketing/LegalShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · FlipNosh" },
      {
        name: "description",
        content:
          "Learn how FlipNosh collects, uses, and protects information for restaurants and their customers.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: LegalSectionType[] = [
  { id: "introduction",            label: "Introduction"              },
  { id: "information-we-collect",  label: "Information We Collect"    },
  { id: "how-we-use",              label: "How We Use Information"     },
  { id: "payments",                label: "Payments"                  },
  { id: "data-sharing",            label: "Data Sharing"              },
  { id: "cookies",                 label: "Cookies & Analytics"       },
  { id: "data-retention",          label: "Data Retention"            },
  { id: "security",                label: "Security"                  },
  { id: "restaurant-responsibility", label: "Restaurant Responsibility" },
  { id: "childrens-privacy",       label: "Children's Privacy"        },
  { id: "changes",                 label: "Changes to This Policy"    },
  { id: "contact",                 label: "Contact"                   },
];

function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="How FlipNosh collects, uses, and protects information."
      lastUpdated="May 26, 2026"
      sections={SECTIONS}
    >
      <LegalSection id="introduction" title="1. Introduction">
        <p>
          FlipNosh ("we", "us", "our") is a software platform that helps
          restaurants build and operate branded direct-ordering storefronts and
          customer engagement tools.
        </p>
        <p>
          We are committed to being transparent about how we handle data. This
          Privacy Policy explains what information we collect, why we collect it,
          and how we use it. By using FlipNosh, you agree to the practices
          described here.
        </p>
      </LegalSection>

      <LegalSection id="information-we-collect" title="2. Information We Collect">
        <p className="font-medium text-foreground">Restaurant account information</p>
        <p>When a restaurant signs up, we collect:</p>
        <LegalList
          items={[
            "Business name, email address, and phone number",
            "Restaurant details (address, description, cuisine type)",
            "Menu content, pricing, and availability",
            "Billing information (handled securely via Stripe)",
          ]}
        />

        <p className="font-medium text-foreground pt-1">Customer order information</p>
        <p>
          When customers place orders through a restaurant's FlipNosh storefront,
          we collect:
        </p>
        <LegalList
          items={[
            "Name, email address, and phone number",
            "Delivery address (where applicable)",
            "Order contents and special requests",
          ]}
        />

        <p className="font-medium text-foreground pt-1">Technical information</p>
        <p>We automatically collect standard technical data, including:</p>
        <LegalList
          items={[
            "Browser type and device information",
            "IP address and approximate location",
            "Usage and analytics data to improve platform performance",
          ]}
        />
      </LegalSection>

      <LegalSection id="how-we-use" title="3. How We Use Information">
        <p>We use collected information to:</p>
        <LegalList
          items={[
            "Operate and maintain the FlipNosh platform",
            "Process and facilitate restaurant orders",
            "Improve features and product functionality",
            "Provide technical support to restaurants",
            "Send operational communications (account updates, billing, security)",
            "Monitor performance, detect fraud, and maintain platform security",
          ]}
        />
        <p>
          We do not use your data for advertising purposes, and we do not sell
          it to third parties.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="4. Payments">
        <p>
          Payments are processed securely through{" "}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            Stripe
          </a>
          , a leading payment infrastructure provider trusted by millions of
          businesses worldwide.
        </p>
        <p>
          FlipNosh does not store full card numbers or sensitive payment
          credentials. All payment data is handled directly by Stripe in
          accordance with their PCI-DSS compliance standards.
        </p>
      </LegalSection>

      <LegalSection id="data-sharing" title="5. Data Sharing">
        <p>
          FlipNosh does not sell customer or restaurant data. We only share data
          with trusted third parties where necessary to operate the platform:
        </p>
        <LegalList
          items={[
            "Payment processors (Stripe) — to process transactions",
            "Cloud infrastructure providers — to host and run the platform",
            "Communication providers — to deliver transactional emails or SMS",
            "Legal authorities — where required by applicable law",
          ]}
        />
        <p>
          All third-party providers are carefully selected and required to
          maintain appropriate data protection standards.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies & Analytics">
        <p>
          FlipNosh uses cookies and analytics tools to understand how the
          platform is used and to improve the experience for restaurants and
          their customers.
        </p>
        <p>
          Essential cookies are required for the platform to function correctly
          (for example, to keep you logged in). You can manage non-essential
          cookies through your browser settings, though disabling certain
          cookies may affect platform functionality.
        </p>
      </LegalSection>

      <LegalSection id="data-retention" title="7. Data Retention">
        <p>
          We retain account and usage data for as long as your account is active
          or as required for operational and legal purposes.
        </p>
        <p>
          If you wish to delete your account and associated data, please contact
          us at{" "}
          <a
            href="mailto:legal@flipnosh.com"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            legal@flipnosh.com
          </a>
          . We will process requests in accordance with applicable law.
        </p>
      </LegalSection>

      <LegalSection id="security" title="8. Security">
        <p>
          We use industry-standard measures to protect data, including encrypted
          connections (HTTPS), secure cloud infrastructure, and access controls
          that limit who can access sensitive information.
        </p>
        <p>
          No online system is completely immune to security risks. While we work
          hard to protect your data, we cannot guarantee absolute security and
          encourage restaurants to follow good security practices on their end.
        </p>
      </LegalSection>

      <LegalSection id="restaurant-responsibility" title="9. Restaurant Responsibility">
        <p>
          Restaurants that use FlipNosh to collect and manage customer data are
          acting as data controllers for their own customers. Restaurants are
          responsible for:
        </p>
        <LegalList
          items={[
            "Handling customer communications appropriately",
            "Complying with applicable local privacy and data protection laws",
            "Ensuring compliance with GDPR, where applicable",
          ]}
        />
        <p>
          FlipNosh provides the tools; restaurants are responsible for how they
          use them in relation to their customers.
        </p>
      </LegalSection>

      <LegalSection id="childrens-privacy" title="10. Children's Privacy">
        <p>
          FlipNosh is not intended for use by children under the age of 13. We
          do not knowingly collect personal data from minors. If you believe we
          have inadvertently collected such data, please contact us and we will
          promptly delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy as the platform evolves, to reflect
          changes in our practices or for legal and operational reasons.
        </p>
        <p>
          We will notify account holders of significant changes via email.
          Continued use of the platform after changes take effect constitutes
          acceptance of the updated policy. The "last updated" date at the top
          of this page indicates when it was last revised.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="12. Contact">
        <p>
          If you have any questions or concerns about this Privacy Policy or how
          we handle your data, please get in touch.
        </p>
        <LegalCallout>
          <p className="font-medium text-foreground">Privacy enquiries</p>
          <a
            href="mailto:legal@flipnosh.com"
            className="text-primary hover:opacity-80 transition-opacity"
          >
            legal@flipnosh.com
          </a>
        </LegalCallout>
      </LegalSection>
    </LegalShell>
  );
}
