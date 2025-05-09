"use client";

import { useEffect, useState, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";

export function ResultsSlideshow() {
  const [results, setResults] = useState<Tables<"sslc_results">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newResult, setNewResult] = useState<Tables<"sslc_results"> | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const animationQueue = useRef<Tables<"sslc_results">[]>([]);
  const supabase = createClient();
  
  // Process the animation queue with delay
  useEffect(() => {
    if (animationQueue.current.length > 0 && !isAnimating) {
      setIsAnimating(true);
      const nextResult = animationQueue.current.shift();
      if (nextResult) {
        setNewResult(nextResult);
        setImageLoaded(false);
        setShowAnimation(false);
      }
    }
  }, [isAnimating, animationQueue.current.length]);
  
  // Handle image loading and animation sequence
  useEffect(() => {
    if (newResult && imageLoaded) {
      // Start the animation once the image is loaded
      setShowAnimation(true);
      
      // Add to results list after animation and prepare for next animation
      const animationTimer = setTimeout(() => {
        setResults(prev => {
          // Add new result at the beginning of the array
          // Limit to max 10 results to keep state size manageable
          const newResults = [newResult, ...prev];
          if (newResults.length > 10) {
            return newResults.slice(0, 10);
          }
          return newResults;
        });
        setNewResult(null);
        setShowAnimation(false);
        
        // Add delay before processing next animation
        setTimeout(() => {
          setIsAnimating(false);
        }, 1000); // 1 second cooldown between animations
      }, 4000); // 4 seconds for the animation itself
      
      return () => clearTimeout(animationTimer);
    }
  }, [newResult, imageLoaded]);
  
  // Handle image onLoad event
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  useEffect(() => {
    // Fetch initial active results
    const fetchResults = async () => {
      try {
        const { data, error } = await supabase
          .from("sslc_results")
          .select("*")
          .eq("active", true)
          .order("updated_at", { ascending: false })
          .limit(10); // Limit to 10 results to keep state size manageable

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();

    // Set up real-time subscription for new active results
    const subscription = supabase
      .channel("active_results_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sslc_results",
          filter: "active=eq.true",
        },
        (payload) => {
          const updatedResult = payload.new as Tables<"sslc_results">;
          
          // Check if this is a newly activated result (not already in our list)
          const existingIndex = results.findIndex(r => r.id === updatedResult.id);
          if (existingIndex === -1) {
            // Add to animation queue
            animationQueue.current.push(updatedResult);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, results]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-orange-500 w-full">
        <p className="text-white text-xl font-bold">Loading results...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-orange-500 w-full">
        <p className="text-white text-xl font-bold">No results available yet</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* New result animation */}
      <AnimatePresence>
        {/* Animated particles background */}
        {showAnimation && (
          <motion.div 
            className="fixed inset-0 z-40 overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/80"
                style={{
                  width: Math.random() * 10 + 5,
                  height: Math.random() * 10 + 5,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -Math.random() * 200 - 100],
                  x: [0, (Math.random() - 0.5) * 100],
                  opacity: [1, 0],
                  scale: [0, 1, 0.5]
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
              />
            ))}
          </motion.div>
        )}
        
        {/* Preload image */}
        {newResult && newResult.image_url && !showAnimation && (
          <div className="hidden">
            <img
              src={newResult.image_url}
              alt="Preloading"
              width="1"
              height="1"
              onLoad={handleImageLoad}
            />
          </div>
        )}
        
        {/* Animation sequence */}
        {newResult && newResult.image_url && showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Background overlay with animated gradient */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-orange-500/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              onClick={() => {
                setNewResult(null);
                setShowAnimation(false);
              }}
            />
            
            {/* Student name */}
            <motion.div
              className="absolute top-20 left-0 right-0 text-center"
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 50 }}
            >
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                {newResult.name || "New Student"}
              </h2>
              <motion.div
                className="text-xl text-white/90 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {newResult.school || ""}
              </motion.div>
            </motion.div>
            
            {/* Main image with effects */}
            <motion.div 
              className="relative rounded-xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.2, y: 100, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0,
                opacity: 1,
                boxShadow: [
                  "0px 0px 0px 0px rgba(255, 255, 255, 0)",
                  "0px 0px 60px 20px rgba(255, 255, 255, 0.9)",
                  "0px 0px 30px 10px rgba(255, 255, 255, 0.6)"
                ]
              }}
              transition={{ 
                type: "spring", 
                bounce: 0.3,
                delay: 0.2,
                duration: 1,
                boxShadow: {
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 3,
                  ease: "easeInOut"
                }
              }}
            >
              <div className="relative w-[400px] h-[500px]">
                <img
                  src={newResult.image_url}
                  alt={newResult.name || "Student Result"}
                  style={{width: '100%', height: '100%', position: 'absolute'}}
                  className="object-contain"
                  loading="eager"
                />
              </div>
              
              {/* A+ count badge */}
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex flex-col items-center justify-center shadow-lg"
                initial={{ scale: 0, opacity: 0, rotate: -20 }}
                animate={{ 
                  scale: [0, 1.2, 1], 
                  opacity: 1, 
                  rotate: [0, 15, -15, 10, -10, 5, -5, 0],
                  y: [0, -10, 0, -5, 0]
                }}
                transition={{ 
                  delay: 1, 
                  duration: 1.5,
                  type: "spring",
                  stiffness: 200,
                  y: {
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 2,
                    ease: "easeInOut"
                  }
                }}
              >
                <span className="text-white text-lg font-bold">A+</span>
                <span className="text-white text-3xl font-bold">{newResult.aplus || 0}</span>
              </motion.div>
            </motion.div>
            
            {/* Congratulations message */}
            <motion.div
              className="absolute bottom-20 left-0 right-0 text-center"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 1.8, 
                duration: 0.8, 
                type: "spring", 
                stiffness: 50 
              }}
            >
              <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                Congratulations!
              </h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal image row */}
      <div className="flex overflow-x-auto gap-4 items-center justify-start">
        <AnimatePresence>
          {results.map((result, index) => (
            result.image_url && (
              <motion.div
                key={result.id}
                layout
                initial={index === 0 ? { scale: 0.8, x: 100, opacity: 0 } : {}}
                animate={{ scale: 1, x: 0, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-shrink-0 h-[80vh] max-h-[600px]"
              >
                <div className="relative h-full rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={result.image_url}
                    alt="Student Result"
                    width="500"
                    height="800"
                    className="h-full w-auto object-contain"
                  />
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
