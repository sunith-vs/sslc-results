"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function IntroAnimation() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Hide intro after animation completes
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!showIntro) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-orange-500"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2.5 }}
    >
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-4"
        >
          <motion.h1 
            className="text-6xl font-bold text-white mb-2"
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: 1,
            }}
          >
            Eduport +2
          </motion.h1>
          <motion.h2 
            className="text-4xl font-semibold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            RESULTS  2025
          </motion.h2>
        </motion.div>
      </div>
    </motion.div>
  );
}
