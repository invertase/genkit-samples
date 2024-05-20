import { useState } from "react";
import { ReactTyped } from "react-typed";

const TabbedDialogue = ({
  latestMessage,
  reasoning,
  setModel,
  modelDisplayName,
  currentModel,
}: {
  latestMessage: string;
  reasoning: string;
  setModel: (model: "gemini15ProPreview" | "gpt4") => void;
  currentModel: "gemini15ProPreview" | "gpt4";
  modelDisplayName: string;
}) => {
  const [activeTab, setActiveTab] = useState("latestMessage");

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModel = event.target.value as "gemini15ProPreview" | "gpt4";
    setModel(selectedModel);
  };

  return (
    <div className="relative w-[80vw] h-[30vh] mobile-h:w-[40vw] mobile-h:h-[30vw] relative md:w-[40vw] md:h-[30vh] overflow-scroll">
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
              Message
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
          <button
            className={`py-2 px-4 text-sm md:text-base font-semibold focus:outline-none ${
              activeTab === "settings"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
        <div className="sm:max-h-none md:max-h-40 overflow-scroll">
          {activeTab === "latestMessage" && (
            <div className="latest-message">
              <span className="md:text-base">{modelDisplayName}: </span>
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
              <span className="md:text-base">{modelDisplayName}: </span>
              <ReactTyped
                strings={[`"${reasoning}"`]}
                typeSpeed={5}
                cursorChar=""
                className="text-blue-600 italic leading-snug md:text-base"
              />
            </div>
          )}
          {activeTab === "settings" && (
            <div className="settings">
              <label
                htmlFor="modelSelect"
                className="block mb-2 text-sm md:text-base font-semibold text-gray-600"
              >
                Select Model:
              </label>
              <select
                id="modelSelect"
                onChange={handleModelChange}
                value={currentModel}
                className="border rounded px-4 py-2 text-sm md:text-base"
              >
                <option value="gemini15ProPreview">
                  Gemini 15 Pro Preview
                </option>
                <option value="gpt4">GPT-4</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabbedDialogue;
