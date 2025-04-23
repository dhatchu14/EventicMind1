import React, { useState } from 'react';
// Keep Shadcn component imports
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Search, FileSearch } from 'lucide-react';

// Image imports (assuming paths are correct)
import img1 from '@/assets/images/quality-shopping-tips.jpg';
import img2 from '@/assets/images/eco-friendly-shopping.jpg';
import img3 from '@/assets/images/gift-ideas.jpg';
import img4 from '@/assets/images/online-payment-option.jpg';
import img5 from '@/assets/images/ar-shopping.jpg';
import img6 from '@/assets/images/summer-shopping-essentials.jpg';

// --- Reusable Blog Card Component (with explicit dark theme styles) ---
const BlogCard = ({ blog }) => (
  <Card key={blog.id} className="overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
    <img
      src={blog.image}
      alt={blog.title}
      className="w-full h-auto aspect-video object-cover"
    />
    <div className="flex flex-col flex-grow p-5">
        {/* Explicit dark styles for header elements */}
        <CardHeader className="p-0 pb-3">
          <div className="flex justify-between items-center mb-2 gap-2">
            {/* Adjusted Badge for explicit dark theme */}
            <Badge variant="outline" className="uppercase text-xs whitespace-nowrap border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
              {blog.category.replace('-', ' ')}
            </Badge>
            {/* Explicit dark text for muted content */}
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {blog.readTime}
            </span>
          </div>
          {/* Explicit dark text for title */}
          <CardTitle className="text-lg font-semibold line-clamp-2 leading-tight text-gray-900 dark:text-white">
            {blog.title}
          </CardTitle>
           {/* Explicit dark text for description */}
          <CardDescription className="mt-1 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
             {blog.excerpt}
          </CardDescription>
        </CardHeader>
        {/* Explicit dark styles for footer elements */}
        <CardFooter className="mt-auto flex justify-between items-center p-0 pt-4">
           {/* Explicit dark text for muted content */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
              {blog.date}
          </div>
           {/* Explicit dark text for link button (adjust primary color if needed) */}
          <Button variant="link" size="sm" className="text-sm h-auto p-0 text-blue-600 dark:text-blue-400 hover:underline">
            Read More <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
    </div>
  </Card>
);


// --- Main Blog Page Component (with explicit dark theme styles) ---
const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const blogs = [
    { id: 1, title: 'Top 10 Tips for Choosing Quality Products Online', excerpt: 'Learn essential tips to ensure you get the best quality products when shopping online.', category: 'shopping-guide', author: 'Jane Smith', date: 'March 25, 2025', readTime: '5 min read', image: img1, featured: true },
    { id: 2, title: 'Sustainable Shopping: Making Eco-Friendly Choices', excerpt: 'Discover how to make environmentally conscious decisions when shopping online.', category: 'trends', author: 'Robert Johnson', date: 'March 18, 2025', readTime: '8 min read', image: img2, featured: true },
    { id: 3, title: 'How to Find the Perfect Gift for Any Occasion', excerpt: "A comprehensive guide to selecting thoughtful gifts that will be cherished.", category: 'buying-guide', author: 'Michael Chen', date: 'March 10, 2025', readTime: '6 min read', image: img3, featured: false },
    { id: 4, title: 'Understanding Online Payment Options', excerpt: 'Navigate the world of digital payments, credit cards, and financing to make the best decision for your purchases.', category: 'finance', author: 'Sarah Williams', date: 'March 5, 2025', readTime: '7 min read', image: img4, featured: false },
    { id: 5, title: 'The Rise of Augmented Reality Shopping', excerpt: "An in-depth look at how AR is transforming the online shopping experience.", category: 'trends', author: 'David Lee', date: 'February 28, 2025', readTime: '10 min read', image: img5, featured: false },
    { id: 6, title: 'Seasonal Shopping Guide: Summer Essentials', excerpt: 'Must-have items for the summer season and how to find the best deals.', category: 'shopping-guide', author: 'Amanda Garcia', date: 'February 20, 2025', readTime: '4 min read', image: img6, featured: false }
  ];

  // Format categories for display (Title Case)
  const categories = ['All', ...new Set(blogs.map(b => b.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())))];
  // Format category name for matching (lowercase, hyphenated)
  const formatCategoryForMatch = (categoryName) => categoryName.toLowerCase().replace(/\s+/g, '-');

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featuredBlogs = filteredBlogs.filter(blog => blog.featured);

  return (
    // Apply base light and specific dark background/text colors
    <div className="container mx-auto py-12 md:py-16 lg:py-20 px-4 md:px-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Hero Section */}
      <section className="mb-12 md:mb-16 text-center">
        {/* Explicit dark text */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
          EventicMind Blog
        </h1>
        {/* Explicit dark text */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Stay updated with the latest shopping trends, deals, and buying guides from our experts.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
            {/* Explicit dark text for icon */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            {/* Input with explicit dark styles (border, bg, text, placeholder) */}
            <Input
                placeholder="Search articles by title or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
        </div>
      </section>

      {/* Featured Articles (only if NOT searching) */}
      {featuredBlogs.length > 0 && !searchTerm && (
        <section className="mb-16 md:mb-20">
          {/* Explicit dark text */}
          <h2 className="text-3xl font-bold mb-8 text-center md:text-left text-gray-900 dark:text-white">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* BlogCard component uses explicit dark styles */}
            {featuredBlogs.map(blog => <BlogCard key={blog.id} blog={blog} />)}
          </div>
        </section>
      )}

      {/* Blog Categories & Posts */}
      <section>
         {/* Explicit dark text */}
         <h2 className="text-3xl font-bold mb-8 text-center md:text-left text-gray-900 dark:text-white">
            {searchTerm ? 'Search Results' : (featuredBlogs.length > 0 ? 'Latest Articles' : 'All Articles')}
         </h2>

        <Tabs defaultValue="All" className="w-full">
           {/* Explicit dark styles for TabsList */}
          <TabsList className="mb-10 flex flex-wrap justify-center bg-gray-100 dark:bg-gray-800 p-1 h-auto rounded-lg gap-1">
            {categories.map(category => (
              <TabsTrigger
                key={category}
                value={category}
                 // Explicit dark styles for TabsTrigger, including active state
                className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-colors duration-200"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                 {filteredBlogs
                  .filter(blog => category === 'All' || blog.category === formatCategoryForMatch(category))
                   // BlogCard component uses explicit dark styles
                  .map(blog => <BlogCard key={blog.id} blog={blog} />)}
              </div>

              {/* No Results Message with explicit dark styles */}
              {filteredBlogs.filter(blog =>
                category === 'All' || blog.category === formatCategoryForMatch(category)
              ).length === 0 && (
                 // Explicit dark border, background, text
                <div className="text-center py-16 md:py-24 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 mt-8 flex flex-col items-center justify-center min-h-[300px]">
                   {/* Explicit dark text for icon */}
                  <FileSearch className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                   {/* Explicit dark text */}
                  <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">
                    {searchTerm ? `No articles found matching "${searchTerm}". Try a different search.` : `No articles found in the "${category}" category.`}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Newsletter Sign Up */}
      {/* Explicit dark background and text */}
      <section className="mt-16 md:mt-20 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-8 md:p-12 lg:p-16 text-center">
         {/* Explicit dark text */}
        <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Stay In The Loop</h2>
         {/* Explicit dark text */}
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
          Subscribe to our newsletter for the latest shopping trends, exclusive deals, and buying guides delivered straight to your inbox.
        </p>
        <form className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3 items-center">
          {/* Input with explicit dark styles */}
          <Input
            placeholder="Enter your email address"
            className="flex-grow text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            type="email"
            required
          />
          {/* Button with explicit dark styles (assuming default primary is okay, otherwise specify bg/text/hover) */}
          <Button type="submit" size="lg" className="w-full sm:w-auto bg-gray-900 hover:bg-gray-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"> {/* Adjust dark bg/hover as needed */}
            Subscribe
          </Button>
        </form>
      </section>
    </div>
  );
};

export default BlogPage;
