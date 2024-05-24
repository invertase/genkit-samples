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
    <div className="relative w-[80vw] h-[30vh] mobile-h:w-[40vw] mobile-h:h-[30vw] relative md:w-[40vw] md:h-[30vh] overflow-scroll md:overflow-visible">
      <div className="bg-white border-solid border rounded p-4">
        <div className="flex border-b mb-4 w-full">
          {latestMessage && (
            <button
              className={`py-2 px-4 text-sm md:text-base font-semibold focus:outline-none ${
                activeTab === "latestMessage"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("latestMessage")}
            >
              Latest Message
            </button>
          )}
          {reasoning && (
            <button
              className={`py-2 px-4 text-sm md:text-base font-semibold focus:outline-none ${
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
        <div className="sm:max-h-none md:max-h-40 overflow-auto">
          {activeTab === "latestMessage" && (
            <div className="latest-message">
              <span className="md:text-base">Gemini: </span>
              <ReactTyped
                strings={[latestMessage]}
                typeSpeed={5}
                cursorChar=""
                className="text-blue-600 md:text-base"
              />
            </div>
          )}
          {activeTab === "reasoning" && (
            <div className="reasoning">
              <span className="md:text-base">Gemini: </span>
              <ReactTyped
                strings={[`"${reasoning}"`]}
                typeSpeed={5}
                cursorChar=""
                className="text-blue-600 italic leading-snug md:text-base"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabbedDialogue;
