import { useState } from "react";

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

interface CommonSymptom {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export function useTranslations() {
  const languages: Language[] = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇧🇩" },
    { code: "ar", name: "العربية", flag: "🇸🇦", rtl: true },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ur", name: "اردو", flag: "🇵🇰", rtl: true },
    { code: "te", name: "తెలుగు", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" },
  ];

  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    languages[0]
  );

  const commonSymptomsTranslations = {
    en: [
      {
        id: "fever",
        label: "🤒 Fever",
        icon: "🌡️",
        description: "Body feels hot",
      },
      {
        id: "headache",
        label: "🤕 Headache",
        icon: "🤕",
        description: "Pain in head",
      },
      {
        id: "cough",
        label: "😷 Cough",
        icon: "🤧",
        description: "Continuous coughing",
      },
      {
        id: "stomach",
        label: "🤢 Stomach Pain",
        icon: "😣",
        description: "Pain in stomach",
      },
      {
        id: "tired",
        label: "😫 Feeling Tired",
        icon: "😴",
        description: "No energy",
      },
      {
        id: "body-pain",
        label: "🤒 Body Pain",
        icon: "🤕",
        description: "Pain in body",
      },
    ],
    hi: [
      {
        id: "fever",
        label: "🤒 बुखार",
        icon: "🌡️",
        description: "शरीर गरम महसूस होता है",
      },
      {
        id: "headache",
        label: "🤕 सिरदर्द",
        icon: "🤕",
        description: "सिर में दर्द",
      },
      {
        id: "cough",
        label: "😷 खांसी",
        icon: "🤧",
        description: "लगातार खांसी",
      },
      {
        id: "stomach",
        label: "🤢 पेट दर्द",
        icon: "😣",
        description: "पेट में दर्द",
      },
      {
        id: "tired",
        label: "😫 थकान",
        icon: "😴",
        description: "ऊर्जा नहीं है",
      },
      {
        id: "body-pain",
        label: "🤒 शरीर दर्द",
        icon: "🤕",
        description: "शरीर में दर्द",
      },
    ],
    // Add more languages as needed
  };

