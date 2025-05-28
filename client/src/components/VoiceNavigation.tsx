import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  X, 
  Loader2, 
  HelpCircle, 
  Activity,
  Navigation as NavIcon,
  Database,
  Settings,
  Command
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { Groq } from 'groq-sdk';
import { useAuth } from '@/auth/AuthProvider';
import '../styles/animations.css';

interface Command {
  keywords: string[];
  action: (params?: string) => void;
  description: string;
  category: 'navigation' | 'data' | 'action' | 'system';
  contextRequired?: boolean;
}

interface FitnessData {
  steps: number;
  calories: number;
  activeMinutes: number;
  distance: number;
  date: string;
}

interface AICommandResponse {
  command: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
}

interface CommandPattern {
  patterns: RegExp[];
  action: string;
  parameters?: Record<string, any>;
  contextRequired?: boolean;
  confidence: number;
  category: 'navigation' | 'data' | 'action' | 'system';
  description: string;
}

interface Intent {
  type: 'navigation' | 'query' | 'action' | 'system';
  confidence: number;
  entities: Record<string, string>;
}

interface PageContext {
  path: string;
  keywords: string[];
  synonyms: string[];
  contextualHints: string[];
  description: string;
}

interface SemanticContext {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  context: Record<string, any>;
}

// Define available routes and their metadata
const AVAILABLE_ROUTES = {
  '/': {
    path: '/',
    name: 'Dashboard',
    aliases: ['home', 'dashboard', 'main', 'start', 'homepage'],
    description: 'Main dashboard with overview of all features'
  },
  '/health-tracker': {
    path: '/health-tracker',
    name: 'Health Tracker',
    aliases: ['health', 'fitness', 'tracking', 'metrics', 'health tracker', 'fitness data'],
    description: 'Health and fitness tracking dashboard'
  },
  '/consultation': {
    path: '/consultation',
    name: 'Consult Doctor',
    aliases: ['consult', 'doctor', 'specialist', 'consultation', 'medical consultation', 'find doctor', 'book doctor'],
    description: 'Find and consult specialist doctors'
  },
  '/symptoms': {
    path: '/symptoms',
    name: 'Symptoms',
    aliases: ['symptoms', 'symptom checker', 'health symptoms', 'check symptoms'],
    description: 'Check and track symptoms'
  },
  '/medicine': {
    path: '/medicine',
    name: 'Medicine',
    aliases: ['medicine', 'medications', 'prescriptions', 'drugs', 'pharmacy'],
    description: 'Medicine and prescription management'
  },
  '/ai-doctor': {
    path: '/ai-doctor',
    name: 'AI Doctor',
    aliases: ['ai doctor', 'virtual doctor', 'ai consultation', 'ai health assistant'],
    description: 'AI-powered health consultation'
  },
  '/chat': {
    path: '/chat',
    name: 'Chat with Doctor',
    aliases: ['chat', 'doctor chat', 'message doctor', 'chat with doctor', 'doctor consultation'],
    description: 'Chat with a healthcare professional'
  },
  '/diet-plan': {
    path: '/diet-plan',
    name: 'Diet Plan',
    aliases: ['diet', 'meal plan', 'nutrition', 'food plan', 'diet plan', 'meal planning', 'nutrition plan'],
    description: 'Personalized diet and nutrition planning'
  }
} as const;

type AvailableRoute = keyof typeof AVAILABLE_ROUTES;

// Helper function to validate routes
const isValidRoute = (path: string): path is AvailableRoute => {
  return path in AVAILABLE_ROUTES;
};

