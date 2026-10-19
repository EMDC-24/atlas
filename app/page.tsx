import HomeEthos from "@/components/sections/home/HomeEthos";
import HomeFocusIndustries from "@/components/sections/home/HomeFocusIndustries";
import HomeHero from "@/components/sections/home/HomeHero";
import HomeInvestorsFounders from "@/components/sections/home/HomeInvestorsFounders";
import HomePartnersCta from "@/components/sections/home/HomePartnersCta";

export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeEthos />

      {/* Focus + partners share one light surface; `#focus-industries` is the
          scroll container that pins the WebGL layer behind both screens. */}
      <div className="bg-neural-fog text-rich-carbon">
        <HomeFocusIndustries />
      </div>

      {/* The dark closing block. The negative margin pulls it over the light
          section above so its rounded top overlaps rather than gaps. */}
      <div className="bg-rich-carbon -mt-[20px] overflow-hidden rounded-t-[20px]">
        <HomeInvestorsFounders />
        <HomePartnersCta />
      </div>
    </>
  );
}
