// *********************
// Role of the component: Search input element located in the header but it can be used anywhere in your application
// Name of the component: SearchInput.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SearchInput />
// Input parameters: no input parameters
// Output: form with search input and button
// *********************

"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const SearchInput = () => {
  const [searchInput, setSearchInput] = useState<string>("");
  const router = useRouter();

  // function for modifying URL for searching products
  // After it we will grab URL on the search page and send GET request for searched products
  const searchProducts = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/search?search=${searchInput}`);
    setSearchInput("");
  };

  return (
    <form className="flex w-full justify-center" onSubmit={searchProducts}>
      <div className="flex w-[80%] mx-auto">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Type here"
          className="flex-grow px-5 py-3 border border-gray-300 rounded-l-full text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-r-full hover:bg-sky-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          Search
        </button>
      </div>

    </form>
  );
};

export default SearchInput;
