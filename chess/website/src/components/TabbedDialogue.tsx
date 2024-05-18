import { useState } from "react";
import { ReactTyped } from "react-typed";

const TabbedDialogue = ({
  latestMessage,
  reasoning,
}: {
  latestMessage: string;
  reasoning: string;
}) => {
  const [activeTab, setActiveTab] = useState("latestMessage");

  return (
    <div>
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 text-sm font-semibold focus:outline-none ${
            activeTab === "latestMessage"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("latestMessage")}
        >
          Latest Message
        </button>
        {reasoning && (
          <button
            className={`py-2 px-4 text-sm font-semibold focus:outline-none ${
              activeTab === "reasoning"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("reasoning")}
          >
            Reasoning
          </button>
        )}
      </div>
      <div className="tab-content">
        {activeTab === "latestMessage" && (
          <div className="latest-message">
            <span className="">Gemini: </span>
            <ReactTyped
              strings={[latestMessage]}
              typeSpeed={5}
              cursorChar=""
              className="text-blue-600"
            />
          </div>
        )}
        {activeTab === "reasoning" && (
          <div className="reasoning">
            <span className="">Gemini: </span>
            <ReactTyped
              strings={[`"${reasoning}"`]}
              typeSpeed={5}
              cursorChar=""
              className="text-blue-600 italic"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TabbedDialogue;
