import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ParallaxBackdrop from "./ParallaxBackdrop";
import chartsAsset from "@/assets/current-dashboard/dental-charts.png.asset.json";

const CTASection = () => {
  return (
    <section className="relative site-band-theater overflow-hidden py-24">
      <ParallaxBackdrop src={chartsAsset.url} speed={0.15} opacity={0.3} />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Find the System Built for Your Practice
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Dental, Eye Care, Fertility, Diagnostics or General Practice. Explore the system dedicated to your field and leave generic workarounds behind.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 rounded-md bg-primary px-8 text-white shadow-lg hover:opacity-90">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="/app/login">
              <Button
                size="lg"
                variant="outline"
                className="rounded-sm px-8"
              >
                See It in Action First
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
