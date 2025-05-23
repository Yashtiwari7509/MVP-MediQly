import type React from "react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  User,
  Brain,
  Activity,
  Upload,
  FileText,
  ImageIcon,
  X,
  Mic,
  List,
  Globe2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@lottiefiles/react-lottie-player";
import { HealthMetrics } from "@/components/health/HealthMatrics";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import MainLayout from "@/components/layout/MainLayout";
import { useSpeechRecognition } from "react-speech-kit";
import { useTranslations } from "@/hooks/use-translation";

interface Message {
  role: "user" | "assistant";
  content: string;
  isAudio?: boolean;
  language?: string;
}

interface HealthData {
  type: string;
  data: {
    labels: string[];
    values: number[];
    label: string;
    color: string;
  };
}

const AiDoctor = () => {
  const {
    t,
    currentLanguage,
    setCurrentLanguage,
    languages,
    getLocalizedSymptoms,
  } = useTranslations();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [reportText, setReportText] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceText, setVoiceText] = useState("");
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result: string) => {
      setInput(result);
      setVoiceText(result);
    },
    onError: (error: Error) => {
      console.error("Speech recognition error:", error);
      toast.error(
        currentLanguage.code === "en"
          ? "Failed to recognize speech. Please try again."
          : "Error al reconocer el habla. Por favor, inténtelo de nuevo."
      );
      stopRecording();
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Extract health metrics from content
  const extractHealthMetrics = (content: string) => {
    const bloodPressureMatch = content.match(/blood pressure.*?(\d+)/i);
    const heartRateMatch = content.match(/heart rate.*?(\d+)/i);

    if (bloodPressureMatch || heartRateMatch) {
      const labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString();
      }).reverse();

      const values = Array.from({ length: 7 }, () => {
        const baseValue = bloodPressureMatch ? 120 : 75;
        return baseValue + Math.random() * 10 - 5;
      });

      return {
        type: bloodPressureMatch ? "Blood Pressure" : "Heart Rate",
        data: {
          labels,
          values,
          label: bloodPressureMatch
            ? "Blood Pressure (mmHg)"
            : "Heart Rate (BPM)",
          color: bloodPressureMatch ? "#3b82f6" : "#ef4444",
        },
      };
    }
    return null;
  };

  // Update recording duration
  useEffect(() => {
    if (listening) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [listening]);

  const startRecording = () => {
    try {
      listen({
        lang: currentLanguage.code,
        interimResults: true,
        continuous: true,
      });
      setIsRecording(true);

      toast.success(
        currentLanguage.code === "en"
          ? "Listening... Speak now"
          : currentLanguage.code === "es"
          ? "Escuchando... Hable ahora"
          : currentLanguage.code === "hi"
          ? "सुन रहा हूं... अब बोलें"
          : currentLanguage.code === "ar"
          ? "جاري الاستماع... تحدث الآن"
          : currentLanguage.code === "zh"
          ? "正在听... 请说话"
          : "Listening... Speak now"
      );
    } catch (error) {
      console.error("Speech recognition error:", error);
      toast.error(
        currentLanguage.code === "en"
          ? "Failed to start voice recognition. Please try again."
          : "Error al iniciar el reconocimiento de voz. Por favor, inténtelo de nuevo."
      );
      stopRecording();
    }
  };

  const stopRecording = () => {
    console.log("started");

    stop();
    setIsRecording(false);
    if (input.trim()) {
      handleSubmit(new Event("submit") as unknown as React.FormEvent);
    }
  };

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isRecording) {
      stop();
      setIsRecording(false);
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      language: currentLanguage.code,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);

    try {
      const systemMessage = {
        role: "system",
        content: `You are a friendly and caring AI health assistant. IMPORTANT: You MUST respond in ${currentLanguage.name} language ONLY. 

When responding:
- Use ${currentLanguage.name} language for ALL responses
- Use simple, easy-to-understand words in ${currentLanguage.name}
- If you must use medical terms, explain them in simple ${currentLanguage.name} words in parentheses
- Break down your response into short, clear sections using emojis
- Give practical advice that anyone can follow
- Use friendly, reassuring language in ${currentLanguage.name}
- Always remind that you're an AI and they should consult real doctors
- Keep your responses short and clear
- If you detect any serious conditions, clearly state in ${currentLanguage.name} that they need to see a doctor immediately

Remember: NEVER respond in English unless ${currentLanguage.code} is 'en'. Always use ${currentLanguage.name} language.`,
      };

      const contextMessages = messages.slice(-5).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Start the API call
      const responsePromise = fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${"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"}`,
          },
          body: JSON.stringify({
            model: "mistral-saba-24b",
            messages: [
              systemMessage,
              ...contextMessages,
              {
                role: "user",
                content: input,
              },
            ],
            temperature: 0.7,
            max_tokens: 1024,
            stop: null,
            n: 1,
          }),
        }
      );

      // Create a delay promise for minimum animation time (3 seconds)
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 3000));

      // Wait for both the API response and the minimum delay
      const [response] = await Promise.all([responsePromise, delayPromise]);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message ||
            `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from API");
      }

      // Add an additional small delay before showing the response
      await new Promise((resolve) => setTimeout(resolve, 500));

      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
        language: currentLanguage.code,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Extract and set health metrics if present
      const metrics = extractHealthMetrics(assistantMessage.content);
      if (metrics) {
        setHealthData(metrics);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get a response";
      toast.error(errorMessage);

      // Translate error message based on current language
      const errorMessages = {
        en: `I apologize, but I'm having trouble responding right now. Please try again in a moment or rephrase your question.\n\nIf you're experiencing urgent health concerns, please contact your healthcare provider directly.`,
        es: `Lo siento, pero estoy teniendo problemas para responder en este momento. Por favor, inténtelo de nuevo en un momento o reformule su pregunta.\n\nSi tiene problemas de salud urgentes, póngase en contacto con su médico directamente.`,
        hi: `मैं क्षमा चाहता हूं, लेकिन मुझे अभी जवाब देने में परेशानी हो रही है। कृपया कुछ देर बाद फिर से प्रयास करें या अपना प्रश्न दोबारा पूछें।\n\nयदि आपको तत्काल स्वास्थ्य संबंधी चिंता है, तो कृपया सीधे अपने स्वास्थ्य सेवा प्रदाता से संपर्क करें।`,
        ar: `عذراً، لكنني أواجه مشكلة في الرد حالياً. يرجى المحاولة مرة اخرى بعد قليل أو إعادة صياغة سؤالك.\n\nإذا كنت تعاني من مشاكل صحية عاجلة، يرجى الاتصال بمقدم الرعاية الصحية مباشرة.`,
        zh: `抱歉，我现在回答有困难。请稍后重试或重新表述您的问题。\n\n如果您有紧急健康问题，请直接联系您的医疗服务提供者。`,
      };

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            errorMessages[currentLanguage.code as keyof typeof errorMessages] ||
            errorMessages.en,
          language: currentLanguage.code,
        },
      ]);
    } finally {
      // Add a final delay before removing loading state
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsLoading(false);
    }
  };

  const handleSymptomSelect = (symptomId: string) => {
    setSelectedSymptoms((prev) => {
      const newSymptoms = prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId];

      // Automatically create a description from selected symptoms
      const symptoms = getLocalizedSymptoms();
      const description = symptoms
        .filter((symptom) => newSymptoms.includes(symptom.id))
        .map((symptom) => symptom.description)
        .join(". ");

      setReportText(description);
      return newSymptoms;
    });
  };

  const analyzeReport = async () => {
    if (!reportText.trim() && selectedSymptoms.length === 0) {
      toast.error(t("pleaseDescribeSymptoms"));
      return;
    }

    const symptoms = getLocalizedSymptoms();
    const symptomsText =
      selectedSymptoms.length > 0
        ? symptoms
            .filter((symptom) => selectedSymptoms.includes(symptom.id))
            .map((symptom) => symptom.label)
            .join(", ")
        : "";

    const userMessage: Message = {
      role: "user",
      content: `Please analyze these symptoms and provide a simple explanation:\n\n${symptomsText}\n${reportText}`,
      language: currentLanguage.code,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);
    setShowReportDialog(false);

    try {
      const systemMessage = {
        role: "system",
        content: `You are a friendly and caring AI health assistant. IMPORTANT: You MUST respond in ${
          currentLanguage.name
        } language ONLY.

When analyzing symptoms:
- Use ${currentLanguage.name} language for ALL responses
- Use simple, easy-to-understand words in ${currentLanguage.name}
- If you must use medical terms, explain them in simple ${
          currentLanguage.name
        } words in parentheses
- Break down your response into these sections using emojis:
  * 🔍 ${t("whatIUnderstand")}
  * ❗ ${t("importantFindings")}
  * 🏥 ${t("whatThisMightBe")}
  * 👉 ${t("whatToDoNext")}
  * ⚠️ ${t("whenToSeeDoctor")}
- Rate the urgency in ${currentLanguage.name} using simple terms like:
  * "${t("needsImmediateAttention")}"
  * "${t("shouldSeeDoctor")}"
  * "${t("canTreatAtHome")}"
- Give practical advice that anyone can follow
- Use friendly, reassuring language in ${currentLanguage.name}
- Always remind that you're an AI and they should consult real doctors
- Keep your responses short and clear
- If you detect any serious conditions, clearly state in ${
          currentLanguage.name
        } that they need to see a doctor immediately

Remember: NEVER respond in English unless ${
          currentLanguage.code
        } is 'en'. Always use ${currentLanguage.name} language.`,
      };

      const contextMessages = messages.slice(-5).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${"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"}`,
          },
          body: JSON.stringify({
            model: "mistral-saba-24b",
            messages: [
              systemMessage,
              ...contextMessages,
              {
                role: "user",
                content: `Please analyze these symptoms and provide a simple explanation in ${currentLanguage.name}:\n\n${symptomsText}\n${reportText}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1024,
            stop: null,
            n: 1,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message ||
            `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from API");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
        language: currentLanguage.code,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Extract and set health metrics if present
      const metrics = extractHealthMetrics(assistantMessage.content);
      if (metrics) {
        setHealthData(metrics);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to analyze symptoms";
      toast.error(errorMessage);

      // Translate error message based on current language
      const errorMessages = {
        en: `I apologize, but I'm having trouble analyzing your symptoms right now. Please try again in a moment.\n\nIf you're experiencing severe symptoms or urgent health concerns, please contact your healthcare provider immediately.`,
        es: `Lo siento, pero estoy teniendo problemas para analizar sus síntomas en este momento. Por favor, inténtelo de nuevo en un momento.\n\nSi experimenta síntomas graves o tiene problemas de salud urgentes, póngase en contacto con su médico inmediatamente.`,
        hi: `मैं क्षमा चाहता हूं, लेकिन मुझे अभी आपके लक्षणों का विश्लेषण करने में परेशानी हो रही है। कृपया कुछ देर बाद फिर से प्रयास करें।\n\nयदि आप गंभीर लक्षण या तत्काल स्वास्थ्य संबंधी चिंता महसूस कर रहे हैं, तो कृपया तुरंत अपने स्वास्थ्य सेवा प्रदाता से संपर्क करें।`,
        ar: `عذراً، لكنني أواجه مشكلة في تحليل أعراضك حالياً. يرجى المحاولة مرة أخرى بعد قليل.\n\nإذا كنت تعاني من أعراض شديدة أو مشاكل صحية عاجلة، يرجى الاتصال بمقدم الرعاية الصحية فوراً.`,
        zh: `抱歉，我现在无法分析您的症状。请稍后重试。\n\n如果您出现严重症状或紧急健康问题，请立即联系您的医疗服务提供者。`,
      };

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            errorMessages[currentLanguage.code as keyof typeof errorMessages] ||
            errorMessages.en,
          language: currentLanguage.code,
        },
      ]);
    } finally {
      setIsLoading(false);
      setReportText("");
      setSelectedSymptoms([]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true);
    setUploadedFile(file);

    try {
      if (file.type === "application/pdf") {
        // For PDF files, we'll use pdf.js to extract text
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            // Note: In a production environment, you would want to process this on the server
            // For now, we'll just read it as text
            const text = await extractTextFromPDF(
              e.target?.result as ArrayBuffer
            );
            setReportText(text);
          } catch (error) {
            console.error("Error processing PDF:", error);
            toast.error(
              "Failed to process PDF file. Please try copying the text manually."
            );
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type.startsWith("image/")) {
        // For images, we'll use Tesseract.js for OCR
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            // Note: In a production environment, you would want to do OCR on the server
            // For now, we'll just show a message
            toast.info(
              "Image processing would be handled on the server in production"
            );
            setReportText(
              "Image uploaded: " +
                file.name +
                "\n\nPlease paste the report text manually for now."
            );
          } catch (error) {
            console.error("Error processing image:", error);
            toast.error(
              "Failed to process image. Please try copying the text manually."
            );
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(
        "Failed to process file. Please try copying the text manually."
      );
    } finally {
      setIsProcessingFile(false);
    }
  };

  const extractTextFromPDF = async (
    arrayBuffer: ArrayBuffer
  ): Promise<string> => {
    // This is a placeholder. In a real implementation, you would:
    // 1. Either use pdf.js in the browser
    // 2. Or better, send the file to your server for processing
    return new Promise((resolve) => {
      resolve(
        "PDF uploaded: " +
          uploadedFile?.name +
          "\n\nPlease paste the report text manually for now."
      );
    });
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndUploadFile(file);
    }
  };

  const validateAndUploadFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPEG, PNG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("File size should be less than 10MB");
      return;
    }
    handleFileUpload(file);
  };

  // Language selector component
  const LanguageSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-auto px-3 flex gap-2"
        >
          <Globe2 className="h-4 w-4" />
          <span>{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang)}
            className="flex items-center gap-2"
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const handleLanguageChange = async (newLanguage: typeof currentLanguage) => {
    setCurrentLanguage(newLanguage);
    // Update speech recognition language
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-hidden bg-background/50">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            {t("welcomeTitle")}
          </h1>
          <LanguageSelector />
        </div>

        <Card
          className={cn(
            "h-[calc(100vh-12rem)] flex flex-col backdrop-blur-sm bg-background/50 border-primary/20",
            currentLanguage.rtl && "rtl"
          )}
        >
          <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-4 py-8"
                >
                  <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto">
                    <Player
                      autoplay
                      loop
                      speed={0.5}
                      src="https://assets5.lottiefiles.com/packages/lf20_xyadoh9h.json"
                      style={{ width: "100%", height: "100%" }}
                    />
                    <motion.div
                      className="absolute -inset-4 bg-primary/10 rounded-full z-[-1]"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-primary">
                    {t("welcomeTitle")}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t("welcomeDescription")}
                  </p>
                  <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm"
                      onClick={() => setShowReportDialog(true)}
                    >
                      <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {t("uploadReport")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm"
                      onClick={() => setInput(t("whatCanYouDo"))}
                    >
                      <Brain className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {t("capabilities")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm"
                      onClick={() => setInput(t("howAccurate"))}
                    >
                      <Activity className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      {t("accuracy")}
                    </Button>
                  </div>
                </motion.div>
              )}

              {messages.map((message, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex gap-3 mb-6 ${
                    message.role === "assistant"
                      ? "flex-row"
                      : "flex-row-reverse"
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    {message.role === "assistant" ? (
                      <Bot className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </motion.div>
                  <motion.div
                    initial={{
                      x: message.role === "assistant" ? -20 : 20,
                      opacity: 0,
                    }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className={`rounded-lg px-4 py-3 max-w-[85%] md:max-w-[75%] backdrop-blur-sm ${
                      message.role === "assistant"
                        ? "bg-card/50 border border-primary/20 shadow-lg hover:shadow-xl transition-shadow"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm md:text-base">
                        {message.content}
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 pl-6 pr-4"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 relative">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      style={{ transformOrigin: "center" }}
                    />
                    <motion.div
                      className="absolute inset-0 border-2 border-primary rounded-full"
                      animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        rotate: {
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        },
                        scale: {
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        },
                      }}
                      style={{ transformOrigin: "center" }}
                    />
                    <motion.div
                      className="absolute inset-2 bg-primary/10 rounded-full flex items-center justify-center"
                      animate={{
                        scale: [0.8, 1, 0.8],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      style={{ transformOrigin: "center" }}
                    >
                      <Brain className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </motion.div>
                  </div>
                  <div className="flex-1 rounded-lg px-4 py-3 bg-card/50 border border-primary/20 shadow-lg relative overflow-hidden backdrop-blur-sm">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm font-medium">
                          {t("analyzing")}
                        </span>
                        <motion.div
                          className="w-5 h-5 md:w-6 md:h-6 relative"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                        >
                          <motion.div
                            className="absolute inset-0 border-2 border-primary/50 rounded-full border-t-transparent"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                          />
                        </motion.div>
                      </div>
                      <div className="relative h-1.5 bg-primary/20 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-primary to-violet-500"
                          animate={{
                            width: ["0%", "100%"],
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {healthData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <HealthMetrics data={healthData.data} />
              </motion.div>
            )}
          </ScrollArea>

          {/* Chat Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-primary/20 mt-4 pt-2 md:pt-4 bg-background/80 backdrop-blur-sm"
          >
            <form
              onSubmit={handleSubmit}
              className="p-2 md:p-4 flex gap-2 md:gap-3"
            >
              <div className="flex-1 flex gap-2 md:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowReportDialog(true)}
                  className="flex-shrink-0 hover:scale-105 transition-transform"
                >
                  <List className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <div className="relative">
                  <Button
                    type="button"
                    variant={listening ? "default" : "outline"}
                    size="icon"
                    onClick={listening ? stopRecording : startRecording}
                    className={cn(
                      "flex-shrink-0 transition-all duration-300",
                      listening && "bg-red-500 hover:bg-red-600",
                      listening ? "scale-110" : "hover:scale-105"
                    )}
                  >
                    <Mic
                      className={cn(
                        "h-3 w-3 md:h-4 md:w-4",
                        listening && "text-white animate-pulse"
                      )}
                    />
                  </Button>
                  {listening && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded-full whitespace-nowrap"
                    >
                      {formatDuration(recordingDuration)}
                    </motion.div>
                  )}
                </div>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    listening
                      ? currentLanguage.code === "en"
                        ? "Listening... Speak now"
                        : currentLanguage.code === "es"
                        ? "Escuchando... Hable ahora"
                        : currentLanguage.code === "hi"
                        ? "सुन रहा हूं... अब बोलें"
                        : currentLanguage.code === "ar"
                        ? "جاري الاستماع... تحدث الآن"
                        : currentLanguage.code === "zh"
                        ? "正在听... 请说话"
                        : "Listening... Speak now"
                      : t("askAnything")
                  }
                  disabled={isLoading}
                  className={cn(
                    "flex-1 bg-card/50 backdrop-blur-sm border-primary/20 focus:ring-2 ring-primary/20 transition-all text-xs md:text-sm",
                    currentLanguage.rtl && "text-right",
                    listening && "border-red-500/50 ring-red-500/20"
                  )}
                  dir={currentLanguage.rtl ? "rtl" : "ltr"}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || (listening && !voiceText.trim())}
                className="hover:scale-105 transition-transform text-xs md:text-sm"
                size="sm"
              >
                <Send className="size-4  mr-1 md:mr-[1px]" />
                <span className="hidden sm:inline">{t("checkHealth")}</span>
              </Button>
            </form>
          </motion.div>
        </Card>

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{t("tellHealth")}</DialogTitle>
              <DialogDescription>{t("describeFeeling")}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="symptoms" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="symptoms" className="text-xs md:text-sm">
                  {t("selectSymptoms")}
                </TabsTrigger>
                <TabsTrigger value="text" className="text-xs md:text-sm">
                  {t("writeDescription")}
                </TabsTrigger>
                <TabsTrigger value="file" className="text-xs md:text-sm">
                  {t("uploadReport")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="symptoms">
                <div className="grid grid-cols-2 gap-2 md:gap-3 p-2 md:p-4">
                  {getLocalizedSymptoms().map((symptom) => (
                    <Button
                      key={symptom.id}
                      variant={
                        selectedSymptoms.includes(symptom.id)
                          ? "default"
                          : "outline"
                      }
                      className="h-auto py-2 md:py-4 flex flex-col items-center gap-1 md:gap-2 text-xs md:text-sm"
                      onClick={() => handleSymptomSelect(symptom.id)}
                    >
                      <span className="text-xl md:text-2xl">
                        {symptom.icon}
                      </span>
                      <span className="text-xs md:text-sm text-center">
                        {symptom.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="text">
                <div className="space-y-4 p-2 md:p-4">
                  <Textarea
                    placeholder={t("describeFeeling")}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className={cn(
                      "min-h-[100px] md:min-h-[150px] text-xs md:text-sm",
                      currentLanguage.rtl && "text-right"
                    )}
                    dir={currentLanguage.rtl ? "rtl" : "ltr"}
                  />
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-xs md:text-sm"
                      onClick={startRecording}
                      disabled={listening}
                      size="sm"
                    >
                      <Mic
                        className={cn(
                          "h-3 w-3 md:h-4 md:w-4",
                          listening && "text-red-500 animate-pulse"
                        )}
                      />
                      {listening ? t("listening") : t("speak")}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="file">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer transition-colors m-2 md:m-4",
                    "hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) validateAndUploadFile(file);
                    }}
                  />

                  {isProcessingFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Player
                        autoplay
                        loop
                        speed={0.5}
                        src="https://assets10.lottiefiles.com/packages/lf20_p8bfn5to.json"
                        style={{ height: "80px" }}
                      />
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Processing file...
                      </p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="flex flex-col items-center gap-3 md:gap-4">
                      <div className="flex items-center gap-2">
                        {uploadedFile.type === "application/pdf" ? (
                          <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        ) : (
                          <ImageIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                        )}
                        <span className="text-xs md:text-sm">
                          {uploadedFile.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setReportText("");
                        }}
                        className="text-xs"
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 md:h-8 md:w-8 text-primary mb-1 md:mb-2" />
                      <p className="text-xs md:text-sm font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF or Image (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportDialog(false);
                  setUploadedFile(null);
                  setReportText("");
                  setSelectedSymptoms([]);
                }}
                size="sm"
                className="text-xs md:text-sm"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={analyzeReport}
                disabled={
                  (!reportText.trim() && selectedSymptoms.length === 0) ||
                  isProcessingFile
                }
                className="gap-1 md:gap-2"
                size="sm"
              >
                <Activity className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm">{t("checkHealth")}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default AiDoctor;
