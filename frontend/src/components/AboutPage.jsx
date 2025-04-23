import React from 'react';
// Keep Shadcn component imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  ShoppingBag,
  Shield,
  Users,
  Star,
  Truck,
  Headphones,
  ClipboardCheck
} from 'lucide-react';

// Image imports (assuming paths are correct)
import team from "@/assets/images/Team.jpg";
import women1 from "@/assets/images/women1.jpg";
import women2 from "@/assets/images/women2.jpg";
import men1 from "@/assets/images/men1.jpg";
import men2 from "@/assets/images/men2.jpg";

const teamMembers = [
  { name: 'Sarah Johnson', position: 'Founder & CEO', bio: 'With over 15 years in retail, Sarah founded EventicMind to make online shopping simple and transparent.', image: women1 },
  { name: 'Michael Chen', position: 'CTO', bio: 'Michael leads our development team, creating innovative technology solutions for seamless online shopping.', image: men1 },
  { name: 'Rebecca Martinez', position: 'Head of Customer Experience', bio: 'Rebecca ensures every customer interaction exceeds expectations, from browsing to delivery.', image: women2 },
  { name: 'James Wilson', position: 'Supply Chain Director', bio: 'James manages our seller partnerships and logistics to ensure quality products and timely delivery.', image: men2 }
];

