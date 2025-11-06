"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

export default function ChatPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEyeTracking = searchParams.get("mode") === "eye-tracking";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: contactId,
      content: "Hey! How are you doing today?",
      timestamp: "10:30 AM",
      isRead: true,
    },
    {
      id: "2",
      senderId: "me",
      content: "I'm doing great! How about you?",
      timestamp: "10:32 AM",
      isRead: true,
    },
    {
      id: "3",
      senderId: contactId,
      content: "I'm good too! Want to grab coffee later?",
      timestamp: "10:35 AM",
      isRead: true,
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [aiOptions, setAiOptions] = useState([
    "Sure! That sounds great! What time works for you?",
    "I'd love to, but I'm busy today. How about tomorrow?",
    "Thanks for asking! Let me check my schedule and get back to you.",
    "I'm not sure yet. Can I let you know in a bit?",
  ]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [dwellProgress, setDwellProgress] = useState<{ [key: number]: number }>({});

  const contact: Contact = {
    id: contactId,
    name: "Alice Johnson",
    avatar: "AJ",
    isOnline: true,
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "me",
      content,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isRead: false,
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulate AI generating new options after sending
    if (isEyeTracking) {
      setTimeout(() => {
        setAiOptions([
          "That's interesting! Tell me more about it.",
          "I completely agree with you on that.",
          "Hmm, I need to think about that for a moment.",
          "Could you explain that a bit more?",
        ]);
      }, 1000);
    }
  };

  const handleOptionHover = (index: number, isHovering: boolean) => {
    if (!isEyeTracking) return;

    if (isHovering) {
      // Simulate dwell timer
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setDwellProgress((prev) => ({ ...prev, [index]: progress }));

        if (progress >= 100) {
          clearInterval(interval);
          handleSendMessage(aiOptions[index]);
          setSelectedOption(index);
          setTimeout(() => {
            setSelectedOption(null);
            setDwellProgress({});
          }, 500);
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setDwellProgress((prev) => ({ ...prev, [index]: 0 }));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Top Bar */}
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/chat")}
          className="w-10 h-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
              {contact.avatar}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                contact.isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {contact.name}
            </h2>
            <p className="text-sm text-gray-500">
              {contact.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {isEyeTracking && (
          <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-semibold">
            Eye-Tracking Mode
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          isEyeTracking ? "max-h-[40vh]" : ""
        }`}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-2 max-w-[70%] ${
                message.senderId === "me" ? "flex-row-reverse" : ""
              }`}
            >
              {message.senderId !== "me" && (
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {contact.avatar}
                </div>
              )}
              <div>
                <div
                  className={`rounded-xl px-4 py-3 shadow-sm ${
                    message.senderId === "me"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <p className="text-base leading-relaxed">{message.content}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1 px-2">
                  {message.timestamp}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area or AI Options */}
      {!isEyeTracking ? (
        // Regular User Input
        <div className="h-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && inputMessage.trim()) {
                handleSendMessage(inputMessage);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 h-12 text-base"
          />
          <Button
            onClick={() => inputMessage.trim() && handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim()}
            size="icon"
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        // Eye-Tracking AI Options
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
          <div className="grid grid-cols-2 gap-5 h-full">
            {aiOptions.map((option, index) => (
              <button
                key={index}
                onMouseEnter={() => handleOptionHover(index, true)}
                onMouseLeave={() => handleOptionHover(index, false)}
                onClick={() => handleSendMessage(option)}
                className={`relative min-h-[180px] rounded-2xl p-6 text-white text-2xl font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                  index === 0
                    ? "bg-blue-500 hover:ring-4 hover:ring-blue-300"
                    : index === 1
                    ? "bg-green-500 hover:ring-4 hover:ring-green-300"
                    : index === 2
                    ? "bg-purple-500 hover:ring-4 hover:ring-purple-300"
                    : "bg-orange-500 hover:ring-4 hover:ring-orange-300"
                } ${selectedOption === index ? "scale-105 ring-4 ring-white" : ""}`}
              >
                {/* Number Badge with Dwell Progress */}
                <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-3xl font-black">
                  {dwellProgress[index] > 0 && (
                    <svg
                      className="absolute inset-0 w-12 h-12 -rotate-90"
                      viewBox="0 0 48 48"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 20 * (1 - dwellProgress[index] / 100)
                        }`}
                        className="transition-all duration-100"
                      />
                    </svg>
                  )}
                  {index + 1}
                </div>

                {/* Checkmark Animation */}
                {selectedOption === index && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center animate-bounce">
                      <svg
                        className="w-12 h-12 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Option Text */}
                <div className="flex items-center justify-center h-full text-center px-4">
                  {option}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
