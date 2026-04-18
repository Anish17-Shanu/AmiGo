import { motion } from "framer-motion";

const Container = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6"
  >
    {children}
  </motion.div>
);

export default Container;
