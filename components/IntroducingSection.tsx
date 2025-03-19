// *********************
// Role of the component: IntroducingSection with the text "Introducing Singitronic"
// Name of the component: IntroducingSection.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <IntroducingSection />
// Input parameters: no input parameters
// Output: Section with the text "Introducing Singitronic" and button
// *********************

import Link from "next/link";
import React from "react";

const IntroducingSection = () => {
  return (
    <div className="py-20 pt-24 bg-gradient-to-l from-lightBlue to-skyBlue">
      <div className="text-center flex flex-col gap-y-5 items-center">
        <h2 className="text-white text-8xl font-extrabold text-center mb-2 max-md:text-6xl max-[480px]:text-4xl">
          INTRODUCING <span className="text-black">Gadget</span><span className="text-deepBlue">Souq</span>
        </h2>
        <div>
          <p className="text-black-100 text-center text-2xl font-semibold max-md:text-xl max-[480px]:text-base">
            Buy the latest electronics.
          </p>
          <p className="text-black-100 text-center text-2xl font-semibold max-md:text-xl max-[480px]:text-base">
            The best electronics for tech lovers.
          </p>
          <Link href="/shop" className="block w-full rounded-lg bg-white font-bold px-12 py-3 mt-[15px] text-center text-base font-semibold text-sky-700 shadow-md transition-all duration-300 ease-in-out hover:bg-gray-100 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-300">
            SHOP NOW
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IntroducingSection;
