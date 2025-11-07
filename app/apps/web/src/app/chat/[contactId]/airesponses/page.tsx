"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Loader2, Check } from "lucide-react";
import { useSocket } from "@/components/socket-provider";
import { useMessages, useInvalidateMessages } from "@/lib/hooks";
import { useUser } from "@clerk/nextjs";
import { api } from "@/lib/api-client";

interface AIOption {
  id: number;
  text: string;
  color: string;
}

const DEFAULT_OPTIONS: AIOption[] = [
  { id: 1, text: "Hi! How are you doing today?", color: "bg-blue-500" },
  { id: 2, text: "Thanks for your message!", color: "bg-green-500" },
  { id: 3, text: "I'll get back to you soon.", color: "bg-purple-500" },
  { id: 4, text: "Could you tell me more about that?", color: "bg-orange-500" },
];

export default function AIResponsesPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const { sendMessage, isConnected } = useSocket();
  const invalidateMessages = useInvalidateMessages();

  const { data: messagesData, isLoading, error } = useMessages(contactId);

  const [aiOptions, setAiOptions] = useState<AIOption[]>(DEFAULT_OPTIONS);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastUnreadMessages, setLastUnreadMessages] = useState("");

  const getUnreadMessages = () => {
    if (!messagesData?.messages || !user?.id) return "";

    return messagesData.messages
      .filter((msg: any) => msg.fromClerkId === contactId && !msg.isRead)
      .map((msg: any) => msg.content)
      .join(" ")
      .trim();
  };

  const fetchAIOptions = async (reuseLast = false) => {
    const messageToSend = reuseLast ? lastUnreadMessages : getUnreadMessages();

    if (!messageToSend) {
      setAiOptions(DEFAULT_OPTIONS);
      return;
    }

    setIsLoadingOptions(true);
    setLastUnreadMessages(messageToSend);

    try {
      const response = await api.getChatOptions(messageToSend);
      const options: string[] = response.data?.options ?? [];

      if (options.length === 0) {
        setAiOptions(DEFAULT_OPTIONS);
        return;
      }

      setAiOptions(
        options.slice(0, 4).map((text, index) => ({
          id: index + 1,
          text,
          color: DEFAULT_OPTIONS[index]?.color ?? "bg-blue-500",
        }))
      );
    } catch (err) {
      console.error("Failed to fetch AI options:", err);
      setAiOptions(DEFAULT_OPTIONS);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (messagesData?.messages) {
      fetchAIOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesData?.messages]);

  const handleOptionClick = async (option: AIOption) => {
    if (!isConnected || !user?.id) {
      console.warn("Socket not connected. Unable to send message.");
      return;
    }

    const text = option.text.trim();
    if (!text) return;

    setSelectedOption(option.id);

    try {
      sendMessage(contactId, text);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await invalidateMessages(contactId);
    } catch (err) {
      console.error("Failed to send AI option:", err);
    } finally {
      router.push(`/chat/${contactId}`);
    }
  };

  const handleRetry = () => {
    fetchAIOptions(true);
  };

  const handlePrevious = () => {
    router.push(`/chat/${contactId}`);
  };

  if (isLoading || isLoadingOptions) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading AI options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-lg font-semibold">Failed to load conversation</p>
          <button
            onClick={() => router.push(`/chat/${contactId}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const renderOptionCard = (option: AIOption | undefined, key: string) => {
    if (!option) {
      return (
        <div
          key={key}
          className="flex h-full w-full items-center justify-center border border-dashed border-gray-300 dark:border-gray-700"
          aria-hidden
        />
      );
    }

    return (
      <button
        key={key}
        onClick={() => handleOptionClick(option)}
        className={`${option.color} relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden text-white transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60`}
      >
        <span className="mx-6 text-2xl font-bold leading-relaxed text-center">
          {option.text}
        </span>
        {selectedOption === option.id && (
          <span className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-green-500">
            <Check className="h-6 w-6" />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-gray-950 overflow-hidden fixed inset-0">
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4">
        <button
          onClick={handlePrevious}
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
              {messagesData?.otherUser?.nickname?.slice(0, 2).toUpperCase() || contactId.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {messagesData?.otherUser?.nickname || contactId}
            </h2>
            <p className="text-sm text-gray-500">AI Response Options</p>
          </div>
        </div>
      </div>

      <div className="grid h-[calc(100vh-4rem)] w-full grid-cols-2 grid-rows-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handlePrevious}
          className="relative flex h-full w-full cursor-pointer items-center justify-center bg-blue-600 text-white text-3xl font-bold transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        >
          <ArrowLeft className="mr-4 h-10 w-10" />
          Previous
        </button>

  {renderOptionCard(aiOptions[0], "option-1")}
  {renderOptionCard(aiOptions[1], "option-2")}
  {renderOptionCard(aiOptions[2], "option-3")}
  {renderOptionCard(aiOptions[3], "option-4")}

        <button
          onClick={handleRetry}
          className="relative flex h-full w-full cursor-pointer items-center justify-center bg-red-500 text-white text-3xl font-bold transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        >
          <RefreshCw className="mr-4 h-10 w-10" />
          Retry
        </button>
      </div>
    </div>
  );
}
