// import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaExpand, FaCompress, FaHistory, FaInfoCircle, FaRobot } from 'react-icons/fa';
import { GiProcessor } from 'react-icons/gi';
import { SiGooglegemini } from 'react-icons/si';
import { MdClose } from 'react-icons/md';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Enhanced AI Tutor Component
import { FaMicrophone, FaStop, FaRegLightbulb, FaChartLine, FaCode } from 'react-icons/fa';
import { MdSend } from 'react-icons/md';
// import { MdClose} from 'react-icons/md';
// import { SiGooglegemini } from 'react-icons/si';
// import { motion } from 'framer-motion';
// import { getRandomInt } from './utils'; // Assuming you have a utility function for random integers

const AITutor = React.memo(({ 
  problemData, 
  currentStep, 
  onClose,
  isSpeaking,
  setIsSpeaking,
  generateVisualization,
  modifyVisualization,
  setCurrentStep
}) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [showThinking, setShowThinking] = useState(false);
  const [conversationId, setConversationId] = useState(Date.now().toString());
  const [sessionStartTime] = useState(new Date());
  
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);
  const thinkingTimeoutRef = useRef(null);
  const geminiStreamRef = useRef(null);

  // API Configuration
  const API_KEY = import.meta.env.VITE_API_KEY;
  const MODEL_NAME = 'gemini-1.5-pro';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

  // Initialize the conversation with algorithm context
  useEffect(() => {
    if (problemData) {
      const initialContext = {
        role: 'system',
        content: `You are an expert computer science tutor specializing in algorithm visualization. 
        The user is currently working with the ${problemData.title} algorithm (${problemData.category} category).
        Key details:
        - Description: ${problemData.description}
        - Time Complexity: ${JSON.stringify(problemData.timeComplexity)}
        - Current Step: ${currentStep + 1}/${problemData.steps.length} - ${problemData.steps[currentStep]?.description}
        
        Your task is to:
        1. Explain algorithm concepts clearly with concrete examples
        2. Answer questions about time/space complexity
        3. Help modify visualizations with specific parameters
        4. Guide through debugging thought processes
        5. Suggest optimizations and alternative approaches
        
        Respond conversationally but precisely. When suggesting visualization changes, provide exact parameters.`
      };
      
      setMessages([initialContext, ...getInitialMessages()]);
      startNewConversation();
    }
  }, [problemData, currentStep]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle speech synthesis
  useEffect(() => {
    if (isSpeaking) {
      speakMessages();
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isSpeaking, messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (geminiStreamRef.current) {
        geminiStreamRef.current.abort();
      }
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
      }
    };
  }, []);

  const getInitialMessages = useCallback(() => {
    return [
      {
        role: 'assistant',
        content: `Hello! I'm your AI Algorithm Tutor. Let's explore ${problemData?.title || 'this algorithm'} together.`,
        metadata: {
          type: 'greeting',
          timestamp: new Date().toISOString()
        }
      },
      {
        role: 'assistant',
        content: `This is a ${problemData?.difficulty || 'medium'} difficulty ${problemData?.category || 'algorithm'} problem.`,
        metadata: {
          type: 'context',
          timestamp: new Date().toISOString()
        }
      },
      {
        role: 'assistant',
        content: `At step ${currentStep + 1}: ${problemData?.steps[currentStep]?.description || 'Initializing algorithm'}`,
        metadata: {
          type: 'step-explanation',
          timestamp: new Date().toISOString()
        }
      },
      {
        role: 'assistant',
        content: "What would you like me to explain? You can ask about:\n- Specific algorithm steps\n- Time/space complexity\n- Optimizations\n- Real-world applications\n- Or request visualization changes",
        metadata: {
          type: 'prompt',
          timestamp: new Date().toISOString()
        }
      }
    ];
  }, [problemData, currentStep]);

  const startNewConversation = () => {
    setConversationId(Date.now().toString());
  };

  const speakMessages = () => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Filter only assistant messages that haven't been spoken yet
    const messagesToSpeak = messages
      .filter(msg => msg.role === 'assistant' && !msg.metadata.spoken)
      .map(msg => ({
        ...msg,
        metadata: { ...msg.metadata, spoken: true }
      }));

    if (messagesToSpeak.length === 0) return;

    // Create utterances
    const utterances = messagesToSpeak.map(msg => {
      const utterance = new SpeechSynthesisUtterance(msg.content);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.voice = window.speechSynthesis.getVoices().find(v => v.name.includes('Google'));
      return utterance;
    });

    // Speak sequentially
    const speakNext = (index = 0) => {
      if (index < utterances.length) {
        utterances[index].onend = () => speakNext(index + 1);
        window.speechSynthesis.speak(utterances[index]);
        speechSynthesisRef.current = utterances[index];
      }
    };

    speakNext();
  };

  const toggleSpeech = () => {
    setIsSpeaking(prev => !prev);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in your browser');
      return;
    }

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const showThinkingAnimation = () => {
    setShowThinking(true);
    thinkingTimeoutRef.current = setTimeout(() => {
      setShowThinking(false);
    }, 2000);
  };

  const queryGemini = async (prompt) => {
    if (geminiStreamRef.current) {
      geminiStreamRef.current.abort();
    }

    showThinkingAnimation();
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;

      // Parse response for special commands
      if (responseText.includes('[[VISUALIZE]]')) {
        const visualizationParams = responseText.match(/\[\[VISUALIZE\]\](.*?)\[\[\/VISUALIZE\]\]/s)[1].trim();
        handleVisualizationCommand(visualizationParams);
      } else if (responseText.includes('[[STEP]]')) {
        const stepNumber = parseInt(responseText.match(/\[\[STEP\]\](\d+)\[\[\/STEP\]\]/)[1]);
        handleStepChangeCommand(stepNumber);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: responseText,
            metadata: {
              type: 'response',
              timestamp: new Date().toISOString(),
              sources: ['Gemini AI']
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error querying Gemini:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          metadata: {
            type: 'error',
            timestamp: new Date().toISOString()
          }
        }
      ]);
    } finally {
      setIsTyping(false);
      setShowThinking(false);
    }
  };

  const handleVisualizationCommand = (params) => {
    // Parse visualization parameters from AI response
    const sizeMatch = params.match(/size (\d+)/i);
    const valuesMatch = params.match(/values? ([0-9,\s]+)/i);
    
    let newValues = [];
    
    if (valuesMatch) {
      newValues = valuesMatch[1].split(',').map(v => parseInt(v.trim()));
    } else if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      newValues = Array.from({length: size}, () => Math.floor(Math.random() * 100));
    }
    
    if (newValues.length > 0) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Generating new visualization with values: ${newValues.join(', ')}`,
          metadata: {
            type: 'visualization-change',
            timestamp: new Date().toISOString(),
            action: 'generate'
          }
        }
      ]);
      
      modifyVisualization(newValues);
    }
  };

  const handleStepChangeCommand = (stepNumber) => {
    const validStep = Math.min(Math.max(0, stepNumber - 1), problemData.steps.length - 1);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `Moving to step ${validStep + 1}: ${problemData.steps[validStep]?.description || 'No description available'}`,
        metadata: {
          type: 'step-change',
          timestamp: new Date().toISOString(),
          action: 'navigate'
        }
      }
    ]);
    setCurrentStep(validStep);
  };

  const handleUserMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMessage = {
      role: 'user',
      content: userInput,
      metadata: {
        type: 'query',
        timestamp: new Date().toISOString()
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Process the message
    await processUserMessage(userInput);
  };

  const processUserMessage = async (message) => {
    // Check for direct commands first
    if (message.toLowerCase().includes('visualize with')) {
      const params = message.replace(/visualize with/gi, '').trim();
      modifyVisualization(params);
      return;
    }
    
    if (message.toLowerCase().includes('go to step')) {
      const stepMatch = message.match(/go to step (\d+)/i);
      if (stepMatch) {
        const stepNumber = parseInt(stepMatch[1]);
        handleStepChangeCommand(stepNumber);
      }
      return;
    }

    // Otherwise query Gemini
    const context = [
      `Current Algorithm: ${problemData.title}`,
      `Current Step: ${currentStep + 1} of ${problemData.steps.length}`,
      `Step Description: ${problemData.steps[currentStep]?.description || 'None'}`,
      `Time Complexity: ${JSON.stringify(problemData.timeComplexity)}`,
      `User Query: ${message}`
    ].join('\n');

    await queryGemini(context);
  };

  const handleQuickAction = (action) => {
    let message = '';
    switch (action) {
      case 'explain-step':
        message = `Explain the current step (${currentStep + 1}) in detail, focusing on how it contributes to the overall algorithm.`;
        break;
      case 'time-complexity':
        message = `Analyze the time complexity of ${problemData.title}, explaining both the best and worst cases with examples.`;
        break;
      case 'optimize':
        message = `Suggest optimizations for ${problemData.title} and explain how they would improve performance.`;
        break;
      case 'visualize':
        message = `Suggest a new visualization for ${problemData.title} with different parameters that would help understand it better.`;
        break;
      default:
        return;
    }
    
    setUserInput(message);
  };

  const formatMessageContent = (content) => {
    // Convert markdown-like syntax to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // code
      .replace(/\n/g, '<br/>'); // line breaks
  };

  return (
    <motion.div 
      className="fixed bottom-4 right-4 w-96 bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 25 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <SiGooglegemini className="text-yellow-300 text-lg" />
          <div>
            <h3 className="font-semibold">AI Algorithm Tutor</h3>
            <div className="text-xs opacity-80 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span>
              {problemData?.title || 'Algorithm Analysis'}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleSpeech}
            className={`p-2 rounded-full ${isSpeaking ? 'bg-blue-700' : 'bg-blue-800 hover:bg-blue-700'} transition-colors`}
            title={isSpeaking ? 'Stop speaking' : 'Start speaking'}
          >
            {isSpeaking ? <FaStop size={14} /> : <FaMicrophone size={14} />}
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-blue-800 hover:bg-blue-700 transition-colors"
            title="Close tutor"
          >
            <MdClose size={16} />
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Discussion
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'actions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Quick Actions
        </button>
        <button
          onClick={() => setActiveTab('context')}
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'context' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          Algorithm Info
        </button>
      </div>
      
      {/* Content Area */}
      <div className="h-96 flex flex-col">
        {activeTab === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.filter(m => m.role !== 'system').map((message, index) => (
                <motion.div
                  key={`${conversationId}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`max-w-xs md:max-w-md rounded-lg p-3 ${message.role === 'user' 
                      ? 'bg-blue-600 rounded-br-none' 
                      : 'bg-gray-700 rounded-bl-none'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center mb-1">
                        <FaRobot className="mr-2 text-purple-300" size={12} />
                        <span className="text-xs text-gray-300">AI Tutor</span>
                      </div>
                    )}
                    <div 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />
                    {message.metadata?.sources && (
                      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                        Sources: {message.metadata.sources.join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(message.metadata.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {showThinking && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-gray-700 rounded-lg rounded-bl-none p-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-xs text-gray-300">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-3 border-t border-gray-700 bg-gray-900">
              <form onSubmit={handleUserMessage} className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    type="text"
                    placeholder="Ask about the algorithm..."
                    className="w-full bg-gray-700 rounded-lg p-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isTyping}
                  />
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`absolute right-2 top-2 text-gray-400 hover:text-white ${isListening ? 'text-red-400 animate-pulse' : ''}`}
                    title="Voice input"
                  >
                    <FaMicrophone size={14} />
                  </button>
                </div>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg disabled:opacity-50 flex items-center justify-center"
                  disabled={isTyping || !userInput.trim()}
                >
                  <MdSend size={18} />
                </button>
              </form>
              <div className="text-xs text-gray-400 mt-1 px-1">
                Try: "Explain this step", "Show complexity analysis", or "Visualize with different values"
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'actions' && (
          <div className="p-4 overflow-y-auto">
            <h4 className="text-sm font-semibold text-blue-300 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickAction('explain-step')}
                className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center text-center"
              >
                <FaRegLightbulb className="text-yellow-400 mb-1" size={18} />
                <span className="text-xs">Explain Current Step</span>
              </button>
              <button
                onClick={() => handleQuickAction('time-complexity')}
                className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center text-center"
              >
                <FaChartLine className="text-green-400 mb-1" size={18} />
                <span className="text-xs">Time Complexity</span>
              </button>
              <button
                onClick={() => handleQuickAction('optimize')}
                className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center text-center"
              >
                <FaRegLightbulb className="text-blue-400 mb-1" size={18} />
                <span className="text-xs">Optimization Tips</span>
              </button>
              <button
                onClick={() => handleQuickAction('visualize')}
                className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center text-center"
              >
                <FaCode className="text-purple-400 mb-1" size={18} />
                <span className="text-xs">Modify Visualization</span>
              </button>
            </div>
            
            <h4 className="text-sm font-semibold text-blue-300 mt-6 mb-3">Step Navigation</h4>
            <div className="flex flex-wrap gap-2">
              {problemData?.steps?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleStepChangeCommand(index + 1)}
                  className={`px-3 py-1 rounded-full text-xs ${currentStep === index ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Step {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'context' && problemData && (
          <div className="p-4 overflow-y-auto">
            <h4 className="text-sm font-semibold text-blue-300 mb-3">Algorithm Information</h4>
            
            <div className="mb-4">
              <h5 className="text-xs text-gray-400 mb-1">Title</h5>
              <div className="text-sm">{problemData.title}</div>
            </div>
            
            <div className="mb-4">
              <h5 className="text-xs text-gray-400 mb-1">Description</h5>
              <div className="text-sm">{problemData.description}</div>
            </div>
            
            <div className="mb-4">
              <h5 className="text-xs text-gray-400 mb-1">Category</h5>
              <div className="text-sm">{problemData.category} • {problemData.difficulty}</div>
            </div>
            
            <div className="mb-4">
              <h5 className="text-xs text-gray-400 mb-1">Time Complexity</h5>
              <div className="text-sm">
                <div>Best: {problemData.timeComplexity.best}</div>
                <div>Average: {problemData.timeComplexity.average}</div>
                <div>Worst: {problemData.timeComplexity.worst}</div>
                <div>Space: {problemData.timeComplexity.space}</div>
              </div>
            </div>
            
            {problemData.keyPoints && (
              <div className="mb-4">
                <h5 className="text-xs text-gray-400 mb-1">Key Points</h5>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {problemData.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-4">
              Session started: {sessionStartTime.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});


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
  const [cameraPosition, setCameraPosition] = useState([0, 0, 10]);
  const [showCodeExecution, setShowCodeExecution] = useState(false);
  const [highlightedCodeLine, setHighlightedCodeLine] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('3d'); // '3d' or '2d'
  const [showMemoryModel, setShowMemoryModel] = useState(false);
  
  const autoPlayTimer = useRef(null);
  const controls = useAnimation();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastStepTimeRef = useRef(0);

  // API Configuration
  const API_KEY = import.meta.env.VITE_API_KEY;
  const MODEL_NAME = 'gemini-1.5-flash';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

  // Enhanced prompt with strict formatting requirements
  const createVisualizationPrompt = (problem) => {
    return `Create a detailed algorithm visualization in JSON format for: ${problem}.
    Include time complexity analysis, detailed explanations, and code execution steps.
    
    The response must be a valid JSON object with these exact properties:
    {
      "title": "Algorithm Name",
      "description": "Brief explanation",
      "difficulty": "Easy/Medium/Hard",
      "category": "Array|Tree|Graph|LinkedList|HashTable|Recursion|Sorting|Searching|DP",
      "timeComplexity": {
        "best": "O(...)",
        "average": "O(...)",
        "worst": "O(...)",
        "space": "O(...)"
      },
      "keyPoints": ["Important concept 1", "Important concept 2"],
      "pseudocode": "Step-by-step pseudocode",
      "code": {
        "language": "python|javascript|cpp|java",
        "content": "Actual code implementation",
        "lineMapping": {
          "1": "Step description for line 1",
          "2": "Step description for line 2"
        }
      },
      "steps": [
        {
          "description": "Explanation of this step",
          "codeLine": 1, // Line number being executed
          "visualElements": [
            {
              "type": "array|tree|graph|linkedList|hashTable|recursion|text|stack|queue|heap",
              // Additional properties based on type
            }
          ],
          "memoryModel": {
            "stack": [],
            "heap": [],
            "global": []
          }
        }
      ]
    }

    For array visualization:
    {
      "type": "array",
      "value": [1, 2, 3],
      "highlight": [0, 2],
      "pointers": {"left": 0, "right": 2, "mid": 1},
      "animation": "swap|partition|merge|traverse"
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
      "traversalPath": [1, 2],
      "animation": "insert|delete|rotate|traverse"
    }

    For graph visualization:
    {
      "type": "graph",
      "nodes": [
        {"id": 1, "value": "A", "x": 0, "y": 0},
        {"id": 2, "value": "B", "x": 1, "y": 1}
      ],
      "edges": [
        {"from": 1, "to": 2, "weight": 5}
      ],
      "highlight": [1],
      "visited": [1, 2],
      "path": [1, 2],
      "directed": false,
      "animation": "bfs|dfs|dijkstra|mst"
    }

    For linked list:
    {
      "type": "linkedList",
      "nodes": [
        {"id": 1, "value": 5, "next": 2, "prev": null},
        {"id": 2, "value": 10, "next": null, "prev": 1}
      ],
      "highlight": [1],
      "animation": "reverse|insert|delete|traverse"
    }

    For hash table:
    {
      "type": "hashTable",
      "buckets": [
        {"entries": [{"key": "a", "value": 1}]},
        {"entries": []}
      ],
      "highlight": [0],
      "animation": "insert|delete|search|resize"
    }

    For recursion:
    {
      "type": "recursion",
      "stackFrames": [
        {"name": "fib(5)", "variables": {"n": 5, "result": null}},
        {"name": "fib(3)", "variables": {"n": 3, "result": null}}
      ],
      "currentFrame": 1,
      "animation": "push|pop|evaluate"
    }

    For stack/queue:
    {
      "type": "stack|queue",
      "elements": [1, 2, 3],
      "highlight": [2],
      "animation": "push|pop|enqueue|dequeue"
    }

    For heap:
    {
      "type": "heap",
      "elements": [10, 20, 15],
      "highlight": [1],
      "animation": "insert|extract|heapify"
    }

    For text:
    {
      "type": "text",
      "value": "Explanation text",
      "animation": "typewriter|highlight"
    }

    For memory model:
    {
      "stack": [
        {"frame": "main", "variables": {"x": 5}},
        {"frame": "func", "variables": {"y": 10}}
      ],
      "heap": [
        {"address": "0x123", "value": {"data": [1,2,3]}}
      ],
      "global": [
        {"name": "MAX_SIZE", "value": 100}
      ]
    }

    IMPORTANT: The response must be valid JSON that can be parsed directly. 
    Include all necessary properties for the visualization to work properly.
    Add animation types where appropriate to enhance visualization.
    Include detailed memory models for each step when relevant.`;
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

  // Handle autoplay with smooth transitions and frame-based animation
  useEffect(() => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }

    if (autoPlay && problemData?.steps) {
      const animateStep = (timestamp) => {
        if (!lastStepTimeRef.current) lastStepTimeRef.current = timestamp;
        const elapsed = timestamp - lastStepTimeRef.current;
        const delay = 3000 / playbackSpeed;

        if (elapsed > delay) {
          setCurrentStep(prev => {
            const nextStep = prev < problemData.steps.length - 1 ? prev + 1 : 0;
            
            // Smooth camera transition for 3D visualizations
            if (visualizationMode === '3d' && problemData.steps[nextStep]?.visualElements?.some(el => 
              ['tree', 'graph', 'linkedList'].includes(el.type))) {
              const newPosition = [
                Math.sin(nextStep * 0.5) * 15,
                Math.cos(nextStep * 0.3) * 5 + 5,
                Math.cos(nextStep * 0.5) * 15
              ];
              setCameraPosition(newPosition);
            }
            
            return nextStep;
          });
          lastStepTimeRef.current = timestamp;
        }
        animationFrameRef.current = requestAnimationFrame(animateStep);
      };

      animationFrameRef.current = requestAnimationFrame(animateStep);
    }

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [autoPlay, problemData, playbackSpeed, visualizationMode]);

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

  // Handle code line highlighting based on current step
  useEffect(() => {
    if (problemData?.steps?.[currentStep]?.codeLine) {
      setHighlightedCodeLine(problemData.steps[currentStep].codeLine);
    }
  }, [currentStep, problemData]);

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
    setHighlightedCodeLine(null);

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
      setShowTutor(true);
      setShowCodeExecution(!!parsedData.code);
      await controls.start("visible");
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
      
      // Fallback to sample data if API fails
      const sampleData = getSampleData(problemInput.toLowerCase());
      if (sampleData) {
        setProblemData(sampleData);
        setShowTutor(true);
        setShowCodeExecution(!!sampleData.code);
        setError(`Using sample data. ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced sample data with animations and memory models
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
        code: {
          language: "javascript",
          content: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}`,
          lineMapping: {
            "2": "Initialize left and right pointers",
            "4": "Begin while loop (search continues)",
            "5": "Calculate mid point",
            "7": "Check if mid element is target",
            "9": "Target is in right half",
            "11": "Target is in left half",
            "15": "Return -1 if not found"
          }
        },
        steps: [
          {
            description: "Initialize pointers at both ends of the array",
            codeLine: 2,
            visualElements: [
              {
                type: "array",
                value: [1, 3, 5, 7, 9, 11, 13],
                pointers: { left: 0, right: 6 },
                animation: "traverse"
              },
              { 
                type: "text", 
                value: "Target: 7",
                animation: "typewriter"
              }
            ],
            memoryModel: {
              stack: [
                { frame: "binarySearch", variables: { left: 0, right: 6, target: 7 } }
              ],
              heap: [],
              global: []
            }
          },
          {
            description: "Calculate mid point (0 + 6)/2 = 3",
            codeLine: 5,
            visualElements: [
              {
                type: "array",
                value: [1, 3, 5, 7, 9, 11, 13],
                pointers: { left: 0, right: 6, mid: 3 },
                animation: "highlight"
              }
            ],
            memoryModel: {
              stack: [
                { frame: "binarySearch", variables: { left: 0, right: 6, mid: 3, target: 7 } }
              ],
              heap: [],
              global: []
            }
          },
          {
            description: "Compare arr[3] (7) with target (7) - match found!",
            codeLine: 7,
            visualElements: [
              {
                type: "array",
                value: [1, 3, 5, 7, 9, 11, 13],
                highlight: [3],
                pointers: { mid: 3 },
                animation: "highlight"
              },
              { 
                type: "text", 
                value: "Found 7 at index 3",
                animation: "typewriter"
              }
            ],
            memoryModel: {
              stack: [
                { frame: "binarySearch", variables: { left: 0, right: 6, mid: 3, target: 7, result: 3 } }
              ],
              heap: [],
              global: []
            }
          }
        ]
      },
      'quick sort': {
        title: 'Quick Sort',
        description: 'Divide and conquer algorithm that works by selecting a "pivot" element and partitioning the array around the pivot. Elements smaller than the pivot come before, elements larger come after. Then recursively sort the sub-arrays.',
        difficulty: 'Medium',
        category: 'Sorting',
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
        code: {
          language: "javascript",
          content: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivot = partition(arr, low, high);
    quickSort(arr, low, pivot - 1);
    quickSort(arr, pivot + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`,
          lineMapping: {
            "2": "Check if subarray has more than one element",
            "3": "Partition the array and get pivot index",
            "4": "Recursively sort left subarray",
            "5": "Recursively sort right subarray",
            "10": "Select last element as pivot",
            "11": "Initialize partition index",
            "13": "Loop through subarray",
            "14": "Check if current element is less than pivot",
            "15": "Increment partition index",
            "16": "Swap elements",
            "20": "Swap pivot into correct position",
            "21": "Return pivot index"
          }
        },
        steps: [
          {
            description: "Initial array and select last element as pivot",
            codeLine: 10,
            visualElements: [
              {
                type: "array",
                value: [10, 80, 30, 90, 40, 50, 70],
                highlight: [6],
                pointers: { pivot: 6, i: -1, j: 0 },
                animation: "highlight"
              },
              { 
                type: "text", 
                value: "Pivot selected: 70",
                animation: "typewriter"
              }
            ],
            memoryModel: {
              stack: [
                { 
                  frame: "quickSort", 
                  variables: { arr: "[10,80,30,90,40,50,70]", low: 0, high: 6 } 
                },
                { 
                  frame: "partition", 
                  variables: { arr: "[10,80,30,90,40,50,70]", low: 0, high: 6, pivot: 70, i: -1, j: 0 } 
                }
              ],
              heap: [],
              global: []
            }
          },
          {
            description: "Partitioning: Move elements smaller than pivot to left",
            codeLine: 16,
            visualElements: [
              {
                type: "array",
                value: [10, 30, 40, 50, 80, 90, 70],
                highlight: [0, 1, 2, 3],
                pointers: { pivot: 6, i: 3, j: 6 },
                animation: "swap"
              }
            ],
            memoryModel: {
              stack: [
                { 
                  frame: "quickSort", 
                  variables: { arr: "[10,30,40,50,80,90,70]", low: 0, high: 6 } 
                },
                { 
                  frame: "partition", 
                  variables: { arr: "[10,30,40,50,80,90,70]", low: 0, high: 6, pivot: 70, i: 3, j: 6 } 
                }
              ],
              heap: [],
              global: []
            }
          },
          {
            description: "Swap pivot with first element greater than pivot",
            codeLine: 20,
            visualElements: [
              {
                type: "array",
                value: [10, 30, 40, 50, 70, 90, 80],
                highlight: [4],
                pointers: { pivot: 4 },
                animation: "swap"
              },
              { 
                type: "text", 
                value: "Pivot 70 now in correct position",
                animation: "typewriter"
              }
            ],
            memoryModel: {
              stack: [
                { 
                  frame: "quickSort", 
                  variables: { arr: "[10,30,40,50,70,90,80]", low: 0, high: 6 } 
                },
                { 
                  frame: "partition", 
                  variables: { arr: "[10,30,40,50,70,90,80]", low: 0, high: 6, pivot: 70, i: 3, j: 6, returnValue: 4 } 
                }
              ],
              heap: [],
              global: []
            }
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
        code: {
          language: "javascript",
          content: `function dfs(node) {
  if (!node) return;
  
  // Pre-order visit
  console.log(node.value);
  
  // Recursively traverse left and right
  dfs(node.left);
  dfs(node.right);
}`,
          lineMapping: {
            "2": "Base case: if node is null, return",
            "5": "Visit current node (pre-order)",
            "8": "Recursively traverse left subtree",
            "9": "Recursively traverse right subtree"
          }
        },
        steps: [
          {
            description: "Start at root node (50)",
            codeLine: 5,
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
                traversalPath: [1],
                animation: "highlight"
              }
            ],
            memoryModel: {
              stack: [
                { frame: "dfs", variables: { node: "root(50)" } }
              ],
              heap: [],
              global: []
            }
          },
          {
            description: "Visit left child (30)",
            codeLine: 8,
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
                traversalPath: [1, 2],
                animation: "traverse"
              }
            ],
            memoryModel: {
              stack: [
                { frame: "dfs", variables: { node: "root(50)" } },
                { frame: "dfs", variables: { node: "node(30)" } }
              ],
              heap: [],
              global: []
            }
          },
          {
            description: "Visit leftmost node (20)",
            codeLine: 5,
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
                traversalPath: [1, 2, 4],
                animation: "highlight"
              }
            ],
            memoryModel: {
              stack: [
                { frame: "dfs", variables: { node: "root(50)" } },
                { frame: "dfs", variables: { node: "node(30)" } },
                { frame: "dfs", variables: { node: "node(20)" } }
              ],
              heap: [],
              global: []
            }
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
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-white">Interactive Visualization</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setVisualizationMode(prev => prev === '3d' ? '2d' : '3d')}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-xs"
                title={`Switch to ${visualizationMode === '3d' ? '2D' : '3D'} view`}
              >
                {visualizationMode === '3d' ? '3D' : '2D'} View
              </button>
            </div>
          </div>
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
                <li>Rotate the 3D view by dragging the visualization</li>
                <li>Zoom in/out with mouse wheel or pinch gesture</li>
                <li>Toggle between 2D and 3D visualization modes</li>
                <li>Click the robot icon to interact with the AI tutor</li>
                <li>View memory model to see stack and heap state</li>
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
              ref={canvasRef}
              camera={{ position: cameraPosition, fov: 50 }}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              frameloop={autoPlay ? "always" : "demand"}
            >
              <OrbitControls enableZoom={true} enablePan={true} enableRotate={visualizationMode === '3d'} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <DataStructureVisualizer 
                elements={step.visualElements} 
                category={problemData.category}
                mode={visualizationMode}
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

        {/* Code Execution Panel */}
        {showCodeExecution && problemData.code && (
          <motion.div
            className="mt-4 bg-gray-800 rounded-lg overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="p-3 bg-gray-700 flex justify-between items-center">
              <h4 className="font-medium">Code Execution</h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-gray-600 rounded">{problemData.code.language}</span>
                <button 
                  onClick={() => setShowMemoryModel(!showMemoryModel)}
                  className="text-xs px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
                >
                  {showMemoryModel ? 'Hide Memory' : 'Show Memory'}
                </button>
              </div>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 p-4 overflow-x-auto text-gray-300 text-sm">
                {problemData.code.content.split('\n').map((line, index) => {
                  const lineNumber = index + 1;
                  const isHighlighted = highlightedCodeLine === lineNumber;
                  const stepDescription = problemData.code.lineMapping[lineNumber];
                  
                  return (
                    <div 
                      key={index}
                      className={`flex ${isHighlighted ? 'bg-blue-900/30' : ''}`}
                    >
                      <div className="w-8 text-right pr-2 text-gray-500 select-none">{lineNumber}</div>
                      <div className="flex-1">
                        <code className={isHighlighted ? 'text-yellow-300' : ''}>{line}</code>
                        {isHighlighted && stepDescription && (
                          <motion.div
                            className="text-xs text-gray-400 mt-1 mb-2 pl-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {stepDescription}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </pre>
            </div>

            {/* Memory Model Visualization */}
            {showMemoryModel && step.memoryModel && (
              <motion.div
                className="p-4 bg-gray-700/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h5 className="text-sm font-medium mb-2 text-blue-300">Memory Model</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Stack Visualization */}
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="font-mono text-green-400 mb-2">Call Stack</div>
                    <div className="space-y-2">
                      {step.memoryModel.stack.map((frame, idx) => (
                        <div key={idx} className="border-l-2 border-green-500 pl-2">
                          <div className="font-mono text-gray-300">{frame.frame}</div>
                          {Object.entries(frame.variables).map(([varName, varValue]) => (
                            <div key={varName} className="ml-2 text-gray-400">
                              <span className="text-purple-300">{varName}</span>: {JSON.stringify(varValue)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heap Visualization */}
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="font-mono text-yellow-400 mb-2">Heap</div>
                    {step.memoryModel.heap.length > 0 ? (
                      <div className="space-y-2">
                        {step.memoryModel.heap.map((item, idx) => (
                          <div key={idx} className="border-l-2 border-yellow-500 pl-2">
                            <div className="font-mono text-gray-300">{item.address}</div>
                            <div className="ml-2 text-gray-400">
                              {JSON.stringify(item.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No heap allocations</div>
                    )}
                  </div>

                  {/* Global Variables */}
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="font-mono text-blue-400 mb-2">Global</div>
                    {step.memoryModel.global.length > 0 ? (
                      <div className="space-y-2">
                        {step.memoryModel.global.map((item, idx) => (
                          <div key={idx} className="border-l-2 border-blue-500 pl-2">
                            <div className="font-mono text-gray-300">{item.name}</div>
                            <div className="ml-2 text-gray-400">
                              {JSON.stringify(item.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No global variables</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

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
          
          <div className="flex items-center space-x-4">
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
                          setShowCodeExecution(!!item.data.code);
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
                  <button
                    onClick={() => setProblemInput('Dijkstra Algorithm')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Dijkstra
                  </button>
                  <button
                    onClick={() => setProblemInput('Dynamic Programming')}
                    className="p-2 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    DP
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
                  {problemData.code && (
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`px-6 py-4 font-medium ${
                        activeTab === 'code' ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Code
                    </button>
                  )}
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

                  {activeTab === 'code' && problemData.code && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-xl font-semibold mb-4">Code Implementation</h3>
                      <div className="mb-4 flex items-center">
                        <span className="text-sm px-2 py-1 bg-gray-700 rounded mr-2">
                          {problemData.code.language}
                        </span>
                        <button 
                          onClick={() => setShowCodeExecution(!showCodeExecution)}
                          className="text-sm px-2 py-1 bg-blue-600 rounded hover:bg-blue-700"
                        >
                          {showCodeExecution ? 'Hide Execution' : 'Show Execution'}
                        </button>
                      </div>
                      <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-gray-300 text-sm md:text-base">
                        {problemData.code.content}
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
                    <li>• View real-time code execution and memory models</li>
                    <li>• Switch between 2D and 3D visualization modes</li>
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