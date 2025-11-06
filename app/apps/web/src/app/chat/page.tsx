"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline: boolean;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Alice Johnson",
    avatar: "AJ",
    lastMessage: "Hey! How are you doing today? I was thinking about...",
    timestamp: "2m ago",
    unreadCount: 3,
    isOnline: true,
  },
  {
    id: "2",
    name: "Bob Smith",
    avatar: "BS",
    lastMessage: "Thanks for your help yesterday!",
    timestamp: "1h ago",
    isOnline: true,
  },
  {
    id: "3",
    name: "Carol Davis",
    avatar: "CD",
    lastMessage: "See you tomorrow at the meeting",
    timestamp: "3h ago",
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: "4",
    name: "David Wilson",
    avatar: "DW",
    lastMessage: "That sounds like a great idea! Let's discuss it more...",
    timestamp: "1d ago",
    isOnline: true,
  },
  {
    id: "5",
    name: "Emma Brown",
    avatar: "EB",
    lastMessage: "I'll send you the files later",
    timestamp: "2d ago",
    isOnline: false,
  },
];

export default function ContactList() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const contactsPerPage = 5;

  const handleContactClick = (contactId: string, isParalyzed: boolean = false) => {
    router.push(`/chat/${contactId}${isParalyzed ? "?mode=eye-tracking" : ""}`);
  };

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };

  const displayedContacts = mockContacts.slice(
    page * contactsPerPage,
    (page + 1) * contactsPerPage
  );

  return (
    <div className="h-screen w-screen bg-white dark:bg-gray-950 overflow-hidden fixed inset-0">
      {/* Grid Layout - 3x2 - No gaps for eye-tracking precision */}
      <div className="grid grid-cols-3 grid-rows-2 h-full w-full gap-0">
        {/* Contact Cards (Boxes 1-5) */}
        {displayedContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => handleContactClick(contact.id)}
            className="relative cursor-pointer flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 group"
          >
            {/* Inner content with visual spacing and hover effects */}
            <div className="absolute inset-0 m-5 bg-white dark:bg-gray-900 rounded-2xl border-4 border-transparent group-hover:border-blue-500 group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center p-6"
            >
              {/* Unread Badge */}
              {contact.unreadCount && contact.unreadCount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {contact.unreadCount}
                </div>
              )}

              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {contact.avatar}
                </div>
                {/* Online Status */}
                <div
                  className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 ${
                    contact.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              {/* Contact Name */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                {contact.name}
              </h3>

              {/* Last Message Preview */}
              <p className="text-base text-gray-600 dark:text-gray-400 text-center line-clamp-2 mb-4 px-2">
                {contact.lastMessage}
              </p>

              {/* Timestamp */}
              <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                {contact.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Next Button (Box 6) */}
        <div
          onClick={handleNextPage}
          className="relative cursor-pointer flex flex-col items-center justify-center group border border-gray-200 dark:border-gray-800"
        >
          {/* Inner content with visual spacing and hover effects */}
          <div className="absolute inset-0 m-5 bg-blue-500 group-hover:bg-blue-600 group-hover:scale-[1.02] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group-hover:shadow-xl">
            <div className="text-white text-3xl font-bold mb-2">Next</div>
            <ArrowRight className="text-white w-12 h-12 group-hover:translate-x-2 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
