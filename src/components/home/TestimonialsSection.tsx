import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "Alex Thompson",
    role: "Professional Bettor",
    content: "The 2 odds predictions have been incredibly reliable. I've seen a consistent profit over the last 3 months using these picks.",
    rating: 5,
    avatar: "AT"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Sports Enthusiast",
    content: "I love the rollover challenge feature. It's helped me turn a small bankroll into something substantial following the daily picks.",
    rating: 5,
    avatar: "SJ"
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    role: "Fantasy Sports Player",
    content: "The detailed analysis behind each prediction gives me confidence. The transparency about confidence levels is what sets this apart.",
    rating: 4,
    avatar: "MR"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <motion.div
      className="w-full py-8 md:py-12 bg-gradient-to-r from-black to-gray-900 rounded-xl md:rounded-2xl border border-amber-500/20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          className="text-center mb-8 md:mb-12"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">What Our Users Say</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base">
            Join thousands of satisfied users who trust our predictions for their betting decisions.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          variants={containerVariants}
        >
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              variants={itemVariants}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

interface TestimonialCardProps {
  testimonial: {
    id: number;
    name: string;
    role: string;
    content: string;
    rating: number;
    avatar: string;
  };
  variants: any;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, variants }) => {
  return (
    <motion.div
      className="p-4 md:p-6 rounded-xl border border-amber-500/20 bg-black/40 transition-all duration-300 hover:shadow-lg relative"
      variants={variants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {/* Quote icon */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4 text-amber-500/20">
        <Quote size={30} className="hidden md:block" />
        <Quote size={24} className="block md:hidden" />
      </div>

      {/* Rating */}
      <div className="flex mb-3 md:mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-gray-600"}
          />
        ))}
      </div>

      {/* Content */}
      <p className="text-white/80 text-xs md:text-sm mb-4 md:mb-6 relative z-10">"{testimonial.content}"</p>

      {/* Author */}
      <div className="flex items-center">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-black text-xs md:text-sm font-bold mr-2 md:mr-3">
          {testimonial.avatar}
        </div>
        <div>
          <h4 className="text-white font-medium text-sm md:text-base">{testimonial.name}</h4>
          <p className="text-white/60 text-xs md:text-sm">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialsSection;
