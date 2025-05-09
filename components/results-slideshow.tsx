"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";

export function ResultsSlideshow() {
  const [results, setResults] = useState<Tables<"sslc_results">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newResult, setNewResult] = useState<Tables<"sslc_results"> | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationQueue = useRef<Tables<"sslc_results">[]>([]);
  const supabase = createClient();
  
  // Process the animation queue with delay
  useEffect(() => {
    if (animationQueue.current.length > 0 && !isAnimating) {
      setIsAnimating(true);
      const nextResult = animationQueue.current.shift();
      if (nextResult) {
        setNewResult(nextResult);
        
        // Add to results list after animation and prepare for next animation
        setTimeout(() => {
          setResults(prev => {
            // Limit to max 10 results to keep state size manageable
            const newResults = [nextResult, ...prev];
            if (newResults.length > 10) {
              return newResults.slice(0, 10);
            }
            return newResults;
          });
          setNewResult(null);
          
          // Add delay before processing next animation
          setTimeout(() => {
            setIsAnimating(false);
          }, 1000); // 1 second cooldown between animations
        }, 2000); // 2 seconds for the animation itself
      }
    }
  }, [isAnimating, animationQueue.current.length]);

  useEffect(() => {
    // Fetch initial active results
    const fetchResults = async () => {
      try {
        const { data, error } = await supabase
          .from("sslc_results")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false })
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
      <div className="flex justify-center items-center h-64 bg-orange-500 w-full rounded-lg">
        <p className="text-white text-xl font-bold">Loading results...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-orange-500 w-full rounded-lg">
        <p className="text-white text-xl font-bold">No results available yet</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* New result animation */}
      <AnimatePresence>
        {newResult && newResult.image_url && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-8"
          >
            <motion.div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl border-4 border-orange-500">
              <Image
                src={newResult.image_url}
                alt="New Result"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 256px"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal image row */}
      <div className="flex overflow-x-auto py-4 gap-6 items-center justify-start">
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
                  <Image
                    src={result.image_url}
                    alt="Student Result"
                    width={500}
                    height={800}
                    className="h-full w-auto object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
