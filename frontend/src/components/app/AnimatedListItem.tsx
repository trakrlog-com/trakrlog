import React from "react";
import { motion } from "framer-motion";

interface AnimatedListItemProps {
  children: React.ReactNode;
  delay?: number;
}

const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ children }) => {
  return (
    <motion.li
      className="mb-4 cursor-pointer"
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: 1,
        height: "auto",
        transition: { type: "spring", bounce: 0.3, opacity: { delay: 0.1 } },
      }}
    >
      {children}
    </motion.li>
  );
};

export default AnimatedListItem;
