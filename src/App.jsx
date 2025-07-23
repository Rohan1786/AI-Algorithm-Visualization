import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaExpand, FaCompress, FaHistory, FaInfoCircle } from 'react-icons/fa';
import { GiProcessor } from 'react-icons/gi';
import { SiGooglegemini } from 'react-icons/si';

// Visualization Components
const DataStructureVisualizer = ({ elements, category }) => {
  // Array Visualization
  const ArrayViz = ({ arrayData }) => {
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
              
              {/* Pointer indicators */}
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
  };

  // Tree Visualization
  const TreeViz = ({ treeData }) => {
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
  };

  // Graph Visualization
  const GraphViz = ({ graphData }) => {
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
  };

  // Linked List Visualization
  const LinkedListViz = ({ listData }) => {
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
  };

  // Hash Table Visualization
  const HashTableViz = ({ tableData }) => {
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
  };

  // Recursion Visualization
  const RecursionViz = ({ recursionData }) => {
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
  };

  // Text Visualization
  const TextViz = ({ textData }) => {
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
  };

  // Main renderer that selects the appropriate visualization
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <OrbitControls enableZoom={true} enablePan={true} />
      
      {elements.map((element, i) => {
        switch (element.type) {
          case 'array':
            return <ArrayViz key={i} arrayData={element} />;
          case 'tree':
            return <TreeViz key={i} treeData={element} />;
          case 'graph':
            return <GraphViz key={i} graphData={element} />;
          case 'linkedList':
            return <LinkedListViz key={i} listData={element} />;
          case 'hashTable':
            return <HashTableViz key={i} tableData={element} />;
          case 'recursion':
            return <RecursionViz key={i} recursionData={element} />;
          case 'text':
            return <TextViz key={i} textData={element} />;
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
    The response must be a valid JSON object with these exact properties:
    {
      "title": "Algorithm Name",
      "description": "Brief explanation",
      "difficulty": "Easy/Medium/Hard",
      "category": "Array|Tree|Graph|LinkedList|HashTable|Recursion",
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
      await controls.start("visible");
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
      
      // Fallback to sample data if API fails
      const sampleData = getSampleData(problemInput.toLowerCase());
      if (sampleData) {
        setProblemData(sampleData);
        setError(`Using sample data. ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for common algorithms
  const getSampleData = (problem) => {
    const samples = {
      'binary search': {
        title: 'Binary Search',
        description: 'Search a sorted array by repeatedly dividing the search interval in half.',
        difficulty: 'Easy',
        category: 'Array',
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
        description: 'Depth-first search (DFS) traversal of a binary tree',
        difficulty: 'Medium',
        category: 'Tree',
        pseudocode: `function dfs(node):
  1. if node is null: return
  2. visit(node)
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
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
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
              </ul>
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
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
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