const VoiceNavigation: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [fitnessData, setFitnessData] = useState<FitnessData | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser, userType } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Add new state for visualization
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(10).fill(0.2));
  const visualizerInterval = useRef<NodeJS.Timeout | null>(null);

  // Add new state for button press
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const buttonPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressDelay = 300; // ms to consider a press as a long press

  // Add semantic analysis state
  const [semanticContext, setSemanticContext] = useState<SemanticContext | null>(null);
  const conversationHistory = useRef<string[]>([]);

  // Enhanced page context mapping
  const pageContexts: PageContext[] = [
    {
      path: '/health-tracker',
      keywords: ['health', 'fitness', 'workout', 'exercise', 'activity', 'wellness'],
      synonyms: ['wellbeing', 'shape', 'condition', 'training', 'gym'],
      contextualHints: ['track', 'monitor', 'check', 'see', 'view', 'look at', 'show'],
      description: 'health and fitness tracking dashboard'
    },
    {
      path: '/consultation',
      keywords: ['consult', 'doctor', 'specialist', 'consultation', 'medical consultation', 'find doctor', 'book doctor'],
      synonyms: ['meeting', 'session', 'reservation', 'slot', 'timing'],
      contextualHints: ['book', 'schedule', 'check', 'view', 'see', 'manage'],
      description: 'appointment scheduling and management'
    },
    {
      path: '/',
      keywords: ['home', 'dashboard', 'main', 'start'],
      synonyms: ['front', 'landing', 'beginning', 'overview'],
      contextualHints: ['go back', 'return', 'start over', 'main'],
      description: 'main dashboard'
    }
  ];

  // Listen for tab changes
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchGoogleFitTab', handleTabChange as EventListener);

    return () => {
      window.removeEventListener('switchGoogleFitTab', handleTabChange as EventListener);
    };
  }, []);

  // Fetch latest fitness data
  const fetchLatestFitnessData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fitness-data/latest`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setFitnessData(data);
      return data;
    } catch (error) {
      console.error('Error fetching fitness data:', error);
      return null;
    }
  };

  // Enhanced natural language processing patterns
  const nlpPatterns = useCallback((): CommandPattern[] => [
    // Navigation patterns
    {
      patterns: [
        /(?:go|navigate|take me|show|open)?\s*(?:to|the)?\s*(?:main|home|front)?\s*dashboard/i,
        /(?:back|return)\s*(?:to)?\s*(?:the)?\s*(?:main|home|front)?\s*page/i
      ],
      action: 'navigate',
      parameters: { path: '/' },
      confidence: 0.9,
      category: 'navigation',
      description: 'navigate to the main dashboard'
    },
    {
      patterns: [
        /(?:go|navigate|take me|show|open)?\s*(?:to|the)?\s*(?:my)?\s*health(?:\s*tracker|\s*dashboard)?/i,
        /(?:show|check|view|open)\s*(?:my)?\s*(?:health|fitness)\s*(?:stats|data|information)?/i
      ],
      action: 'navigate',
      parameters: { path: '/health-tracker' },
      confidence: 0.9,
      category: 'navigation',
      description: 'navigate to the health tracker'
    },
    {
      patterns: [
        /(?:go|navigate|take me|show|open)?\s*(?:to|the)?\s*(?:my)?\s*consultation/i,
        /(?:show|view|check)\s*(?:my)?\s*(?:scheduled)?\s*(?:consultation|booking|schedule)/i
      ],
      action: 'navigate',
      parameters: { path: '/consultation' },
      confidence: 0.9,
      category: 'navigation',
      description: 'navigate to the consultation'
    },
    // Data query patterns
    {
      patterns: [
        /(?:how many|what(?:'s| is) my|tell me|show|check)\s*(?:my)?\s*(?:total)?\s*steps?(?:\s*count|\s*today|\s*so far)?/i,
        /(?:have I|did I)?\s*(?:walk|take|do)\s*(?:enough)?\s*steps?(?:\s*today)?/i
      ],
      action: 'queryData',
      parameters: { dataType: 'steps' },
      confidence: 0.85,
      category: 'data',
      description: 'query steps data'
    },
    {
      patterns: [
        /(?:how many|what(?:'s| is) my|tell me|show|check)\s*(?:my)?\s*(?:total)?\s*calories?(?:\s*burned|\s*today)?/i,
        /(?:have I|did I)?\s*burn(?:ed)?\s*(?:enough)?\s*calories?(?:\s*today)?/i
      ],
      action: 'queryData',
      parameters: { dataType: 'calories' },
      confidence: 0.85,
      category: 'data',
      description: 'query calories data'
    },
    {
      patterns: [
        /(?:how|what(?:'s| is) my|tell me|show|check)\s*(?:long|much time|active time|duration)\s*(?:was I|have I been|am I)\s*active(?:\s*today)?/i,
        /(?:show|tell me|check)\s*(?:my)?\s*(?:activity|active)\s*(?:time|duration|minutes)(?:\s*today)?/i
      ],
      action: 'queryData',
      parameters: { dataType: 'activeMinutes' },
      confidence: 0.85,
      category: 'data',
      description: 'query active minutes data'
    },
    // Tab switching patterns
    {
      patterns: [
        /(?:show|display|view|open)\s*(?:the|my)?\s*(?:fitness)?\s*(?:analytics|charts|graphs|statistics)/i,
        /(?:switch|change)\s*(?:to)?\s*(?:the)?\s*(?:charts?|analytics)\s*(?:view|tab)?/i
      ],
      action: 'switchTab',
      parameters: { tab: 'charts' },
      contextRequired: true,
      confidence: 0.8,
      category: 'action',
      description: 'switch to the charts tab'
    },
    {
      patterns: [
        /(?:show|display|view|open)\s*(?:the|my)?\s*(?:fitness)?\s*(?:overview|summary)/i,
        /(?:switch|change)\s*(?:to)?\s*(?:the)?\s*(?:overview|summary)\s*(?:view|tab)?/i
      ],
      action: 'switchTab',
      parameters: { tab: 'overview' },
      contextRequired: true,
      confidence: 0.8,
      category: 'action',
      description: 'switch to the overview tab'
    },
    // System commands
    {
      patterns: [
        /(?:show|tell me|what are|list)\s*(?:the|available)?\s*commands?/i,
        /(?:what|how)\s*(?:can I|should I)\s*(?:say|do|ask)/i,
        /help(?:\s*me)?/i
      ],
      action: 'system',
      parameters: { command: 'help' },
      confidence: 0.95,
      category: 'system',
      description: 'show available commands'
    },
    {
      patterns: [
        /(?:go|take me|navigate)\s*back/i,
        /(?:return|back)\s*(?:to)?\s*(?:the)?\s*(?:previous|last)\s*page/i
      ],
      action: 'system',
      parameters: { command: 'back' },
      confidence: 0.9,
      category: 'system',
      description: 'go back to the previous page'
    }
  ], []);

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const determineTargetPath = (location: string, context: any): string | null => {
    if (!location) return null;
    
    const normalizedLocation = location.toLowerCase().trim();
    
    // First check for exact matches
    for (const route of Object.values(AVAILABLE_ROUTES)) {
      if (route.aliases.some(alias => normalizedLocation === alias)) {
        return route.path;
      }
    }
    
    // Then check for partial matches
    for (const route of Object.values(AVAILABLE_ROUTES)) {
      if (route.aliases.some(alias => normalizedLocation.includes(alias))) {
        return route.path;
      }
    }

    // Handle special cases
    if (normalizedLocation.includes('back')) {
      return 'BACK';
    }
    
    return null;
  };

  const formatDataResponse = (metric: string, data: any, timeContext: string): string => {
    const formatValue = (value: number): string => {
      switch (metric) {
        case 'steps':
          return `${value.toLocaleString()} steps`;
        case 'calories':
          return `${value} calories`;
        case 'distance':
          return `${value} kilometers`;
        case 'activeMinutes':
          return `${value} active minutes`;
        default:
          return value.toString();
      }
    };

    if (!data) return "No data available for the requested metric.";

    const value = data[metric];
    if (value === undefined) return "That metric is not available.";

    return `For ${timeContext}, you have ${formatValue(value)}.`;
  };

  const getPageDescription = (path: string): string => {
    if (isValidRoute(path)) {
      return AVAILABLE_ROUTES[path].name;
    }
    return 'the requested page';
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    setFeedback('Processing your command...');

    try {
      const userContext = {
        userType,
        hasFitnessData: !!fitnessData,
        timeOfDay: new Date().getHours(),
        previousCommands: conversationHistory.current.slice(-3),
        activeTab,
        currentPath: location.pathname,
        availableRoutes: Object.keys(AVAILABLE_ROUTES)
      };

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a voice command processor for a healthcare application. 
            Available routes: ${JSON.stringify(AVAILABLE_ROUTES)}.
            Current path: ${location.pathname}.
            User context: ${JSON.stringify(userContext)}.
            
            IMPORTANT: You must respond with ONLY a valid JSON object, no other text or explanation.
            The JSON must follow this exact structure:
            {
              "intent": "navigation" | "query" | "action" | "system",
              "action": string,
              "targetPath": string | null,
              "parameters": object | null,
              "confidence": number,
              "response": string
            }
            
            Example valid response:
            {"intent":"navigation","action":"navigate","targetPath":"/health-tracker","parameters":null,"confidence":0.9,"response":"Navigating to Health Tracker"}`
          },
          {
            role: "user",
            content: command
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      });

      let result;
      try {
        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from AI model');
        }
        result = JSON.parse(content);
      } catch (error) {
        console.error('Error parsing AI response:', error);
        setFeedback("I'm having trouble understanding the command. Please try again.");
        toast({
          title: "Error Processing Command",
          description: "The AI response was not in the expected format. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      if (result.confidence > 0.3) {
        setFeedback(result.response);

        // Handle navigation with route validation and success toast
        if (result.intent === 'navigation' && result.targetPath) {
          if (!isValidRoute(result.targetPath)) {
            const availableRoutes = Object.values(AVAILABLE_ROUTES)
              .map(route => route.name.toLowerCase())
              .join(', ');
            
            setFeedback(`I'm sorry, that page is not available. Available pages are: ${availableRoutes}`);
            toast({
              title: "Navigation Error",
              description: "The requested page is not available in this application.",
              variant: "destructive",
            });
            return;
          }

          if (result.targetPath !== location.pathname) {
            navigate(result.targetPath);
            const pageName = getPageDescription(result.targetPath);
            setFeedback(`Navigating to ${pageName}`);
            toast({
              title: "Navigation Successful",
              description: `Navigated to ${pageName}`,
              variant: "default",
            });
          } else {
            setFeedback(`You are already on the ${getPageDescription(result.targetPath)} page`);
          }
        }

        // Handle data queries
        if (result.intent === 'query') {
          if (result.action === 'fetchFitnessData') {
            const data = await fetchLatestFitnessData();
            if (data) {
              setFeedback(formatDataResponse(result.parameters.metric || 'steps', data, result.parameters.timeRange || 'today'));
            }
          } else if (result.action === 'viewProgress') {
            if (result.targetPath && result.targetPath !== location.pathname) {
              navigate(result.targetPath);
            }
            if (result.parameters.view === 'progress') {
              window.dispatchEvent(new CustomEvent('switchGoogleFitTab', { 
                detail: 'charts'
              }));
            }
          }
        }

        // Handle view/tab switching
        if (result.intent === 'action') {
          switch (result.action) {
            case 'switchTab':
              window.dispatchEvent(new CustomEvent('switchGoogleFitTab', { 
                detail: result.parameters.tab 
              }));
              break;
            case 'refresh':
              window.location.reload();
              break;
            case 'toggleView':
              if (result.parameters.view) {
                window.dispatchEvent(new CustomEvent('switchGoogleFitTab', { 
                  detail: result.parameters.view 
                }));
              }
              break;
          }
        }

        // Handle system commands
        if (result.intent === 'system') {
          switch (result.action) {
            case 'help':
              setShowHelp(true);
              break;
            case 'back':
              navigate(-1);
              break;
            case 'home':
              navigate('/');
              break;
          }
        }

        // Update conversation history
        conversationHistory.current = [...conversationHistory.current.slice(-5), command];
      } else {
        setFeedback("I'm not quite sure what you want to do. Could you be more specific?");
        toast({
          title: "Need More Information",
          description: "Please try being more specific about what you'd like to do",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error processing command:', error);
      
      let errorMessage = 'An error occurred while processing your request.';
      if (error.message) {
        errorMessage = error.message;
      }

      setFeedback(`Sorry, I couldn't process that command. ${errorMessage}`);
      
      toast({
        title: "Error Processing Command",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecognitionError = (error: string) => {
    console.log('Recognition error:', error);
    
    // Don't show error for intentional stops
    if (error === 'aborted' || error === 'no-speech') {
      setIsListening(false);
      setFeedback('');
      return;
    }

    setIsListening(false);
    let errorMessage = 'An error occurred. Please try again.';
    
    switch (error) {
      case 'network':
        errorMessage = 'Network error. Please check your connection.';
        break;
      case 'audio-capture':
        errorMessage = 'No microphone detected.';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone access denied.';
        break;
      case 'service-not-allowed':
        errorMessage = 'Speech recognition service is not available.';
        break;
      case 'bad-grammar':
      case 'language-not-supported':
        errorMessage = 'Language not supported.';
        break;
    }

    setFeedback(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Modify button handlers for click instead of hold
  const handleButtonClick = () => {
    if (!isListening && recognitionRef.current) {
      setIsOpen(true);
      try {
        // Reset any previous state
        setTranscript('');
        setFeedback('');
        setIsProcessing(false);
        
        // Start recognition with error handling
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        handleRecognitionError('service-not-allowed');
      }
    } else if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      } finally {
        setIsOpen(false);
        setTranscript('');
        setFeedback('');
        setIsListening(false);
        if (visualizerInterval.current) {
          clearInterval(visualizerInterval.current);
          setVisualizerData(Array(10).fill(0.2));
        }
      }
    }
  };

  // Initialize speech recognition with visualization
  const initializeSpeechRecognition = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        throw new Error('Speech recognition is not supported');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback('Listening... Hold the mic button and speak');
        // Start voice visualizer
        if (visualizerInterval.current) clearInterval(visualizerInterval.current);
        visualizerInterval.current = setInterval(() => {
          setVisualizerData(prev => 
            prev.map(() => Math.random() * 0.8 + 0.2)
          );
        }, 100);
      };

      recognition.onend = () => {
        // Only reset if we're not intentionally stopping
        if (isListening) {
          setIsListening(false);
          // Stop voice visualizer
          if (visualizerInterval.current) {
            clearInterval(visualizerInterval.current);
            setVisualizerData(Array(10).fill(0.2));
          }
        }
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase();
        setTranscript(command);
        if (event.results[last].isFinal) {
          setLastCommand(command);
          processCommand(command);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        handleRecognitionError(event.error);
      };

      recognitionRef.current = recognition;
      setIsSupported(true);
    } catch (error) {
      console.error('Speech recognition initialization error:', error);
      setIsSupported(false);
      toast({
        title: "Not Supported",
        description: "Voice navigation is not supported in your browser.",
        variant: "destructive",
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (buttonPressTimer.current) {
        clearTimeout(buttonPressTimer.current);
      }
      if (visualizerInterval.current) {
        clearInterval(visualizerInterval.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [initializeSpeechRecognition]);

  if (isSupported === false) return null;

  const groupedCommands = nlpPatterns().reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandPattern[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return <NavIcon className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'action':
        return <Command className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <Card className="mb-4 p-4 w-[400px] bg-[#1A2333]/95 backdrop-blur-lg border-none shadow-lg relative animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-b from-[#00FFF3]/5 to-transparent rounded-lg pointer-events-none"></div>
          
          <div className="space-y-4">
            {/* Voice Visualizer */}
            {isListening && (
              <div className="flex items-center justify-center gap-1 h-8">
                {visualizerData.map((height, index) => (
                  <div
                    key={index}
                    className="w-1 bg-[#00FFF3] rounded-full animate-wave"
                    style={{
                      height: `${height * 32}px`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}

            {showHelp ? (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-[#00FFF3] font-medium flex items-center gap-2">
                  <Command className="h-5 w-5" />
                  Available Commands
                </h3>
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="space-y-2 bg-[#0B1120]/50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-[#00FFF3] capitalize flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {category}
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      {cmds.map((cmd, index) => (
                        <li key={index} className="flex items-center gap-2 hover:text-[#00FFF3] transition-colors">
                          • {cmd.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="text-[#00FFF3] text-sm mt-2 w-full hover:bg-[#00FFF3]/10"
                  onClick={() => setShowHelp(false)}
                >
                  Close Help
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-[#00FFF3] text-sm font-medium">
                    {transcript && (
                      <div className="animate-fade-in flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        You said: "{transcript}"
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-[#00FFF3]"
                    onClick={() => setShowHelp(true)}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-gray-400 text-sm min-h-[20px] flex items-center gap-2">
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {feedback}
                </div>

                {lastCommand && (
                  <div className="text-xs text-gray-500 flex items-center gap-2 animate-fade-in">
                    <Command className="h-3 w-3" />
                    Last command: "{lastCommand}"
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      <div className="relative">
        {/* Pulse rings */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-[#00FFF3]/20 animate-pulse-ring"></div>
            <div className="absolute inset-0 rounded-full bg-[#00FFF3]/10 animate-pulse-ring" style={{ animationDelay: '0.4s' }}></div>
          </>
        )}
        
        <Button
          onClick={handleButtonClick}
          className={`
            relative rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300
            ${isListening
              ? 'bg-[#00FFF3] text-[#0B1120] animate-pulse-shadow'
              : 'bg-[#1A2333] text-[#00FFF3] hover:bg-[#1A2333]/80'
            }
          `}
        >
          {isListening ? (
            <Mic className="h-6 w-6 animate-pulse" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default VoiceNavigation; 