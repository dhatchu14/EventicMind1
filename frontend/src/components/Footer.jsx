// src/components/Footer.jsx
import React from 'react';
import { Heart, Instagram, Facebook, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 py-12 w-full">
      <div className="container mx-auto px-45"> {/* Slightly shifted right by increasing px */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* First Column - About */}
          <div className="space-y-4">
            <h2 className="text-black dark:text-white text-2xl font-bold">EventicMind</h2>
            <p className="text-gray-600 dark:text-gray-400">
              EventicMind is a tech startup that provides innovative tech products for the modern lifestyle. Discover innovation at your fingertips.
            </p>
            <p className="text-gray-600 dark:text-gray-400 flex items-center">
              Made with <Heart className="h-4 w-4 mx-1 text-red-500" fill="currentColor" />
            </p>
            <Button
              variant="outline"
              className="cursor-pointer rounded-full border-black dark:border-gray-500 text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white dark:hover:border-gray-400 transition-all"
            >
              Visit our store
            </Button>
          </div>

          {/* Second Column - Important Links */}
          <div className="space-y-4">
            <h3 className="text-black dark:text-white font-bold">Important Links</h3>
            <Separator className="my-2" />
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">Home</a></li>
              <li><a href="/about" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">About</a></li>
              <li><a href="/shop" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">Shop</a></li>
              <li><a href="/blogs" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Third Column - Quick Links */}
          <div className="space-y-4">
            <h3 className="text-black dark:text-white font-bold">Quick Links</h3>
            <Separator className="my-2" />
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Fourth Column - Contact & Socials */}
          <div className="space-y-4">
            <h4 className="text-black dark:text-white font-bold">Contact Info</h4>
            <Separator className="my-2" />
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <MapPin className="h-4 w-4 mr-2" /> Kallakurichi, Tamilnadu
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Phone className="h-4 w-4 mr-2" /> +91 1234567890
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Mail className="h-4 w-4 mr-2" /> info@eventicmind.com
              </li>
            </ul>

            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-black dark:text-white hover:opacity-70 transition-opacity">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-black dark:text-white hover:opacity-70 transition-opacity">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-black dark:text-white hover:opacity-70 transition-opacity">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} EventicMind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
