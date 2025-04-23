import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  CreditCard,
  Shield,
  Headphones,
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card"; // Assuming path is correct
import { Button } from "@/components/ui/button";       // Assuming path is correct
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";      // Assuming path is correct
import { Badge } from "@/components/ui/badge";         // Assuming path is correct
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from 'react-router-dom';

// --- Image Imports ---
// Make sure these paths are correct relative to your Cartopia.jsx file
import appleWatchImage from '../assets/images/smartwatch.jpg';
import dellXpsImage from "../assets/images/laptop.jpg";
import razerBundleImage from '../assets/images/gaming.jpg';
import smartphones from '../assets/images/smartphone accessories.jpg';
import camera from '../assets/images/camera.jpg';
import gaming from '../assets/images/gaminggear.jpg';
// --- End Image Imports ---

const Cartopia = () => {
  const navigate = useNavigate();

  // --- Data ---
  const heroProducts = [
    { id: 1, title: "Beats Solo", subtitle: "Wireless", highlight: "HEADPHONE", buttonText: "Shop By Category", image: "https://storage.googleapis.com/a1aa/image/YTyJNXoUsGyFaOiv-ZBCr43VMY5GrUiIH1VZvU3CWhM.jpg", bgClass: "bg-gray-100 dark:bg-gray-800" }, // Adjusted dark background
    { id: 2, title: "Apple Watch", subtitle: "Series 7", highlight: "SMARTWATCH", buttonText: "View Collection", image: appleWatchImage, bgClass: "bg-gray-200 dark:bg-gray-700" },
    { id: 3, title: "Dell XPS 15", subtitle: "Powerful Performance", highlight: "LAPTOP", buttonText: "Discover Now", image: dellXpsImage, bgClass: "bg-gray-300 dark:bg-gray-600" }, // Adjusted dark background
    { id: 4, title: "Razer Gaming Bundle", subtitle: "Keyboard, Mouse & Headset", highlight: "GAMING GEAR", buttonText: "Shop Today", image: razerBundleImage, bgClass: "bg-gray-100 dark:bg-gray-800" } // Adjusted dark background
  ];
  const categories = [
     { bgClass: "bg-black text-white", title: "Earphones & Headphones", buttonClass: "bg-white text-black hover:bg-gray-200", imgSrc: "https://storage.googleapis.com/a1aa/image/Sblf98Odzv0GfMSW3OwmWB7A7HeaWSpylnURrx3arz4.jpg"},
     { bgClass: "bg-gray-800 text-white", title: "Wearable Gadgets", buttonClass: "bg-white text-black hover:bg-gray-200", imgSrc: "https://storage.googleapis.com/a1aa/image/auVKbMfGvyN6Iprf3a0ka4y4y3pbnDG3UePw90Pu_C8.jpg"},
     { bgClass: "bg-black text-white", title: "Laptops & Desktops", buttonClass: "bg-white text-black hover:bg-gray-200", imgSrc: "https://storage.googleapis.com/a1aa/image/dCASJgPW0bNhExThiitw0hBeAqFizLONiyPLe025VHQ.jpg"},
     { bgClass: "bg-gray-900 text-white", title: "Smartphone Accessories", buttonClass: "bg-white text-black hover:bg-gray-200", imgSrc: smartphones },
     { bgClass: "bg-black text-white", title: "Cameras & Photography", buttonClass: "bg-white text-black hover:bg-gray-200", imgSrc: camera },
     { bgClass: "bg-gray-800 text-white", title: "Gaming Gear", buttonClass: "bg-white text-black hover:bg-gray-200", imgSrc: gaming }
  ];
  const features = [
    { icon: <Truck className="text-black dark:text-white h-6 w-6" />, title: "Free Shipping", subtitle: "On Orders Over $50" }, // Updated subtitle
    { icon: <CreditCard className="text-black dark:text-white h-6 w-6" />, title: "Safe Money", subtitle: "30-Day Money Back" }, // Updated subtitle
    { icon: <Shield className="text-black dark:text-white h-6 w-6" />, title: "Secure Payment", subtitle: "All Payments Encrypted" }, // Updated subtitle
    { icon: <Headphones className="text-black dark:text-white h-6 w-6" />, title: "Online Support", subtitle: "Dedicated Support 24/7" }, // Updated subtitle
  ];
  // --- End Data ---

  // --- Intersection Observer Logic ---
  const [animatedSections, setAnimatedSections] = useState({});
  const sectionRefs = {
    hero: useRef(null),
    categories: useRef(null),
    features: useRef(null),
  };
  useEffect(() => {
    const observerOptions = {
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: "0px 0px -10% 0px" // Trigger slightly before it's fully in view from bottom
    };
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setAnimatedSections(prev => ({ ...prev, [entry.target.id]: true }));
          // Optional: Unobserve after animating to save resources
          // observer.unobserve(entry.target);
        }
      });
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const refsCurrent = {}; // To store current refs for cleanup
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        ref.current.id = key; // Assign ID for state tracking
        observer.observe(ref.current);
        refsCurrent[key] = ref.current;
      }
    });
    // Cleanup function
    return () => {
      Object.values(refsCurrent).forEach(element => {
        if (element) {
            observer.unobserve(element);
        }
      });
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- End Intersection Observer Logic ---

  // --- Configure Autoplay Plugin ---
  const autoplayPlugin = useRef(
    // Adjust delay as needed (milliseconds)
    Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true, })
  );
  // --- End Autoplay Configuration ---

  return (
    // Main container: ensure full width and base background colors
    <div className="bg-gray-50 dark:bg-gray-950 w-full min-h-screen">

      {/* Hero Section */}
      <section
        ref={sectionRefs.hero}
        // Section itself doesn't need horizontal padding if container inside has it
        className={`w-full py-12 transition-all duration-700 ease-out overflow-hidden ${
          animatedSections.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10' // Fade-in + slight slide-up
        }`}
        aria-labelledby="hero-heading" // Accessibility
      >
        {/* Container for content width limiting and horizontal padding */}
        <div className="max-w-7xl mx-auto px-4">
          {/* Use hidden heading for screen readers if needed */}
          {/* <h1 id="hero-heading" className="sr-only">Featured Products</h1> */}
          <Carousel
            className="w-full overflow-hidden rounded-lg shadow-lg" // Add shadow
            opts={{
                align: "start",
                loop: true, // Enable looping
            }}
            plugins={[autoplayPlugin.current]} // Add autoplay plugin instance
          >
            <CarouselContent>
              {heroProducts.map((product) => (
                <CarouselItem key={product.id} className="overflow-hidden">
                  {/* Removed rounded-lg from here, applied to Carousel itself */}
                  <div className={`${product.bgClass} overflow-hidden min-h-[500px] flex items-center`}>
                    <Card className="border-0 shadow-none bg-transparent w-full overflow-hidden">
                      <CardContent className="p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10 overflow-hidden">
                        {/* Text Content Area */}
                        {/* Added min-w-0 for flexbox safety */}
                        <div className="md:w-1/2 space-y-3 sm:space-y-5 text-center md:text-left overflow-hidden min-w-0">
                          <Badge variant="outline" className="text-sm font-medium border-black/30 dark:border-white/30">{product.title}</Badge>
                          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white">{product.subtitle}</h2>
                          {/* Background Highlight Text */}
                          <p className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-black/10 dark:text-white/10 uppercase tracking-tight break-words">{product.highlight}</p>
                          <Button
                            variant="default"
                            size="lg" // Make button slightly larger
                            className="mt-5 sm:mt-8 bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full px-8 sm:px-10 py-3 text-base font-semibold transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-1 cursor-pointer" // Added cursor-pointer explicitly
                            onClick={() => navigate('/shop')} // Navigate to shop page
                            aria-label={`Shop for ${product.highlight}`}
                          >
                            {product.buttonText}
                          </Button>
                        </div>
                        {/* Image Area */}
                        {/* Added min-w-0 for flexbox safety */}
                        <div className="md:w-1/2 flex justify-center mt-6 md:mt-0 min-w-0">
                          <img
                            alt={`${product.title} ${product.subtitle}`}
                            className="w-4/5 md:w-full max-w-[280px] sm:max-w-xs lg:max-w-sm object-contain transition-transform duration-500 ease-out hover:scale-105" // Slight hover scale
                            src={product.image}
                            loading="lazy" // Lazy load images for performance
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* Optional: Add Previous/Next buttons if needed, style them appropriately */}
            {/* <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" /> */}
            {/* <CarouselNext className="absolute right-4 top-1/2 -translatey-1/2 z-10" /> */}
          </Carousel>
        </div>
      </section>

      {/* Categories Section */}
      <section
        ref={sectionRefs.categories}
        className={`py-16 lg:py-24 transition-all duration-1000 ease-out overflow-hidden ${ // Increased vertical padding
          animatedSections.categories ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16' // Fade-in + larger slide-up
        }`}
        aria-labelledby="categories-heading"
      >
        <div className="max-w-7xl mx-auto px-4">
          <h2 id="categories-heading" className="text-3xl lg:text-4xl font-bold mb-10 lg:mb-12 text-center text-black dark:text-white">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <Card
                key={index}
                className={`${category.bgClass} border-0 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 group relative`} // Existing hover effects
              >
                <CardContent className="p-6 lg:p-8 flex flex-col justify-between min-h-[250px] relative z-10 overflow-hidden">
                  <div className="flex-grow">
                    <p className="text-sm opacity-80 mb-2">Explore Our Collection</p>
                    <h3 className="text-2xl lg:text-3xl font-semibold mt-1">{category.title}</h3>
                  </div>
                  <div className="mt-6">
                    <Button
                      variant="secondary" // Use the specific button class from data
                      className={`${category.buttonClass} rounded-full text-sm font-medium px-5 py-2 transition-transform duration-300 group-hover:scale-105 cursor-pointer`} // Ensure pointer cursor
                      onClick={() => navigate('/shop', { state: { category: category.title } })} // Optionally pass category state
                      aria-label={`Browse ${category.title}`}
                    >
                      Browse Now
                    </Button>
                  </div>
                  {/* Decorative Image */}
                  <img
                    alt="" // Decorative image, empty alt
                    aria-hidden="true"
                    className="absolute right-0 bottom-0 w-2/5 max-w-[100px] lg:max-w-[120px] opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ease-out z-0 pointer-events-none" // Prevent interaction
                    src={category.imgSrc}
                    loading="lazy"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={sectionRefs.features}
        className={`bg-white dark:bg-gray-900 py-16 lg:py-20 transition-all duration-700 ease-out overflow-hidden ${ // Adjusted padding
          animatedSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10' // Fade-in + slight slide-up
        }`}
        aria-labelledby="features-heading"
      >
        <div className="max-w-7xl mx-auto px-4">
          <h2 id="features-heading" className="sr-only">Our Features</h2> {/* Screen reader only heading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 bg-transparent shadow-none transition-all duration-300 group"
              >
                {/* Apply hover bg to CardContent for better area */}
                <CardContent className="p-6 flex items-center space-x-4 group-hover:bg-gray-100 dark:group-hover:bg-gray-800/50 rounded-lg transition-colors duration-300">
                   {/* Icon container with hover effect */}
                  <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-800 rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:bg-gray-200 dark:group-hover:bg-gray-700">
                    {React.cloneElement(feature.icon, { className: "h-6 w-6 text-black dark:text-white" })}
                  </div>
                  {/* Text content */}
                  <div>
                    <h3 className="font-semibold text-lg text-black dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div> // End Main container
  );
};

export default Cartopia;