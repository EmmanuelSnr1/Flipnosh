import { createFileRoute } from "@tanstack/react-router";
import {
  LegalShell,
  LegalSection,
  LegalList,
  LegalCallout,
  type LegalSection as LegalSectionType,
} from "@/components/marketing/LegalShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · FlipNosh" },
      {
        name: "description",
        content:
          "Read the terms governing your use of the FlipNosh restaurant ordering platform.",
      },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: LegalSectionType[] = [
  { id: "introduction",       label: "Introduction"           },
  { id: "eligibility",        label: "Eligibility"            },
  { id: "restaurant-accounts", label: "Restaurant Accounts"   },
  { id: "subscription",       label: "Subscription & Billing" },
  { id: "payments",           label: "Payments"               },
  { id: "availability",       label: "Platform Availability"  },
  { id: "acceptable-use",     label: "Acceptable Use"         },
  { id: "ip",                 label: "Intellectual Property"  },
  { id: "liability",          label: "Limitation of Liability"},
  { id: "termination",        label: "Termination"            },
  { id: "changes",            label: "Changes to Terms"       },
  { id: "governing-law",      label: "Governing Law"          },
  { id: "contact",            label: "Contact"                },
];

function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      subtitle="Terms governing the use of the FlipNosh platform."
      lastUpdated="May 26, 2026"
      sections={SECTIONS}
    >
      <LegalSection id="introduction" title="1. Introduction">
        <p>
          FlipNosh ("we", "us", "our") provides software tools that enable
          restaurants to create branded direct-ordering storefronts and manage
          customer engagement — helping them take back ownership of their orders
          from third-party delivery platforms.
        </p>
        <p>
          By creating an account or using the FlipNosh platform, you agree to
          these Terms of Service. Please read them carefully. If you do not agree,
          do not use the platform.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <p>To use FlipNosh, you must:</p>
        <LegalList
          items={[
            "Be legally authorised to enter into binding agreements on behalf of your business",
            "Provide accurate and complete information about your restaurant or business",
            "Use the platform in compliance with applicable laws and regulations",
          ]}
        />
        <p>
          By using FlipNosh, you confirm that you meet these requirements.
        </p>
      </LegalSection>

      <LegalSection id="restaurant-accounts" title="3. Restaurant Accounts">
        <p>
          As a FlipNosh restaurant user, you are responsible for everything that
          happens under your account. This includes:
        </p>
        <LegalList
          items={[
            "Maintaining the security of your login credentials",
            "Managing staff access to your FlipNosh account",
            "Keeping your menu items, pricing, and availability accurate and up to date",
            "Fulfilling orders placed through your storefront promptly and correctly",
            "Providing customer support for your own orders and disputes",
          ]}
        />
        <p>
          If you suspect unauthorised access to your account, notify us
          immediately at{" "}
          <a
            href="mailto:legal@flipnosh.com"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            legal@flipnosh.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="subscription" title="4. Subscription & Billing">
        <p>
          FlipNosh is offered on a subscription basis. By subscribing to a paid
          plan, you agree to the following:
        </p>
        <LegalList
          items={[
            "You will be billed the applicable fee for your chosen plan on a recurring basis",
            "Trial periods (where offered) are free for the stated duration and convert to a paid subscription unless cancelled before the trial ends",
            "Plan pricing may change over time — we will notify you in advance of any price changes",
            "Failure to pay may result in restricted access to platform features until payment is resolved",
          ]}
        />
        <p>
          You can manage or cancel your subscription at any time from your
          billing settings.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="5. Payments">
        <p>
          Customer payments made through your FlipNosh storefront are processed
          via{" "}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            Stripe
          </a>{" "}
          or other integrated payment providers.
        </p>
        <p>
          Restaurants are solely responsible for all applicable taxes, VAT,
          reporting obligations, and regulatory compliance related to their
          sales and business income. FlipNosh is a platform provider and is not
          responsible for tax compliance on behalf of individual restaurants.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="6. Platform Availability">
        <p>
          FlipNosh aims to provide a reliable and stable platform experience.
          However, we do not guarantee uninterrupted, error-free service.
        </p>
        <p>Disruptions may occur due to:</p>
        <LegalList
          items={[
            "Planned maintenance windows (communicated in advance where possible)",
            "Unexpected technical incidents or infrastructure outages",
            "Third-party service disruptions outside of our control",
          ]}
        />
        <p>
          We will do our best to minimise downtime and communicate proactively
          when issues arise.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="7. Acceptable Use">
        <p>
          FlipNosh is designed for legitimate restaurant businesses. When using
          the platform, you agree not to:
        </p>
        <LegalList
          items={[
            "Use the platform for any unlawful, fraudulent, or deceptive purpose",
            "Upload or share harmful, offensive, or misleading content",
            "Abuse, overload, or attempt to compromise platform infrastructure",
            "Interfere with the use or experience of other restaurants or customers on the platform",
            "Resell, sublicense, or otherwise exploit platform features for purposes outside your own restaurant business",
          ]}
        />
        <p>
          Violations of this section may result in immediate account suspension.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="8. Intellectual Property">
        <p className="font-medium text-foreground">FlipNosh IP</p>
        <p>
          FlipNosh retains full ownership of the platform software, design,
          branding, and infrastructure. Nothing in these Terms transfers any
          ownership of FlipNosh's intellectual property to you.
        </p>

        <p className="font-medium text-foreground pt-1">Your content</p>
        <p>
          Restaurants retain full ownership of their own content, including
          menus, logos, images, and other uploaded business materials.
        </p>
        <p>
          By uploading content to FlipNosh, you grant us a limited, non-exclusive
          licence to display and use that content solely for the purpose of
          operating your storefront and providing the service.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="9. Limitation of Liability">
        <p>
          The FlipNosh platform is provided "as is" and "as available" without
          warranties of any kind, express or implied.
        </p>
        <p>
          To the fullest extent permitted by applicable law, FlipNosh is not
          liable for any indirect, consequential, incidental, or special damages
          arising from your use of the platform, including but not limited to:
        </p>
        <LegalList
          items={[
            "Lost profits or revenue",
            "Loss of customer data",
            "Business interruption or reputational damage",
            "Losses resulting from third-party service failures",
          ]}
        />
        <p>
          Our total liability in any given circumstance is limited to the
          subscription fees you paid to FlipNosh in the three months preceding
          the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="10. Termination">
        <p>
          FlipNosh reserves the right to suspend or terminate your account if:
        </p>
        <LegalList
          items={[
            "Subscription fees remain unpaid after reasonable notice",
            "Your account is used abusively or harmfully",
            "Illegal activity is detected or reasonably suspected",
            "There is a repeated or material violation of these Terms",
          ]}
        />
        <p>
          Where possible, we will provide advance notice before termination.
          You may cancel your own account at any time through your billing
          settings. Cancellation does not entitle you to a refund of any fees
          already paid.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes to Terms">
        <p>
          We may update these Terms of Service as the platform evolves, to
          reflect new features, legal requirements, or changes in our practices.
        </p>
        <p>
          We will notify account holders of significant changes via email with
          reasonable advance notice. Continued use of the platform after changes
          take effect constitutes your acceptance of the revised Terms. The
          "last updated" date at the top of this page reflects when the Terms
          were last changed.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="12. Governing Law">
        <p>
          These Terms of Service and any disputes arising from them are governed
          by the laws of England and Wales. Any disputes will be subject to the
          exclusive jurisdiction of the courts of England and Wales.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact">
        <p>
          If you have any questions about these Terms or need to get in touch
          regarding your account, please contact us.
        </p>
        <LegalCallout>
          <p className="font-medium text-foreground">Legal enquiries</p>
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
