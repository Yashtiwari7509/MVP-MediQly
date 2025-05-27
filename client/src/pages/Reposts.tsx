import { useState } from "react";
import { Upload, Languages, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface AIResponse {
  description: string;
  language: string;
}

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
];

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function RepostsPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
        setAiResponse(null);
      } else {
        setError("Please upload an image file");
      }
    }
  };

  const getBase64FromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) {
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove italic markers
      .replace(/^- /gm, '• ') // Replace markdown bullets with bullet points
      .split('\n') // Split into lines
      .map(line => line.trim()) // Trim each line
      .filter(line => line.length > 0) // Remove empty lines
      .join('\n\n'); // Join with double newlines for spacing
  };

  const getLanguagePrompt = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
      en: "English",
      es: "Spanish (Español)",
      fr: "French (Français)",
      de: "German (Deutsch)",
      hi: "Hindi (हिंदी)",
      zh: "Chinese (中文)",
      ja: "Japanese (日本語)",
      ko: "Korean (한국어)",
      ar: "Arabic (العربية)",
      ru: "Russian (Русский)"
    };
    return languageMap[lang] || "English";
  };

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Translate the following text to ${getLanguagePrompt(targetLang)}. 
Keep the same format and structure, including bullet points. 
Make sure the translation is natural and fluent.

Text to translate:
${text}`;

      const result = await model.generateContent(prompt);
      const translatedText = result.response.text();
      return cleanMarkdown(translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    try {
      setLoading(true);
      setError(null);

      // Get base64 image data
      const base64Image = await getBase64FromFile(selectedImage);

      // Get the Gemini Vision Pro model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      console.log('Sending request to Gemini with image type:', selectedImage.type);
      
      // Generate content with language-specific prompt
      const prompt = language === 'en' 
        ? "Analyze this medical or health-related image and provide a detailed but concise description. List each observation as a separate bullet point. Focus on any visible symptoms, medical conditions, or health-related aspects. Use simple, easy-to-understand language without any special formatting or markdown."
        : `Analyze this medical or health-related image and provide a detailed but concise description in ${getLanguagePrompt(language)}. List each observation as a separate bullet point. Focus on any visible symptoms, medical conditions, or health-related aspects. Use simple, easy-to-understand language without any special formatting or markdown.`;

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: selectedImage.type,
            data: base64Image
          }
        },
        prompt
      ]);

      const response = await result.response;
      let description = cleanMarkdown(response.text());

      console.log('Received response from Gemini:', description);

      // Check if we need translation by looking for some language-specific characters
      const needsTranslation = language !== 'en' && 
        !(
          (language === 'hi' && /[\u0900-\u097F]/.test(description)) || // Hindi
          (language === 'zh' && /[\u4E00-\u9FFF]/.test(description)) || // Chinese
          (language === 'ja' && /[\u3040-\u30FF]/.test(description)) || // Japanese
          (language === 'ko' && /[\uAC00-\uD7AF]/.test(description)) || // Korean
          (language === 'ar' && /[\u0600-\u06FF]/.test(description)) || // Arabic
          (language === 'ru' && /[\u0400-\u04FF]/.test(description))    // Russian
        );

      if (needsTranslation) {
        console.log('Translating response to', getLanguagePrompt(language));
        try {
          description = await translateText(description, language);
        } catch (translationError) {
          console.warn('Translation failed, using original response:', translationError);
          // Continue with the original response if translation fails
        }
      }

      setAiResponse({
        description,
        language,
      });
    } catch (error: unknown) {
      console.error('Analysis error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = "Failed to analyze image. ";
      if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage += "API key error. Please check your API key.";
        } else if (error.message.includes('INVALID_ARGUMENT')) {
          errorMessage += "Invalid image format. Please try a different image.";
        } else if (error.message.includes('404')) {
          errorMessage += "Model not found. Please check model availability.";
        } else if (error.message.includes('Translation failed')) {
          errorMessage += "Failed to translate, showing original response.";
        } else {
          errorMessage += error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAiResponse(null);
    setError(null);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reposts</h1>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <Languages className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {!imagePreview ? (
              <label className="w-full">
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Click to upload an image or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            ) : (
              <div className="relative w-full">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            {imagePreview && !loading && !aiResponse && (
              <Button onClick={analyzeImage} className="w-full">
                Analyze Image
              </Button>
            )}

            {loading && (
              <div className="flex items-center justify-center w-full p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Analyzing image...</span>
              </div>
            )}

            {aiResponse && (
              <div className="w-full space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold">AI Analysis</h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {aiResponse.description.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 