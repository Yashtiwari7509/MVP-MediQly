import { useState, useEffect } from 'react';
import { useSpeechRecognition } from 'react-speech-kit';
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import Groq from "groq-sdk";
import { cn } from "@/lib/utils";

interface VoiceNavigationProps {
  onCommand: (command: string) => void;
  language?: string;
}

export const VoiceNavigation = ({ onCommand, language = 'en' }: VoiceNavigationProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const validateApiKey = async () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      toast.error('Groq API key is not configured. Please set VITE_GROQ_API_KEY in your environment variables.');
      return false;
    }

    try {
      const groq = new Groq({ 
        apiKey,
        dangerouslyAllowBrowser: true 
      });

      // Make a simple test request
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Test message"
          }
        ],
        max_tokens: 5
      });

      return true;
    } catch (error) {
      console.error('API key validation error:', error);
      toast.error('Invalid Groq API key. Please check your VITE_GROQ_API_KEY environment variable.');
      return false;
    }
  };

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: async (result: string) => {
      setTranscript(result);
      setIsProcessing(true);
      
      try {
        // Validate API key before processing
        const isValid = await validateApiKey();
        if (!isValid) {
          throw new Error('Invalid API key');
        }

        // Initialize Groq client
        const groq = new Groq({ 
          apiKey: import.meta.env.VITE_GROQ_API_KEY,
          dangerouslyAllowBrowser: true 
        });

        // Process the voice command using Groq
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a voice command processor. Your task is to:
1. Understand the user's voice command
2. Convert it into a clear, actionable command
3. Return ONLY the processed command in a simple format
4. If the command is unclear, return "UNKNOWN_COMMAND"

Example inputs and outputs:
- "go to home page" -> "navigate:home"
- "open settings" -> "navigate:settings"
- "search for doctors" -> "search:doctors"
- "help me" -> "navigate:help"
- "what time is it" -> "UNKNOWN_COMMAND"

Current language: ${language}`
            },
            {
              role: "user",
              content: result
            }
          ],
          temperature: 0.3,
          max_tokens: 50,
          top_p: 0.9,
          stream: false
        });

        const processedCommand = response.choices[0]?.message?.content?.trim() || 'UNKNOWN_COMMAND';
        
        if (processedCommand !== 'UNKNOWN_COMMAND') {
          onCommand(processedCommand);
          toast.success('Command processed successfully');
        } else {
          toast.error('Could not understand the command. Please try again.');
        }
      } catch (error) {
        console.error('Error processing voice command:', error);
        if (error instanceof Error && error.message === 'Invalid API key') {
          toast.error('Invalid Groq API key. Please check your VITE_GROQ_API_KEY environment variable.');
        } else {
          toast.error('Failed to process voice command. Please try again.');
        }
      } finally {
        setIsProcessing(false);
        setTranscript('');
      }
    },
    onError: (error: Error) => {
      console.error('Speech recognition error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      
      let userMessage = '';
      if (errorMessage.includes('network')) {
        userMessage = 'Network error: Please check your internet connection and try again.';
      } else if (errorMessage.includes('not-allowed')) {
        userMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      } else {
        userMessage = 'Speech recognition failed. Please try again.';
      }

      toast.error(userMessage, {
        duration: 5000,
        action: {
          label: "Try Again",
          onClick: () => {
            stopListening();
            setTimeout(() => {
              startListening();
            }, 1000);
          }
        }
      });
      
      stopListening();
    }
  });

  const startListening = async () => {
    try {
      // Validate API key before starting
      const isValid = await validateApiKey();
      if (!isValid) {
        return;
      }

      listen({ 
        lang: language,
        interimResults: true,
        continuous: true
      });
      setIsListening(true);
      toast.success('Listening... Speak now');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error('Failed to start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    stop();
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (listening) {
        stop();
      }
    };
  }, [listening, stop]);

  return (
    <div className="relative">
      <Button
        variant={isListening ? "default" : "outline"}
        size="icon"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={cn(
          "transition-all duration-300",
          isListening && "bg-red-500 hover:bg-red-600",
          isListening ? "scale-110" : "hover:scale-105"
        )}
      >
        {isListening ? (
          <MicOff className="h-4 w-4 text-white animate-pulse" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isListening && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
          Listening...
        </div>
      )}
      
      {isProcessing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
          Processing...
        </div>
      )}
    </div>
  );
};

export default VoiceNavigation; 