  const uiTranslations = {
    en: {
      welcomeTitle: "AI Health Assistant",
      welcomeDescription:
        "I'm your AI Doctor Assistant, equipped with advanced medical knowledge and natural language understanding. How can I help you today?",
      selectSymptoms: "Select Symptoms",
      writeDescription: "Write or Speak",
      uploadReport: "Upload Report",
      speak: "Speak Now",
      listening: "Listening...",
      checkHealth: "Check My Health",
      cancel: "Cancel",
      askAnything: "Ask me anything about your health...",
      tellHealth: "Tell Me About Your Health",
      describeFeeling:
        "Select your symptoms or describe how you're feeling in simple words.",
      capabilities: "Capabilities",
      accuracy: "Accuracy",
      whatCanYouDo: "What can you help me with?",
      howAccurate: "How do you ensure medical accuracy?",
      analyzing: "Analyzing your request...",
      pleaseDescribeSymptoms:
        "Please describe your symptoms or select from the common symptoms",
      whatIUnderstand: "What I Understand",
      importantFindings: "Important Findings",
      whatThisMightBe: "What This Might Be",
      whatToDoNext: "What To Do Next",
      whenToSeeDoctor: "When to See a Doctor",
      needsImmediateAttention: "This needs immediate medical attention",
      shouldSeeDoctor: "You should see a doctor soon",
      canTreatAtHome:
        "You can treat this at home but see a doctor if it gets worse",
    },
    es: {
      welcomeTitle: "Asistente de Salud IA",
      welcomeDescription:
        "Soy tu Asistente Médico IA, equipado con conocimientos médicos avanzados y comprensión del lenguaje natural. ¿Cómo puedo ayudarte hoy?",
      selectSymptoms: "Seleccionar Síntomas",
      writeDescription: "Escribir o Hablar",
      uploadReport: "Subir Informe",
      speak: "Hablar Ahora",
      listening: "Escuchando...",
      checkHealth: "Revisar mi Salud",
      cancel: "Cancelar",
      askAnything: "Pregúntame cualquier cosa sobre tu salud...",
      tellHealth: "Cuéntame sobre tu Salud",
      describeFeeling:
        "Selecciona tus síntomas o describe cómo te sientes en palabras simples.",
      capabilities: "Capacidades",
      accuracy: "Precisión",
      whatCanYouDo: "¿En qué puedes ayudarme?",
      howAccurate: "¿Cómo aseguras la precisión médica?",
      analyzing: "Analizando su consulta...",
      pleaseDescribeSymptoms:
        "Por favor describe tus síntomas o selecciona de los síntomas comunes",
      whatIUnderstand: "Lo que Entiendo",
      importantFindings: "Hallazgos Importantes",
      whatThisMightBe: "Qué Podría Ser",
      whatToDoNext: "Qué Hacer Después",
      whenToSeeDoctor: "Cuándo Ver al Médico",
      needsImmediateAttention: "Esto necesita atención médica inmediata",
      shouldSeeDoctor: "Deberías ver a un médico pronto",
      canTreatAtHome:
        "Puedes tratarlo en casa pero consulta al médico si empeora",
    },
    hi: {
      welcomeTitle: "एआई स्वास्थ्य सहायक",
      welcomeDescription:
        "मैं आपका एआई डॉक्टर सहायक हूं, उन्नत चिकित्सा ज्ञान और प्राकृतिक भाषा समझ से लैस। मैं आज आपकी कैसे मदद कर सकता हूं?",
      selectSymptoms: "लक्षण चुनें",
      writeDescription: "लिखें या बोलें",
      uploadReport: "रिपोर्ट अपलोड करें",
      speak: "अब बोलें",
      listening: "सुन रहा हूं...",
      checkHealth: "मेरी सेहत जांचें",
      cancel: "रद्द करें",
      askAnything: "अपनी सेहत के बारे में कुछ भी पूछें...",
      tellHealth: "अपनी सेहत के बारे में बताएं",
      describeFeeling: "अपने लक्षण चुनें या बताएं कि आप कैसा महसूस कर रहे हैं।",
      capabilities: "क्षमताएं",
      accuracy: "सटीकता",
      whatCanYouDo: "आप मेरी कैसे मदद कर सकते हैं?",
      howAccurate: "आप चिकित्सा सटीकता कैसे सुनिश्चित करते हैं?",
      analyzing: "आपके प्रश्न का विश्लेषण कर रहा हूं...",
      pleaseDescribeSymptoms:
        "कृपया अपने लक्षणों का वर्णन करें या सामान्य लक्षणों में से चुनें",
      whatIUnderstand: "मैं क्या समझता हूं",
      importantFindings: "महत्वपूर्ण निष्कर्ष",
      whatThisMightBe: "यह क्या हो सकता है",
      whatToDoNext: "आगे क्या करें",
      whenToSeeDoctor: "डॉक्टर को कब दिखाएं",
      needsImmediateAttention: "इसे तत्काल चिकित्सा ध्यान की आवश्यकता है",
      shouldSeeDoctor: "आपको जल्द ही डॉक्टर को दिखाना चाहिए",
      canTreatAtHome:
        "आप इसका घर पर इलाज कर सकते हैं लेकिन अगर स्थिति बिगड़े तो डॉक्टर को दिखाएं",
    },
    // Add more languages as needed
  };

  const t = (key: string) => {
    const translations =
      uiTranslations[currentLanguage.code as keyof typeof uiTranslations] ||
      uiTranslations.en;
    return (
      translations[key as keyof typeof translations] ||
      uiTranslations.en[key as keyof typeof uiTranslations.en]
    );
  };

  const getLocalizedSymptoms = (): CommonSymptom[] => {
    return (
      commonSymptomsTranslations[
        currentLanguage.code as keyof typeof commonSymptomsTranslations
      ] || commonSymptomsTranslations.en
    );
  };

  return {
    t,
    currentLanguage,
    setCurrentLanguage,
    languages,
    getLocalizedSymptoms,
  };
}
