"use client";
import React from "react";

const navItems: navItems[] = [
  {
    name: "Home",
    link: "/",
  },
  {
    name: "Code Review",
    link: "/code-review",
  },
  {
    name: "About",
    link: "/about",
  },
];

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center px-4 py-2">
      <h1 className="font-medium italic ">AI Code Reviewer</h1>
      <ul className="flex gap-12 text-sm font-medium">
        {navItems.map((item) => (
          <li key={item.name}>
            <a href={item.link}>{item.name}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
