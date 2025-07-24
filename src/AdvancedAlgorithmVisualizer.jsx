import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaExpand, FaCompress, FaHistory, FaInfoCircle, FaRobot } from 'react-icons/fa';
import { GiProcessor } from 'react-icons/gi';
import { SiGooglegemini } from 'react-icons/si';
import { MdClose } from 'react-icons/md';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import React from 'react';
// Enhanced AI Tutor Component
const AITutor = ({ 
  problemData, 
  currentStep, 
  onClose,
  isSpeaking,
  setIsSpeaking,
  generateVisualization
}) => {
  const [tutorMessages, setTutorMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);

  // Enhanced tutor responses with more detailed explanations
  const tutorResponses = {
    initial: [
      {
        text: `Hello! I'm your Algorithm Tutor. Let's explore ${problemData?.title || 'this algorithm'} together!`,
        details: "I can explain each step, analyze time complexity, provide examples, and even generate new visualizations based on your questions."
      },
      {
        text: `This algorithm is categorized as: ${problemData?.category || 'General'}`,
        details: `The ${problemData?.category} category means we're working with ${getCategoryDescription(problemData?.category)}.`
      },
      {
        text: `Time complexity: ${problemData?.timeComplexity?.average || 'Not specified'}`,
        details: `This means the algorithm's performance scales as ${problemData?.timeComplexity?.average} with input size.`
      },
      "What would you like me to explain in more detail? You can ask about:",
      "- Specific steps in the algorithm",
      "- Time complexity analysis",
      "- How to optimize the approach",
      "- Real-world applications",
      "- Or request a new visualization with different inputs"
    ],
    binarySearch: [
      {
        text: "Binary search works by repeatedly dividing the search interval in half.",
        details: "At each step, the algorithm compares the middle element of the interval with the target value. If they're not equal, it eliminates half of the remaining elements based on whether the target is smaller or larger than the middle element."
      },
      {
        text: "It's much faster than linear search - O(log n) vs O(n)!",
        details: "This logarithmic complexity comes from halving the search space at each step. For an array of size 1,000,000, binary search would need at most 20 comparisons compared to 1,000,000 for linear search."
      },
      {
        text: "Notice how the pointers move to eliminate half the remaining elements each time.",
        details: "The left and right pointers define the current search space. The mid pointer shows where we're checking. Watch how they converge toward the target."
      }
    ],
    quickSort: [
      {
        text: "QuickSort is a divide-and-conquer algorithm that partitions the array.",
        details: "It selects a 'pivot' element and partitions the array into elements less than the pivot and elements greater than the pivot. This partitioning is done in linear time."
      },
      {
        text: "The pivot element is crucial - ideally it should be the median.",
        details: "Choosing a good pivot (like the median) ensures balanced partitions. A bad pivot choice (like always using the first element) can lead to O(n²) worst-case performance."
      },
      {
        text: "Watch how elements are swapped around the pivot point.",
        details: "The partitioning process maintains two pointers that move toward each other, swapping elements that are on the wrong side of the pivot."
      }
    ],
    bfs: [
      {
        text: "BFS explores all neighbor nodes at the present depth before moving deeper.",
        details: "It uses a queue to keep track of nodes to visit next, ensuring we visit nodes level by level. This makes it ideal for finding shortest paths in unweighted graphs."
      },
      {
        text: "It uses a queue to keep track of nodes to visit next.",
        details: "The queue ensures we process nodes in the order we discover them (FIFO). This is what gives BFS its characteristic level-by-level exploration."
      },
      {
        text: "Notice how it systematically explores level by level.",
        details: "In the visualization, you can see how all nodes at distance k from the source are visited before any nodes at distance k+1."
      }
    ],
    default: [
      {
        text: "This step shows an important part of the algorithm's operation.",
        details: "Let me walk you through what's happening here and why it's significant for the algorithm's overall performance."
      },
      {
        text: "Notice how the data structure is being manipulated here.",
        details: "The way we're modifying the data structure in this step is key to achieving the algorithm's efficiency. Watch how the changes affect subsequent steps."
      },
      {
        text: "The time complexity at this stage is particularly interesting.",
        details: "This step contributes significantly to the overall complexity. The operations here are what make the algorithm's performance characteristics what they are."
      }
    ]
  };

  // Helper function to get category descriptions
  function getCategoryDescription(category) {
    const descriptions = {
      'Array': 'a linear data structure with contiguous memory allocation',
      'Tree': 'a hierarchical data structure with nodes and edges',
      'Graph': 'a collection of nodes connected by edges, which can be directed or undirected',
      'LinkedList': 'a linear data structure where elements are linked using pointers',
      'HashTable': 'a data structure that implements an associative array using hash functions',
      'Recursion': 'a method where the solution depends on solutions to smaller instances of the same problem'
    };
    return descriptions[category] || 'this type of data structure';
  }

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorMessages]);

  // Generate initial tutor messages when problem data loads
  useEffect(() => {
    if (problemData) {
      setIsTyping(true);
      setTimeout(() => {
        setTutorMessages([
          ...tutorResponses.initial.map(msg => typeof msg === 'string' ? 
            { text: msg, fromUser: false } : 
            { text: msg.text, details: msg.details, fromUser: false }
          )
        ]);
        setIsTyping(false);
      }, 1000);
    }
  }, [problemData]);

  // Generate step-specific explanations
  useEffect(() => {
    if (problemData && currentStep >= 0) {
      const step = problemData.steps[currentStep];
      const algoType = problemData.title.toLowerCase();
      
      let responses = [];
      
      if (algoType.includes('binary search')) {
        responses = tutorResponses.binarySearch;
      } else if (algoType.includes('quick') || algoType.includes('sort')) {
        responses = tutorResponses.quickSort;
      } else if (algoType.includes('bfs') || algoType.includes('breadth')) {
        responses = tutorResponses.bfs;
      } else {
        responses = tutorResponses.default;
      }
      
      setIsTyping(true);
      setTimeout(() => {
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setTutorMessages(prev => [
          ...prev,
          { 
            text: `Step ${currentStep + 1}: ${step.description}`,
            fromUser: false 
          },
          typeof randomResponse === 'string' ? 
            { text: randomResponse, fromUser: false } :
            { 
              text: randomResponse.text, 
              details: randomResponse.details,
              fromUser: false 
            }
        ]);
        setIsTyping(false);
      }, 1500);
    }
  }, [currentStep, problemData]);

  // Handle user queries
  const handleUserQuery = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const query = userInput;
    setTutorMessages(prev => [...prev, { text: query, fromUser: true }]);
    setUserInput('');
    setIsTyping(true);
    
    // Process different types of queries
    setTimeout(() => {
      if (query.toLowerCase().includes('time complexity')) {
        handleTimeComplexityQuery();
      } else if (query.toLowerCase().includes('example') || query.toLowerCase().includes('sample')) {
        handleExampleQuery();
      } else if (query.toLowerCase().includes('optimiz') || query.toLowerCase().includes('improve')) {
        handleOptimizationQuery();
      } else if (query.toLowerCase().includes('visualiz') || query.toLowerCase().includes('show me')) {
        handleVisualizationRequest(query);
      } else {
        handleGeneralQuery(query);
      }
    }, 1000);
  };

  const handleTimeComplexityQuery = () => {
    setTutorMessages(prev => [
      ...prev,
      { 
        text: `Let me analyze the time complexity of ${problemData.title}:`,
        fromUser: false 
      },
      { 
        text: `Best Case: ${problemData.timeComplexity.best}`,
        details: getComplexityExplanation(problemData.timeComplexity.best, 'best'),
        fromUser: false 
      },
      { 
        text: `Average Case: ${problemData.timeComplexity.average}`,
        details: getComplexityExplanation(problemData.timeComplexity.average, 'average'),
        fromUser: false 
      },
      { 
        text: `Worst Case: ${problemData.timeComplexity.worst}`,
        details: getComplexityExplanation(problemData.timeComplexity.worst, 'worst'),
        fromUser: false 
      },
      { 
        text: `Space Complexity: ${problemData.timeComplexity.space}`,
        details: getComplexityExplanation(problemData.timeComplexity.space, 'space'),
        fromUser: false 
      }
    ]);
    setIsTyping(false);
  };

  const getComplexityExplanation = (complexity, type) => {
    const explanations = {
      'O(1)': 'Constant time - the runtime doesn\'t depend on input size',
      'O(log n)': 'Logarithmic time - the runtime grows logarithmically with input size',
      'O(n)': 'Linear time - the runtime grows proportionally with input size',
      'O(n log n)': 'Linearithmic time - common in efficient sorting algorithms',
      'O(n²)': 'Quadratic time - the runtime grows with the square of input size',
      'O(2^n)': 'Exponential time - the runtime doubles with each addition to input'
    };
    
    const typeContext = {
      'best': 'This is the most favorable scenario where the algorithm performs at its fastest.',
      'average': 'This is the expected performance under typical conditions.',
      'worst': 'This is the scenario where the algorithm performs at its slowest.',
      'space': 'This measures how much additional memory the algorithm needs.'
    };
    
    return `${typeContext[type] || ''} ${explanations[complexity] || 'This complexity indicates...'}`;
  };

  const handleExampleQuery = () => {
    const examples = {
      'Binary Search': [
        { input: '[1, 3, 5, 7, 9, 11, 13], target: 7', output: '3 (index of 7)' },
        { input: '[2, 4, 6, 8, 10], target: 5', output: '-1 (not found)' }
      ],
      'Quick Sort': [
        { input: '[10, 80, 30, 90, 40, 50, 70]', output: '[10, 30, 40, 50, 70, 80, 90]' },
        { input: '[5, 1, 8, 3, 2]', output: '[1, 2, 3, 5, 8]' }
      ],
      'BFS': [
        { input: 'Graph with nodes A-B-C, start at A', output: 'Visits A, then B, then C' },
        { input: 'Tree with root 1, children 2 and 3', output: 'Visits 1, then 2, then 3' }
      ]
    };
    
    const algoExamples = examples[problemData.title] || [
      { input: 'Sample input', output: 'Expected output' }
    ];
    
    setTutorMessages(prev => [
      ...prev,
      { 
        text: `Here are some examples for ${problemData.title}:`,
        fromUser: false 
      },
      ...algoExamples.map(example => ({
        text: `Input: ${example.input}\nOutput: ${example.output}`,
        fromUser: false
      })),
      { 
        text: "Would you like me to generate a visualization for any of these examples?",
        fromUser: false 
      }
    ]);
    setIsTyping(false);
  };

  const handleOptimizationQuery = () => {
    const optimizations = {
      'Binary Search': [
        "Ensure the input array is always sorted",
        "Use mid = low + (high-low)/2 to avoid integer overflow",
        "Consider interpolation search for uniformly distributed data"
      ],
      'Quick Sort': [
        "Use median-of-three for better pivot selection",
        "Switch to insertion sort for small subarrays",
        "Implement tail recursion optimization"
      ],
      'BFS': [
        "Use a visited set to avoid cycles in graphs",
        "For shortest path, stop when you reach the target",
        "Use bidirectional BFS for further optimization"
      ]
    };
    
    const algoOptimizations = optimizations[problemData.title] || [
      "Analyze your specific use case for potential optimizations",
      "Consider alternative data structures that might be more efficient",
      "Look for ways to reduce unnecessary computations"
    ];
    
    setTutorMessages(prev => [
      ...prev,
      { 
        text: `Here are some optimization tips for ${problemData.title}:`,
        fromUser: false 
      },
      ...algoOptimizations.map(tip => ({
        text: `• ${tip}`,
        fromUser: false
      })),
      { 
        text: "Would you like me to explain any of these in more detail?",
        fromUser: false 
      }
    ]);
    setIsTyping(false);
  };

  const handleVisualizationRequest = (query) => {
    // Extract potential parameters from the query
    const sizeMatch = query.match(/size (\d+)/i);
    const valuesMatch = query.match(/values? ([0-9,\s]+)/i);
    
    let response = {
      text: "I can generate a new visualization with different parameters.",
      fromUser: false
    };
    
    if (sizeMatch || valuesMatch) {
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 10;
      const values = valuesMatch ? 
        valuesMatch[1].split(',').map(v => parseInt(v.trim())) : 
        Array.from({length: size}, () => Math.floor(Math.random() * 100));
      
      response.text = `Generating new visualization with values: ${values.join(', ')}`;
      
      // Generate new visualization after a delay
      setTimeout(() => {
        generateVisualization(`Visualize ${problemData.title} with array [${values.join(', ')}]`);
      }, 2000);
    } else {
      response.text = "What specific visualization would you like to see? You can say things like:";
      response.details = [
        "- 'Show me with array size 20'",
        "- 'Visualize with values 5, 10, 15, 20'",
        "- 'Generate a larger example'"
      ].join('\n');
    }
    
    setTutorMessages(prev => [...prev, response]);
    setIsTyping(false);
  };

  const handleGeneralQuery = (query) => {
    const responses = [
      {
        text: "That's an excellent question about this algorithm!",
        details: `Regarding "${query}", in the context of ${problemData.title}, here's what's happening: The algorithm ${problemData.steps[currentStep].description.toLowerCase()} This is important because...`
      },
      {
        text: "I'm glad you asked about that aspect!",
        details: `In ${problemData.title}, this relates to how the algorithm manages ${problemData.category.toLowerCase()} data structures. The current step shows ${problemData.steps[currentStep].description.toLowerCase()} which is key to understanding ${problemData.title}.`
      },
      {
        text: "Interesting point! Let me explain how this works...",
        details: `The algorithm handles this by ${getRandomAlgorithmDetail()}. This connects to the broader concept of ${getRandomCSConcept()} which is fundamental to many algorithms.`
      }
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setTutorMessages(prev => [
      ...prev,
      { 
        text: randomResponse.text,
        details: randomResponse.details,
        fromUser: false 
      }
    ]);
    setIsTyping(false);
  };

  const getRandomAlgorithmDetail = () => {
    const details = [
      "dividing the problem into smaller subproblems",
      "using efficient data structures to organize information",
      "making locally optimal choices at each step",
      "exploiting problem structure to reduce computations",
      "systematically exploring possible solutions"
    ];
    return details[Math.floor(Math.random() * details.length)];
  };

  const getRandomCSConcept = () => {
    const concepts = [
      "divide and conquer",
      "dynamic programming",
      "greedy algorithms",
      "graph theory",
      "recursion",
      "backtracking",
      "space-time tradeoffs"
    ];
    return concepts[Math.floor(Math.random() * concepts.length)];
  };

  // Toggle speech synthesis
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      tutorMessages.forEach(msg => {
        if (!msg.fromUser) {
          const utterance = new SpeechSynthesisUtterance(msg.text + (msg.details ? '. ' + msg.details : ''));
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      });
    }
  };

  return (
    <motion.div 
      className="fixed bottom-4 right-4 w-80 bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="bg-blue-600 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <FaRobot className="mr-2" />
          <h3 className="font-semibold">Algorithm Tutor</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleSpeech}
            className={`p-1 rounded-full ${isSpeaking ? 'bg-blue-700' : 'bg-blue-800'}`}
            title={isSpeaking ? 'Stop speaking' : 'Start speaking'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={onClose} className="p-1 rounded-full bg-blue-800">
            <MdClose className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto p-3 space-y-3">
        {tutorMessages.map((message, index) => (
          <motion.div
            key={index}
            className={`p-2 rounded-lg max-w-xs ${message.fromUser ? 'ml-auto bg-blue-600' : 'mr-auto bg-gray-700'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="whitespace-pre-wrap">{message.text}</div>
            {message.details && (
              <motion.div
                className="mt-1 pt-1 border-t border-gray-600 text-xs text-gray-300 whitespace-pre-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {message.details}
              </motion.div>
            )}
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            className="p-2 rounded-lg max-w-xs mr-auto bg-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-700">
        <form onSubmit={handleUserQuery} className="flex">
          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            type="text"
            placeholder="Ask about the algorithm..."
            className="flex-1 bg-gray-700 rounded-l-lg p-2 text-sm focus:outline-none"
          />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-3 rounded-r-lg"
          >
            Send
          </button>
        </form>
        <div className="text-xs text-gray-400 mt-1">
          Try: "Explain time complexity", "Show an example", or "Visualize with different values"
        </div>
      </div>
    </motion.div>
  );
};

// Visualization Components (Memoized for performance)
const ArrayViz = React.memo(({ arrayData }) => {
  return (
    <group position={[-(arrayData.value.length * 0.9) / 2, 0, 0]}>
      {arrayData.value.map((value, i) => {
        const isHighlighted = arrayData.highlight?.includes(i);
        const pointerData = arrayData.pointers || {};
        
        return (
          <group key={i}>
            <mesh position={[i * 0.9, 0, 0]}>
              <boxGeometry args={[0.8, 0.8, 0.2]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#f59e0b' : '#3b82f6'} 
                metalness={0.3}
                roughness={0.2}
              />
              <Text
                position={[0, 0, 0.15]}
                fontSize={0.5}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {value}
              </Text>
            </mesh>
            
            {Object.entries(pointerData).map(([name, ptrIndex]) => {
              if (ptrIndex === i) {
                return (
                  <group key={name} position={[i * 0.9, -1.5, 0]}>
                    <mesh position={[0, 0.5, 0]}>
                      <coneGeometry args={[0.2, 0.8, 4]} />
                      <meshStandardMaterial color="#10b981" metalness={0.5} />
                    </mesh>
                    <Text
                      position={[0, 1.2, 0]}
                      fontSize={0.3}
                      color="#10b981"
                      anchorX="center"
                      anchorY="middle"
                    >
                      {name}
                    </Text>
                  </group>
                );
              }
              return null;
            })}
          </group>
        );
      })}
    </group>
  );
});

const TreeViz = React.memo(({ treeData }) => {
  return (
    <>
      {treeData.edges?.map((edge, i) => {
        const fromNode = treeData.nodes.find(n => n.id === edge.from);
        const toNode = treeData.nodes.find(n => n.id === edge.to);
        
        if (!fromNode || !toNode) return null;

        const start = new THREE.Vector3(fromNode.x, -fromNode.y, 0);
        const end = new THREE.Vector3(toNode.x, -toNode.y, 0);
        const distance = start.distanceTo(end);
        const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction
        );

        const isHighlighted = treeData.highlight?.includes(edge.from) || 
                            treeData.highlight?.includes(edge.to);

        return (
          <group key={i} position={midPoint}>
            <mesh quaternion={quaternion}>
              <cylinderGeometry args={[0.05, 0.05, distance, 8]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#f59e0b' : '#6b7280'} 
                metalness={0.1}
              />
            </mesh>
          </group>
        );
      })}
      
      {treeData.nodes?.map(node => {
        const isHighlighted = treeData.highlight?.includes(node.id);
        const isInPath = treeData.traversalPath?.includes(node.id);

        return (
          <group key={node.id} position={[node.x, -node.y, 0]}>
            <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#f59e0b' : isInPath ? '#10b981' : '#3b82f6'} 
                metalness={0.3}
                roughness={0.2}
              />
              <Text
                position={[0, 0, 0.5]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {node.value}
              </Text>
            </mesh>
          </group>
        );
      })}
    </>
  );
});

const GraphViz = React.memo(({ graphData }) => {
  return (
    <>
      {graphData.edges?.map((edge, i) => {
        const fromNode = graphData.nodes.find(n => n.id === edge.from);
        const toNode = graphData.nodes.find(n => n.id === edge.to);
        
        if (!fromNode || !toNode) return null;

        const start = new THREE.Vector3(fromNode.x, -fromNode.y, 0);
        const end = new THREE.Vector3(toNode.x, -toNode.y, 0);
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const distance = start.distanceTo(end);
        const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction
        );

        const isHighlighted = graphData.highlight?.includes(edge.from) || 
                            graphData.highlight?.includes(edge.to);

        return (
          <group key={i} position={midPoint}>
            <mesh quaternion={quaternion}>
              <cylinderGeometry args={[0.03, 0.03, distance, 8]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#f59e0b' : '#6b7280'} 
                metalness={0.1}
              />
            </mesh>
            
            {graphData.directed && (
              <mesh position={[0, distance/2, 0]} quaternion={quaternion}>
                <coneGeometry args={[0.1, 0.2, 8]} />
                <meshStandardMaterial color={isHighlighted ? '#f59e0b' : '#6b7280'} />
              </mesh>
            )}
          </group>
        );
      })}
      
      {graphData.nodes?.map(node => {
        const isHighlighted = graphData.highlight?.includes(node.id);
        const isVisited = graphData.visited?.includes(node.id);

        return (
          <group key={node.id} position={[node.x, -node.y, 0]}>
            <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#f59e0b' : isVisited ? '#10b981' : '#3b82f6'} 
                metalness={0.3}
                roughness={0.2}
              />
              <Text
                position={[0, 0, 0.5]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {node.value}
              </Text>
            </mesh>
          </group>
        );
      })}
    </>
  );
});

const LinkedListViz = React.memo(({ listData }) => {
  return (
    <group position={[-(listData.nodes.length * 1.5) / 2, 0, 0]}>
      {listData.nodes.map((node, i) => {
        const isHighlighted = listData.highlight?.includes(node.id);
        
        return (
          <group key={node.id} position={[i * 1.5, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.8, 0.8, 0.2]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#f59e0b' : '#3b82f6'} 
                metalness={0.3}
                roughness={0.2}
              />
              <Text
                position={[0, 0, 0.15]}
                fontSize={0.4}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {node.value}
              </Text>
            </mesh>
            
            {node.next && (
              <group position={[0.8, 0, 0]}>
                <mesh position={[0.4, 0, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                  <meshStandardMaterial color="#6b7280" metalness={0.1} />
                </mesh>
                <mesh position={[0.9, 0, 0]}>
                  <coneGeometry args={[0.1, 0.2, 8]} />
                  <meshStandardMaterial color="#6b7280" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
});

const HashTableViz = React.memo(({ tableData }) => {
  return (
    <group position={[-(tableData.buckets.length * 1.5) / 2, 0, 0]}>
      {tableData.buckets.map((bucket, i) => {
        const isHighlighted = tableData.highlight?.includes(i);
        
        return (
          <group key={i} position={[i * 1.5, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.2, 0.2, 0.8]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#f59e0b' : '#3b82f6'} 
                metalness={0.3}
                roughness={0.2}
              />
              <Text
                position={[0, 0.2, 0.5]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                Bucket {i}
              </Text>
            </mesh>
            
            {bucket.entries?.map((entry, j) => (
              <group key={j} position={[0, -0.3 - (j * 0.4), 0]}>
                <mesh>
                  <boxGeometry args={[1, 0.3, 0.6]} />
                  <meshStandardMaterial color="#4b5563" metalness={0.2} />
                  <Text
                    position={[0, 0, 0.35]}
                    fontSize={0.2}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {entry.key}: {entry.value}
                  </Text>
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
});

const RecursionViz = React.memo(({ recursionData }) => {
  return (
    <group position={[0, (recursionData.stackFrames.length * 0.9) / 2, 0]}>
      {recursionData.stackFrames.map((frame, i) => {
        const isCurrent = i === recursionData.currentFrame;
        
        return (
          <group key={i} position={[0, -i * 0.9, 0]}>
            <mesh>
              <boxGeometry args={[1.5, 0.8, 0.2]} />
              <meshStandardMaterial 
                color={isCurrent ? '#f59e0b' : '#3b82f6'} 
                metalness={0.3}
                roughness={0.2}
              />
              <Text
                position={[0, 0, 0.15]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {frame.name}
              </Text>
              
              {Object.entries(frame.variables || {}).map(([key, value], j) => (
                <Text
                  key={j}
                  position={[-0.6, -0.2 - (j * 0.15), 0.16]}
                  fontSize={0.2}
                  color="#d1d5db"
                  anchorX="left"
                  anchorY="middle"
                >
                  {key}: {value}
                </Text>
              ))}
            </mesh>
          </group>
        );
      })}
    </group>
  );
});
const TextViz = React.memo(({ textData }) => {
  return (
    <Text
      position={[0, 0, 0]}
      fontSize={0.4}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
      maxWidth={10}
      lineHeight={1}
      letterSpacing={0.02}
      textAlign="center"
    >
      {textData.value}
    </Text>
  );
});

const DataStructureVisualizer = ({ elements, category }) => {
  const memoizedElements = useMemo(() => elements, [elements]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <OrbitControls enableZoom={true} enablePan={true} />
      
      {memoizedElements.map((element, i) => {
        switch (element.type) {
          case 'array':
            return <ArrayViz key={`${i}-${element.value.join('-')}`} arrayData={element} />;
          case 'tree':
            return <TreeViz key={`${i}-${element.nodes?.length || 0}`} treeData={element} />;
          case 'graph':
            return <GraphViz key={`${i}-${element.nodes?.length || 0}`} graphData={element} />;
          case 'linkedList':
            return <LinkedListViz key={`${i}-${element.nodes?.length || 0}`} listData={element} />;
          case 'hashTable':
            return <HashTableViz key={`${i}-${element.buckets?.length || 0}`} tableData={element} />;
          case 'recursion':
            return <RecursionViz key={`${i}-${element.stackFrames?.length || 0}`} recursionData={element} />;
          case 'text':
            return <TextViz key={`${i}-${element.value.substring(0, 20)}`} textData={element} />;
          default:
            return (
              <Text
                key={i}
                position={[0, 0, 0]}
                fontSize={0.5}
                color="#ff0000"
                anchorX="center"
                anchorY="middle"
              >
                Unsupported visualization type: {element.type}
              </Text>
            );
        }
      })}
    </>
  );
};

// Main App Component
export default function AdvancedAlgorithmVisualizer() {
  const [problemInput, setProblemInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [problemData, setProblemData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [visualizationHistory, setVisualizationHistory] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('visualization');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showComplexity, setShowComplexity] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const autoPlayTimer = useRef(null);
  const controls = useAnimation();
  const containerRef = useRef(null);

  // API Configuration
  const API_KEY = import.meta.env.VITE_API_KEY;
  const MODEL_NAME = 'gemini-1.5-flash';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

  // Enhanced prompt with strict formatting requirements
  const createVisualizationPrompt = (problem) => {
    return `Create a detailed algorithm visualization in JSON format for: ${problem}.
    Include time complexity analysis and detailed explanations.
    
    The response must be a valid JSON object with these exact properties:
    {
      "title": "Algorithm Name",
      "description": "Brief explanation",
      "difficulty": "Easy/Medium/Hard",
      "category": "Array|Tree|Graph|LinkedList|HashTable|Recursion",
      "timeComplexity": {
        "best": "O(...)",
        "average": "O(...)",
        "worst": "O(...)",
        "space": "O(...)"
      },
      "keyPoints": ["Important concept 1", "Important concept 2"],
      "pseudocode": "Step-by-step pseudocode",
      "steps": [
        {
          "description": "Explanation of this step",
          "visualElements": [
            {
              "type": "array|tree|graph|linkedList|hashTable|recursion|text",
              // Additional properties based on type
            }
          ]
        }
      ]
    }

    For array visualization:
    {
      "type": "array",
      "value": [1, 2, 3],
      "highlight": [0, 2],
      "pointers": {"left": 0, "right": 2}
    }

    For tree visualization:
    {
      "type": "tree",
      "nodes": [
        {"id": 1, "value": 50, "x": 0, "y": 0},
        {"id": 2, "value": 30, "x": -1, "y": -1}
      ],
      "edges": [
        {"from": 1, "to": 2}
      ],
      "highlight": [1],
      "traversalPath": [1, 2]
    }

    For graph visualization:
    {
      "type": "graph",
      "nodes": [
        {"id": 1, "value": "A", "x": 0, "y": 0},
        {"id": 2, "value": "B", "x": 1, "y": 1}
      ],
      "edges": [
        {"from": 1, "to": 2}
      ],
      "highlight": [1],
      "visited": [1, 2],
      "directed": false
    }

    For linked list:
    {
      "type": "linkedList",
      "nodes": [
        {"id": 1, "value": 5, "next": 2},
        {"id": 2, "value": 10, "next": null}
      ],
      "highlight": [1]
    }

    For hash table:
    {
      "type": "hashTable",
      "buckets": [
        {"entries": [{"key": "a", "value": 1}]},
        {"entries": []}
      ],
      "highlight": [0]
    }

    For recursion:
    {
      "type": "recursion",
      "stackFrames": [
        {"name": "fib(5)", "variables": {"n": 5}},
        {"name": "fib(3)", "variables": {"n": 3}}
      ],
      "currentFrame": 1
    }

    For text:
    {
      "type": "text",
      "value": "Explanation text"
    }

    IMPORTANT: The response must be valid JSON that can be parsed directly. 
    Include all necessary properties for the visualization to work properly.`;
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle autoplay with speed control
  useEffect(() => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }

    if (autoPlay && problemData?.steps) {
      const delay = 3000 / playbackSpeed;
      autoPlayTimer.current = setInterval(() => {
        setCurrentStep(prev => (prev < problemData.steps.length - 1 ? prev + 1 : 0));
      }, delay);
    }

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [autoPlay, problemData, playbackSpeed]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('algorithmVisualizerHistory');
    if (savedHistory) {
      try {
        setVisualizationHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (visualizationHistory.length > 0) {
      localStorage.setItem('algorithmVisualizerHistory', JSON.stringify(visualizationHistory));
    }
  }, [visualizationHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problemInput.trim()) {
      setError('Please enter a problem name or description');
      return;
    }

    setIsLoading(true);
    setError('');
    setProblemData(null);
    setCurrentStep(0);
    setAutoPlay(false);

    try {
      const prompt = createVisualizationPrompt(problemInput);
      
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            topP: 0.9,
            topK: 20
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonString = responseText.slice(jsonStart, jsonEnd);
      const parsedData = JSON.parse(jsonString);

      // Validate response
      if (!parsedData.steps || !Array.isArray(parsedData.steps)) {
        throw new Error('Invalid visualization format from API');
      }

      // Validate visualization elements
      if (!parsedData.steps.every(step => 
        step.visualElements && Array.isArray(step.visualElements)
      )) {
        throw new Error('Each step must have visualElements array');
      }

      // Add to history
      const newHistoryItem = {
        title: parsedData.title || problemInput,
        query: problemInput,
        data: parsedData,
        timestamp: new Date().toISOString(),
        category: parsedData.category || 'General'
      };
      
      setVisualizationHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
      setProblemData(parsedData);
      setShowTutor(true); // Show tutor when new visualization is loaded
      await controls.start("visible");
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
      
      // Fallback to sample data if API fails
      const sampleData = getSampleData(problemInput.toLowerCase());
      if (sampleData) {
        setProblemData(sampleData);
        setShowTutor(true);
        setError(`Using sample data. ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced sample data with time complexity analysis
  const getSampleData = (problem) => {
    const samples = {
      'binary search': {
        title: 'Binary Search',
        description: 'Search a sorted array by repeatedly dividing the search interval in half. Works by comparing the target value to the middle element of the array and eliminating half of the remaining elements based on the comparison.',
        difficulty: 'Easy',
        category: 'Array',
        timeComplexity: {
          best: 'O(1)',
          average: 'O(log n)',
          worst: 'O(log n)',
          space: 'O(1)'
        },
        keyPoints: [
          "Requires sorted array",
          "Divide and conquer approach",
          "Efficient for large datasets"
        ],
        pseudocode: `function binarySearch(arr, target):
  1. left = 0, right = arr.length - 1
  2. while left <= right:
     a. mid = floor((left + right) / 2)
     b. if arr[mid] == target: return mid
     c. if arr[mid] < target: left = mid + 1
     d. else: right = mid - 1
  3. return -1`,
        steps: [
          {
            description: "Initialize pointers at both ends of the array",
            visualElements: [
              {
                type: "array",
                value: [1, 3, 5, 7, 9, 11, 13],
                pointers: { left: 0, right: 6 }
              },
              { type: "text", value: "Target: 7" }
            ]
          },
          {
            description: "Calculate mid point (0 + 6)/2 = 3",
            visualElements: [
              {
                type: "array",
                value: [1, 3, 5, 7, 9, 11, 13],
                pointers: { left: 0, right: 6, mid: 3 }
              }
            ]
          },
          {
            description: "Found target at index 3!",
            visualElements: [
              {
                type: "array",
                value: [1, 3, 5, 7, 9, 11, 13],
                highlight: [3],
                pointers: { mid: 3 }
              },
              { type: "text", value: "Found 7 at index 3" }
            ]
          }
        ]
      },
      'tree traversal': {
        title: 'Tree Traversal',
        description: 'Depth-first search (DFS) traversal of a binary tree. Visits nodes by going as deep as possible along each branch before backtracking. Can be implemented using recursion or an explicit stack.',
        difficulty: 'Medium',
        category: 'Tree',
        timeComplexity: {
          best: 'O(n)',
          average: 'O(n)',
          worst: 'O(n)',
          space: 'O(h)' // h is height of tree
        },
        keyPoints: [
          "Visits all nodes in depth-first order",
          "Can be pre-order, in-order, or post-order",
          "Uses stack (either call stack or explicit)"
        ],
        pseudocode: `function dfs(node):
  1. if node is null: return
  2. visit(node)  // Pre-order
  3. dfs(node.left)
  4. dfs(node.right)`,
        steps: [
          {
            description: "Start at root node (50)",
            visualElements: [
              {
                type: "tree",
                nodes: [
                  { id: 1, value: 50, x: 0, y: 0 },
                  { id: 2, value: 30, x: -1, y: -1 },
                  { id: 3, value: 70, x: 1, y: -1 },
                  { id: 4, value: 20, x: -1.5, y: -2 },
                  { id: 5, value: 40, x: -0.5, y: -2 },
                  { id: 6, value: 60, x: 0.5, y: -2 },
                  { id: 7, value: 80, x: 1.5, y: -2 }
                ],
                edges: [
                  { from: 1, to: 2 },
                  { from: 1, to: 3 },
                  { from: 2, to: 4 },
                  { from: 2, to: 5 },
                  { from: 3, to: 6 },
                  { from: 3, to: 7 }
                ],
                highlight: [1],
                traversalPath: [1]
              }
            ]
          },
          {
            description: "Visit left child (30)",
            visualElements: [
              {
                type: "tree",
                nodes: [
                  { id: 1, value: 50, x: 0, y: 0 },
                  { id: 2, value: 30, x: -1, y: -1 },
                  { id: 3, value: 70, x: 1, y: -1 },
                  { id: 4, value: 20, x: -1.5, y: -2 },
                  { id: 5, value: 40, x: -0.5, y: -2 },
                  { id: 6, value: 60, x: 0.5, y: -2 },
                  { id: 7, value: 80, x: 1.5, y: -2 }
                ],
                edges: [
                  { from: 1, to: 2 },
                  { from: 1, to: 3 },
                  { from: 2, to: 4 },
                  { from: 2, to: 5 },
                  { from: 3, to: 6 },
                  { from: 3, to: 7 }
                ],
                highlight: [2],
                traversalPath: [1, 2]
              }
            ]
          },
          {
            description: "Visit leftmost node (20)",
            visualElements: [
              {
                type: "tree",
                nodes: [
                  { id: 1, value: 50, x: 0, y: 0 },
                  { id: 2, value: 30, x: -1, y: -1 },
                  { id: 3, value: 70, x: 1, y: -1 },
                  { id: 4, value: 20, x: -1.5, y: -2 },
                  { id: 5, value: 40, x: -0.5, y: -2 },
                  { id: 6, value: 60, x: 0.5, y: -2 },
                  { id: 7, value: 80, x: 1.5, y: -2 }
                ],
                edges: [
                  { from: 1, to: 2 },
                  { from: 1, to: 3 },
                  { from: 2, to: 4 },
                  { from: 2, to: 5 },
                  { from: 3, to: 6 },
                  { from: 3, to: 7 }
                ],
                highlight: [4],
                traversalPath: [1, 2, 4]
              }
            ]
          }
        ]
      },
      'quick sort': {
        title: 'Quick Sort',
        description: 'Divide and conquer algorithm that works by selecting a "pivot" element and partitioning the array around the pivot. Elements smaller than the pivot come before, elements larger come after. Then recursively sort the sub-arrays.',
        difficulty: 'Medium',
        category: 'Array',
        timeComplexity: {
          best: 'O(n log n)',
          average: 'O(n log n)',
          worst: 'O(n²)',
          space: 'O(log n)'
        },
        keyPoints: [
          "In-place sorting algorithm",
          "Efficient for large datasets",
          "Worst case occurs when pivot is smallest/largest element"
        ],
        pseudocode: `function quickSort(arr, low, high):
  1. if low < high:
     a. pivot = partition(arr, low, high)
     b. quickSort(arr, low, pivot - 1)
     c. quickSort(arr, pivot + 1, high)

function partition(arr, low, high):
  1. pivot = arr[high]
  2. i = low - 1
  3. for j = low to high - 1:
     a. if arr[j] < pivot:
        i = i + 1
        swap(arr[i], arr[j])
  4. swap(arr[i + 1], arr[high])
  5. return i + 1`,
        steps: [
          {
            description: "Initial array and select last element as pivot",
            visualElements: [
              {
                type: "array",
                value: [10, 80, 30, 90, 40, 50, 70],
                highlight: [6],
                pointers: { pivot: 6 }
              },
              { type: "text", value: "Pivot selected: 70" }
            ]
          },
          {
            description: "Partitioning: Move elements smaller than pivot to left",
            visualElements: [
              {
                type: "array",
                value: [10, 30, 40, 50, 80, 90, 70],
                highlight: [0, 1, 2, 3],
                pointers: { i: 3, j: 6 }
              }
            ]
          },
          {
            description: "Swap pivot with first element greater than pivot",
            visualElements: [
              {
                type: "array",
                value: [10, 30, 40, 50, 70, 90, 80],
                highlight: [4],
                pointers: { pivot: 4 }
              },
              { type: "text", value: "Pivot 70 now in correct position" }
            ]
          }
        ]
      }
    };

    return samples[problem] || null;
  };

  const renderVisualization = () => {
    if (!problemData?.steps) return null;
    
    const step = problemData.steps[currentStep];
    const progress = ((currentStep + 1) / problemData.steps.length) * 100;

    return (
      <motion.div
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Interactive Visualization</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              title="Show help"
            >
              <FaInfoCircle />
            </button>
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              title="Show history"
            >
              <FaHistory />
            </button>
            <button
              onClick={() => setShowComplexity(!showComplexity)}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              title="Show time complexity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
            <button
              onClick={() => setShowTutor(!showTutor)}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              title={showTutor ? 'Hide tutor' : 'Show tutor'}
            >
              <FaRobot />
            </button>
          </div>
        </div>

        {/* Help panel */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              className="mb-4 p-4 bg-gray-800 rounded-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Visualization Help</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                <li>Use the play/pause buttons to control animation</li>
                <li>Adjust speed with the dropdown menu</li>
                <li>Click on step indicators to jump to specific steps</li>
                <li>Rotate the view by dragging the visualization</li>
                <li>Zoom in/out with mouse wheel or pinch gesture</li>
                <li>Click the robot icon to interact with the AI tutor</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time complexity panel */}
        <AnimatePresence>
          {showComplexity && problemData.timeComplexity && (
            <motion.div
              className="mb-4 p-4 bg-gray-800 rounded-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Time Complexity Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Best Case</div>
                  <div className="text-green-400 font-mono">{problemData.timeComplexity.best}</div>
                </div>
                <div>
                  <div className="text-gray-400">Average Case</div>
                  <div className="text-yellow-400 font-mono">{problemData.timeComplexity.average}</div>
                </div>
                <div>
                  <div className="text-gray-400">Worst Case</div>
                  <div className="text-red-400 font-mono">{problemData.timeComplexity.worst}</div>
                </div>
                <div>
                  <div className="text-gray-400">Space Complexity</div>
                  <div className="text-blue-400 font-mono">{problemData.timeComplexity.space}</div>
                </div>
              </div>
              {problemData.keyPoints && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-400 mb-1">Key Points</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {problemData.keyPoints.map((point, i) => (
                      <li key={i} className="text-gray-300 text-sm">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Step description */}
        <motion.div
          key={`step-${currentStep}`}
          className="mb-4 p-4 bg-gray-800 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-lg text-blue-300">
            Step {currentStep + 1} of {problemData.steps.length}
          </div>
          <div className="text-white">
            {step.description}
          </div>
        </motion.div>

        {/* Visualization Canvas */}
        <div className="w-full h-96 md:h-[500px] bg-gray-900 rounded-xl overflow-hidden relative">
          {step.visualElements.length > 0 ? (
            <Canvas 
              camera={{ position: [0, 0, 10], fov: 50 }}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              frameloop={autoPlay ? "always" : "demand"}
            >
              <DataStructureVisualizer 
                elements={step.visualElements} 
                category={problemData.category} 
              />
            </Canvas>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400">No visualization elements for this step</p>
                <p className="text-sm text-gray-500 mt-1">Check the description for details</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="p-3 bg-gray-700 rounded-full disabled:opacity-50 hover:bg-gray-600"
            >
              <FaStepBackward className="text-white" />
            </button>
            
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="p-4 bg-blue-600 rounded-full hover:bg-blue-700"
            >
              {autoPlay ? (
                <FaPause className="text-white text-lg" />
              ) : (
                <FaPlay className="text-white text-lg" />
              )}
            </button>
            
            <button
              onClick={() => setCurrentStep(prev => Math.min(problemData.steps.length - 1, prev + 1))}
              disabled={currentStep === problemData.steps.length - 1}
              className="p-3 bg-gray-700 rounded-full disabled:opacity-50 hover:bg-gray-600"
            >
              <FaStepForward className="text-white" />
            </button>
          </div>
          
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-gray-700 text-white p-2 rounded text-sm"
          >
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1x Speed</option>
            <option value={1.5}>1.5x Speed</option>
            <option value={2}>2x Speed</option>
            <option value={3}>3x Speed</option>
          </select>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center mt-4 space-x-2">
          {problemData.steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentStep === index ? 'bg-blue-500 scale-125' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-gray-900 text-white p-4 md:p-8"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto relative">
        {/* AI Tutor */}
        {showTutor && problemData && (
          <AITutor 
            problemData={problemData}
            currentStep={currentStep}
            userQuery={userQuery}
            onClose={() => setShowTutor(false)}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {/* History Panel */}
        <AnimatePresence>
          {showHistoryPanel && (
            <motion.div
              className="absolute top-0 right-0 w-80 bg-gray-800 rounded-lg shadow-xl z-50 p-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Visualization History</h3>
                <button onClick={() => setShowHistoryPanel(false)} className="text-gray-400 hover:text-white">
                  &times;
                </button>
              </div>
              
              {visualizationHistory.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {visualizationHistory.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => {
                          setProblemData(item.data);
                          setShowHistoryPanel(false);
                          setShowTutor(true);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors flex items-center"
                      >
                        <div className="flex-1">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-400 flex justify-between">
                            <span>{item.category}</span>
                            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm py-4">No visualization history yet</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <header className="mb-8 text-center">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GiProcessor className="mr-3" /> Advanced Algorithm Visualizer
          </motion.h1>
          <p className="text-gray-400 text-lg flex items-center justify-center">
            Powered by <SiGooglegemini className="mx-2" /> Gemini AI
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <motion.div 
              className="bg-gray-800 rounded-xl p-6 shadow-lg sticky top-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold mb-4 text-blue-300">Visualize Algorithm</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <textarea
                    value={problemInput}
                    onChange={(e) => setProblemInput(e.target.value)}
                    placeholder="Enter algorithm name or description (e.g., Binary Search, Quick Sort, BFS)"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
                    isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Generating...
                    </>
                  ) : (
                    'Visualize Algorithm'
                  )}
                </button>
              </form>

              {error && (
                <motion.div 
                  className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">Try These Examples</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProblemInput('Binary Search')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Binary Search
                  </button>
                  <button
                    onClick={() => setProblemInput('Quick Sort')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Quick Sort
                  </button>
                  <button
                    onClick={() => setProblemInput('Breadth-First Search')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Graph BFS
                  </button>
                  <button
                    onClick={() => setProblemInput('Tree Traversal')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Tree DFS
                  </button>
                  <button
                    onClick={() => setProblemInput('Linked List Reversal')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    LinkedList
                  </button>
                  <button
                    onClick={() => setProblemInput('Hash Table')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Hash Table
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="flex justify-center items-center p-12 bg-gray-800 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <h3 className="text-xl font-medium text-blue-300">Generating Visualization</h3>
                    <p className="text-gray-400">Analyzing algorithm and creating interactive animation...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {problemData && (
              <motion.div
                className="bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex border-b border-gray-700">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-6 py-4 font-medium ${
                      activeTab === 'description' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('visualization')}
                    className={`px-6 py-4 font-medium ${
                      activeTab === 'visualization' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Visualization
                  </button>
                  <button
                    onClick={() => setActiveTab('pseudocode')}
                    className={`px-6 py-4 font-medium ${
                      activeTab === 'pseudocode' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Pseudocode
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{problemData.title}</h2>
                      <div className="flex items-center mt-2 space-x-2">
                        {problemData.difficulty && (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            problemData.difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
                            problemData.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-red-900 text-red-300'
                          }`}>
                            {problemData.difficulty}
                          </span>
                        )}
                        {problemData.category && (
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-300">
                            {problemData.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowTutor(!showTutor)}
                      className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                    >
                      <FaRobot />
                      <span>{showTutor ? 'Hide' : 'Show'} Tutor</span>
                    </button>
                  </div>

                  {activeTab === 'description' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="prose prose-invert max-w-none">
                        <p className="text-lg text-gray-300 mb-6">{problemData.description}</p>
                        
                        {problemData.examples?.length > 0 && (
                          <>
                            <h3 className="text-xl font-semibold text-white mb-4">Examples</h3>
                            <div className="space-y-4 mb-6">
                              {problemData.examples.map((example, index) => (
                                <motion.div
                                  key={index}
                                  className="bg-gray-700 p-4 rounded-lg"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <div className="font-mono text-sm text-gray-400 mb-1">
                                    <span className="text-gray-500">Input:</span> {example.input}
                                  </div>
                                  <div className="font-mono text-sm text-gray-400">
                                    <span className="text-gray-500">Output:</span> {example.output}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'visualization' && renderVisualization()}

                  {activeTab === 'pseudocode' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-xl font-semibold mb-4">Algorithm Approach</h3>
                      <p className="text-gray-300 mb-6">{problemData.visualization}</p>
                      
                      <h3 className="text-xl font-semibold mb-4">Pseudocode</h3>
                      <pre className="bg-gray-700 p-4 rounded-lg overflow-x-auto text-gray-300 text-sm md:text-base">
                        {problemData.pseudocode}
                      </pre>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {!isLoading && !problemData && (
              <motion.div
                className="bg-gray-800 rounded-xl shadow-lg p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-gray-400 mb-4">
                  <GiProcessor className="text-5xl mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-blue-300 mb-2">Algorithm Visualizer</h3>
                <p className="text-gray-400 mb-4">Enter an algorithm name or description to generate an interactive visualization</p>
                <div className="max-w-md mx-auto">
                  <ul className="text-sm text-gray-500 space-y-1 text-left">
                    <li>• Try common algorithms like Binary Search or Quick Sort</li>
                    <li>• Describe graph algorithms like Dijkstra's or BFS</li>
                    <li>• Explore data structures like Trees or Hash Tables</li>
                    <li>• Get explanations from the AI tutor after visualization</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm pb-8">
          <p>Advanced Algorithm Visualizer using Gemini {MODEL_NAME}</p>
          <p className="mt-1">Visualizations powered by React Three Fiber and Framer Motion</p>
        </footer>
      </div>
    </div>
  );
}