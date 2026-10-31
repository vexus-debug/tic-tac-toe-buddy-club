import Layout from "@/site/components/Layout";
import { LegalHero } from "@/site/components/heroes";

const Cookies = () => (
  <Layout>
    <LegalHero
      kind="Cookie policy"
      updated="February 2026"
      title="A clear view of the cookies we use."
      description="This policy explains which cookies support the Clinexus website and how you can control optional cookies."
    />
    <section className="site-section-light py-16 md:py-20">
      <div className="container max-w-3xl space-y-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Essential cookies</h2>
          <p className="leading-relaxed text-muted-foreground">These cookies support core site functions such as authentication, security and remembering your cookie choice. The website cannot work reliably without them.</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Optional analytics cookies</h2>
          <p className="leading-relaxed text-muted-foreground">When enabled, analytics cookies help us understand which pages and features are useful. They are optional and are not required to browse Clinexus.</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Your choices</h2>
          <p className="leading-relaxed text-muted-foreground">You can choose all cookies or essential cookies only in the consent dialogue. You can also clear your browser storage and revisit the site to choose again.</p>
        </div>
      </div>
    </section>
  </Layout>
);

export default Cookies;