const AboutPage = () => {
  // Consistent icon style for dark theme
  const iconClass = "h-8 w-8 text-gray-900 dark:text-gray-300"; // Primary text color in light, lighter gray in dark

  const features = [
    { icon: <ShoppingBag className={iconClass} />, title: 'Wide Selection', description: 'Choose from thousands of products across multiple categories.' },
    { icon: <Shield className={iconClass} />, title: 'Trusted Sellers', description: 'We partner only with verified sellers to ensure product quality.' },
    { icon: <Headphones className={iconClass} />, title: 'Customer Support', description: "We're committed to exceptional support throughout your shopping journey." },
    { icon: <RefreshCw className={iconClass} />, title: 'Innovation', description: 'We embrace the latest technology to enhance your shopping experience.' },
  ];

  const testimonials = [
    { name: 'Mark Thompson', location: 'Chicago, IL', text: 'Shopping with EventicMind was incredibly simple. The selection was extensive, pricing transparent, and delivery fast.', rating: 5 },
    { name: 'Lisa Chen', location: 'Austin, TX', text: 'The customer service is outstanding. When I had questions about an order, they walked me through every solution clearly.', rating: 5 },
    { name: 'David Rodriguez', location: 'Miami, FL', text: 'EventicMind saved me hours of shopping around. I found exactly what I needed online, and it was delivered to my doorstep just as described.', rating: 5 }
  ];

  const benefits = [
    { icon: <ClipboardCheck className={iconClass} />, title: 'Easy Comparison', description: 'Compare different products side by side to find your perfect match.' },
    { icon: <Star className={iconClass} />, title: 'Quality Guarantee', description: 'All our products undergo rigorous quality inspection before listing.' },
    { icon: <Truck className={iconClass} />, title: 'Free Shipping', description: 'Enjoy free shipping on orders over $50.' },
    { icon: <RefreshCw className={iconClass} />, title: '30-Day Return Policy', description: 'Not satisfied? Return your products within 30 days, no questions asked.' }
  ];

  return (
    // Apply base light and specific dark background/text colors matching BlogPage
    <div className="container mx-auto py-12 px-4 md:px-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* Hero Section */}
      <section className="mb-16">
        <div className="text-center mb-8">
           {/* Dark text override */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">About EventicMind</h1>
           {/* Dark text override */}
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Redefining the online shopping experience through trust, technology, and tailored services.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
             {/* Dark text override */}
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Story</h2>
             {/* Dark text override */}
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Founded in 2025, EventicMind began with a simple idea: online shopping should be easy, transparent, and enjoyable.
              Our founder Sarah Johnson experienced firsthand the frustrations of online shopping and knew there had to be a better way.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We launched our platform with a carefully curated selection of products from trusted sellers, focusing on quality, transparency,
              and customer satisfaction. Today, we've grown into one of the most trusted online marketplaces, helping thousands of
              customers find exactly what they're looking for.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Our mission remains unchanged: to provide the most transparent, convenient, and customer-focused shopping experience possible.
            </p>
          </div>
           {/* Specific dark background for image container */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <img
              src={team}
              alt="EventicMind Team"
              className="w-full h-full object-cover" // Ensure image covers container
            />
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="mb-16">
         {/* Dark text override */}
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">What Makes Us Different</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            // Apply specific dark styles to Card
            <Card key={index} className="text-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4">
                  {feature.icon}
                </div>
                 {/* Dark text override */}
                <CardTitle className="text-gray-900 dark:text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                 {/* Dark text override */}
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About Tabs */}
      <section className="mb-16">
        <Tabs defaultValue="team" className="w-full">
           {/* Specific dark styles for TabsList like BlogPage */}
          <TabsList className="mb-8 flex flex-wrap justify-center bg-gray-100 dark:bg-gray-800 p-1 h-auto rounded-lg">
            <TabsTrigger value="team" className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md">
              Our Team
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md">
              Customer Stories
            </TabsTrigger>
            <TabsTrigger value="benefits" className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md">
              Shopping Benefits
            </TabsTrigger>
          </TabsList>

          {/* Team Tab */}
          <TabsContent value="team">
             {/* Dark text override */}
            <h3 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white">Meet Our Team</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                // Apply specific dark styles to Card
                <Card key={index} className="overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow">
                  <img src={member.image} alt={member.name} className="w-full h-48 object-cover"/>
                  <CardHeader>
                     {/* Dark text override */}
                    <CardTitle className="text-gray-900 dark:text-white">{member.name}</CardTitle>
                     {/* Dark text override */}
                    <CardDescription className="text-gray-500 dark:text-gray-400">{member.position}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {/* Dark text override */}
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
             {/* Dark text override */}
            <h3 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white">What Our Customers Say</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                // Apply specific dark styles to Card
                <Card key={index} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                         {/* Dark text override */}
                        <CardTitle className="text-gray-900 dark:text-white">{testimonial.name}</CardTitle>
                         {/* Dark text override */}
                        <CardDescription className="text-gray-500 dark:text-gray-400">{testimonial.location}</CardDescription>
                      </div>
                      <div className="flex">
                        {Array(testimonial.rating).fill().map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 dark:text-yellow-500 fill-current" /> // Keep stars yellow
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                     {/* Dark text override */}
                    <p className="text-gray-700 dark:text-gray-300 italic">
                      "{testimonial.text}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits">
             {/* Dark text override */}
            <h3 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white">Shopping Benefits</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                 // Apply specific dark styles to Card
                <Card key={index} className="text-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto mb-4">
                      {benefit.icon}
                    </div>
                     {/* Dark text override */}
                    <CardTitle className="text-gray-900 dark:text-white">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {/* Dark text override */}
                    <p className="text-gray-600 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* How It Works */}
      {/* Specific dark background */}
      <section className="mb-16 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-8">
         {/* Dark text override */}
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
             {/* Specific dark background/text for number circle */}
            <div className="bg-gray-900 dark:bg-gray-700 text-white w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold mx-auto mb-4">1</div>
             {/* Dark text override */}
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Browse & Select</h3>
             {/* Dark text override */}
            <p className="text-gray-600 dark:text-gray-300">
              Explore our extensive collection of products, use filters to narrow your search, and find exactly what you need.
            </p>
          </div>
          <div className="text-center">
             {/* Specific dark background/text for number circle */}
            <div className="bg-gray-900 dark:bg-gray-700 text-white w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Purchase & Pay</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Choose your payment method, apply any discount codes, and complete your purchase securely online.
            </p>
          </div>
          <div className="text-center">
             {/* Specific dark background/text for number circle */}
            <div className="bg-gray-900 dark:bg-gray-700 text-white w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Delivery & Enjoy</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We'll deliver your order directly to your doorstep, ready for you to enjoy with our satisfaction guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* Specific dark background */}
      <section className="bg-gray-900 dark:bg-black text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
        <p className="text-lg text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Browse our carefully curated selection of quality products and discover why thousands of customers trust EventicMind.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
           {/* Assuming Button variant="secondary" looks okay on dark bg. If not, use "default" or style explicitly. */}
          <Button variant="secondary" size="lg">Shop Now</Button>
           {/* Explicit dark hover styles for outline button */}
          <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-black dark:hover:text-gray-900">
            Contact Us
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

