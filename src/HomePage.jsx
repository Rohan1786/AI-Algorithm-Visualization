import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GiProcessor } from 'react-icons/gi';
import { AiOutlineCode } from 'react-icons/ai';
import { FaRobot } from 'react-icons/fa';
import { SiGooglegemini } from 'react-icons/si';

const HomePage = () => {
  const navigate = useNavigate();
  const controls = useAnimation();

  // Background animation
  useEffect(() => {
    const animateBackground = async () => {
      await controls.start({
        backgroundPosition: ['0% 0%', '100% 100%'],
        transition: { duration: 30, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }
      });
    };
    animateBackground();
  }, [controls]);

  // Card animation on hover
  const cardVariants = {
    initial: { y: 0, scale: 1 },
    hover: { 
      y: -10,
      scale: 1.05,
      transition: { 
        duration: 0.3,
        type: 'spring',
        stiffness: 300,
        damping: 10
      }
    }
  };

  // Section cards data
  const features = [
    {
      title: "Interactive Visualizations",
      description: "Explore algorithms with beautiful 3D animations that show each step in detail",
      icon: <GiProcessor className="text-4xl mb-4 text-blue-400" />,
      bgColor: "from-blue-900/50 to-blue-800/30",
      route: "/visualizer"
    },
    {
      title: "Learn with AI Tutor",
      description: "Get personalized explanations and ask questions about any algorithm step",
      icon: <FaRobot className="text-4xl mb-4 text-purple-400" />,
      bgColor: "from-purple-900/50 to-purple-800/30",
      route: "/visualizer"
    },
    {
      title: "Code Examples",
      description: "See practical implementations with pseudocode and complexity analysis",
      icon: <AiOutlineCode className="text-4xl mb-4 text-green-400" />,
      bgColor: "from-green-900/50 to-green-800/30",
      route: "/visualizer"
    }
  ];

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 bg-[length:400%_400%]"
        animate={controls}
      >
        {/* Floating algorithm elements */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-gray-600 opacity-20"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              rotate: Math.random() * 360,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              x: [null, Math.random() * 100],
              y: [null, Math.random() * 100],
              rotate: [null, Math.random() * 360],
              transition: {
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse'
              }
            }}
            style={{
              fontSize: `${Math.random() * 2 + 1}rem`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          >
            {['{ }', '() =>', 'O(n)', 'O(1)', 'O(log n)', 'O(n²)', 'if', 'else', 'for', 'while', 'return', 'function'][i % 12]}
          </motion.div>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero section */}
        <motion.div 
          className="text-center mb-20"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Algorithm <span className="text-white">Visualizer</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Master algorithms through interactive 3D visualizations powered by AI
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <button 
              onClick={() => navigate('/visualizer')}
              className="relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium text-white overflow-hidden group"
            >
              <span className="relative z-10 flex items-center">
                <GiProcessor className="mr-2" />
                Start Visualizing
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-center mt-8 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <span className="flex items-center">
              <SiGooglegemini className="mr-2" />
              Powered by Gemini AI
            </span>
          </motion.div>
        </motion.div>

        {/* Features grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="initial"
              whileHover="hover"
              onClick={() => navigate(feature.route)}
              className={`bg-gradient-to-br ${feature.bgColor} border border-gray-800 rounded-xl p-8 cursor-pointer backdrop-blur-sm hover:shadow-lg transition-all`}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-center">
                {feature.icon}
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Demo section */}
        <motion.div 
          className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <h2 className="text-3xl font-bold text-white mb-4">See Algorithms Come to Life</h2>
                <p className="text-gray-300 mb-6">
                  Our 3D visualizations make complex algorithms intuitive. Watch as data structures transform with each step, with detailed explanations from our AI tutor.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-md bg-blue-500 text-white">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-300">Step-by-step animations with interactive controls</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-md bg-blue-500 text-white">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-300">Time complexity analysis for each algorithm</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-md bg-blue-500 text-white">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-300">Ask questions and get explanations from AI tutor</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <motion.div 
                  className="relative h-64 md:h-80 bg-gray-900 rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                    alt="Algorithm Visualization" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent flex items-end p-6">
                    <button 
                      onClick={() => navigate('/visualizer')}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
                    >
                      <FaRobot className="mr-2" />
                      Try Interactive Demo
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer 
          className="mt-20 text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p>© {new Date().getFullYear()} Algorithm Visualizer. All rights reserved.</p>
          <p className="mt-2">Built with React, Three.js, and Gemini AI</p>
        </motion.footer>
      </div>
    </motion.div>
  );
};

export default HomePage;