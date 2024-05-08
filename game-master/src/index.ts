import { generate } from "@genkit-ai/ai";
import { initializeGenkit } from "@genkit-ai/core";
import { defineFlow, runFlow, startFlowsServer } from "@genkit-ai/flow";
import { geminiPro } from "@genkit-ai/vertexai";
import * as z from "zod";
import config from "./genkit.config.js";
import { defineTool } from "@genkit-ai/ai";

initializeGenkit(config);

const roomDescriptionPrompt = ({
  atmosphere,
  hasMonsters,
  hasNPCs,
}: {
  atmosphere: string;
  hasMonsters: boolean;
  hasNPCs: boolean;
}) => `
You are an assistant to a dungeon master for fifth edition Dungeons & Dragons. The party has just entered a room in a dungeon.

If the room has monsters, you should provide a description of the monsters. If the room has non-player characters (NPCs), you should provide a description of the NPCs. If the room has both monsters and NPCs, you should provide descriptions for both.
You should **not** refer to the room as having monsters or NPCs in the description. You should provide a description of the room to set the scene for the players. Here are the parameters to define the room:

<Parameters>
    <Atmosphere description="A one-word description of the room's overall vibe or emotional tone.">${atmosphere}</Atmosphere>
    <HasMonsters description="A boolean value indicating if there are monsters present in the room.">${hasMonsters}</HasMonsters>
    <HasNPCs description="A boolean value indicating if there are non-player characters (NPCs) present in the room.">${hasNPCs}</HasNPCs>
</Parameters>
`;


const roomDescriptionInputSchema = z.object({
  atmosphere: z.string(),
  hasMonsters: z.boolean(),
  hasNPCs: z.boolean(),
});


export const roomDescriptionFlow = defineFlow(
  {
    name: "initialDescriptionFlow",
    inputSchema: roomDescriptionInputSchema,
    outputSchema: z.string(),
  },
  async ({atmosphere, hasMonsters, hasNPCs}) => {
    
    const description = await generate({
      model: geminiPro,
      prompt: roomDescriptionPrompt({atmosphere, hasMonsters, hasNPCs}),
      config: {
        temperature: 1,
      },
    });
    return description.text();
  }
);


const extractMonsterPrompt = (roomDescription: string) => `
You are an assistant to a dungeon master for fifth edition Dungeons & Dragons. The party has just entered a room in a dungeon. The room is described as follows:
<RoomDescription>
${roomDescription}
</RoomDescription>

You should extract the monster(s) present in the room from the description. Provide a description of the monster(s) that the party encounters, including the monster's name, a brief description, and the monster's armor class and attack/damage statistics.

We need the following information for each monster:
- Monster Name: The name of the monster.
- Monster Amount: The number of monsters of this type present.
- Monster Description: A brief description of the monster.
- Monster Armor Class: The monster's armor class (an integer between 10 and 20 inclusive).
- Monster Hit Points: The monster's hit points (an integer between 1 and 100 inclusive).
- Monster Attack Bonus: The monster's attack bonus (an integer between 0 and 10 inclusive).
- Monster Damage Dice: The monster's damage dice (must be one of 4,6,8,10,12).

Return the monster description in the following xml format (but do not include the description property):
<Monster>
  <MonsterName>MONSTER_NAME</MonsterName>
  <MonsterAmount>MONSTER_AMOUNT</MonsterAmount>
  <MonsterDescription>MONSTER_DESCRIPTION</MonsterDescription>
  <MonsterArmorClass>MONSTER_AC</MonsterArmorClass>
  <MonsterHitPoints>MONSTER_HP</MonsterHitPoints>
  <MonsterAttackBonus>MONSTER_ATTACK_BONUS</MonsterAttackBonus>
  <MonsterDamageDice>MONSTER_DAMAGE_DICE</MonsterDamageDice>
</Monster>
If some information is not present in the description, you can decide the value yourself.
`;


const extractNPCPrompt = (roomDescription: string) => `
You are an assistant to a dungeon master for fifth edition Dungeons & Dragons. The party has just entered a room in a dungeon. The room is described as follows:
<RoomDescription>
${roomDescription}
</RoomDescription>

You should extract the non-player characters (NPCs) present in the room from the description. Provide a description of the NPCs that the party encounters, including the NPC's name, a brief description, and the NPC's role or occupation.

We need the following information for each NPC:
- NPC Name: The name of the NPC.
- NPC Description: A brief description of the NPC.
- NPC Role: The NPC's role or occupation.
- NPC Alignment: The NPC's alignment (must be one of "Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil").
- NPC Hit Points: The NPC's hit points (an integer between 1 and 100 inclusive).
- NPC Armor Class: The NPC's armor class (an integer between 10 and 20 inclusive).
- NPC Attack Bonus: The NPC's attack bonus (an integer between 0 and 10 inclusive).
- NPC Damage Dice: The NPC's damage dice (must be one of 4,6,8,10,12).
- NPC Damage Bonus: The NPC's damage bonus (an integer between 0 and 10 inclusive).

Return the NPC description in the following xml format (but do not include the description property):
<NPC>
  <NPCName>NPC_NAME</NPCName>
  <NPCDescription>NPC_DESCRIPTION</NPCDescription>
  <NPCRole>NPC_ROLE</NPCRole>
  <NPCAlignment>NPC_ALIGNMENT</NPCAlignment>
  <NPCHitPoints>NPC_HP</NPCHitPoints>
  <NPCArmorClass>NPC_AC</NPCArmorClass>
  <NPCAttackBonus>NPC_ATTACK_BONUS</NPCAttackBonus>
  <NPCDamageDice>NPC_DAMAGE_DICE</NPCDamageDice>
  <NPCDamageBonus>NPC_DAMAGE_BONUS</NPCDamageBonus>
</NPC>
If some information is not present in the description, you can decide the value yourself.
`;


function extractValuesFromXml(xml: string, parentElementName: string) {
  // Regular expression to capture content within the specified parent element
  const parentRegex = new RegExp(`<${parentElementName}>(.*?)</${parentElementName}>`, "gs"); // 's' allows for matching across multiple lines

  // Match the content within the parent tag
  const matches = xml.match(parentRegex);
  if (!matches) {
      throw new Error("Parent element not found in XML: " + parentElementName);
  }

  // Return the inner content from the first match, without the parent tags
  return matches.map(match => match.replace(new RegExp(`</?${parentElementName}>`, "g"), ""));
}


const NPCOutputSchema = z.array(z.object({
  NPCName: z.string(),
  NPCDescription: z.string(),
  NPCRole: z.string(),
  NPCAlignment: z.string(),
  NPCHitPoints: z.number(),
  NPCArmorClass: z.number(),
  NPCAttackBonus: z.number(),
  NPCDamageDice: z.number(),
  NPCDamageBonus: z.number(),
}));

export const extractNPCFlow = defineFlow({
  name: "extractNPCFlow",
  inputSchema: z.string(),
  outputSchema: NPCOutputSchema,
}, async (input) => {

  const NPCsRaw = await generate({
    prompt: extractNPCPrompt(input),
    model: geminiPro,
  });

  const NPCsXml = NPCsRaw.text();

  const NPCs = extractValuesFromXml(NPCsXml, "NPC");

  const NPCObjects = NPCs.map((NPC) => {
    const NPCName = extractValuesFromXml(NPC, "NPCName");
    const NPCDescription = extractValuesFromXml(NPC, "NPCDescription");
    const NPCRole = extractValuesFromXml(NPC, "NPCRole");
    const NPCAlignment = extractValuesFromXml(NPC, "NPCAlignment");
    const NPCHitPoints = extractValuesFromXml(NPC, "NPCHitPoints");
    const NPCArmorClass = extractValuesFromXml(NPC, "NPCArmorClass");
    const NPCAttackBonus = extractValuesFromXml(NPC, "NPCAttackBonus");
    const NPCDamageDice = extractValuesFromXml(NPC, "NPCDamageDice");
    const NPCDamageBonus = extractValuesFromXml(NPC, "NPCDamageBonus");

    return {
      NPCName: NPCName[0],
      NPCDescription: NPCDescription[0],
      NPCRole: NPCRole[0],
      NPCAlignment: NPCAlignment[0],
      NPCHitPoints: parseInt(NPCHitPoints[0]),
      NPCArmorClass: parseInt(NPCArmorClass[0]),
      NPCAttackBonus: parseInt(NPCAttackBonus[0]),
      NPCDamageDice: parseInt(NPCDamageDice[0]),
      NPCDamageBonus: parseInt(NPCDamageBonus[0]),
    };
  });

  return NPCObjects;
});

const monsterOutputSchema = z.array(z.object({
  monsterName: z.string(),
  monsterAmount: z.number(),
  monsterDescription: z.string(),
  monsterArmorClass: z.number(),
  monsterHitPoints: z.number(),
  monsterAttackBonus: z.number(),
  monsterDamageDice: z.number(),
}));

export const extractMonsterFlow = defineFlow(
  {
    name: "extractMonsterFlow",
    inputSchema: z.string(),
    outputSchema: monsterOutputSchema
  },
  async (input) => {
    const monstersRaw = await generate({
      prompt: extractMonsterPrompt(input),
      model: geminiPro,
    });

    const monstersXml = monstersRaw.text();

    const monsters = extractValuesFromXml(monstersXml, "Monster");

    const monsterObjects = monsters.map((monster) => {

      console.log(monster)

      const monsterName = extractValuesFromXml(monster, "MonsterName");
      const monsterAmount = extractValuesFromXml(monster, "MonsterAmount");
      const monsterDescription = extractValuesFromXml(monster, "MonsterDescription");
      const monsterArmorClass = extractValuesFromXml(monster, "MonsterArmorClass");
      const monsterHitPoints = extractValuesFromXml(monster, "MonsterHitPoints");
      const monsterAttackBonus = extractValuesFromXml(monster, "MonsterAttackBonus");
      const monsterDamageDice = extractValuesFromXml(monster, "MonsterDamageDice");

      return {
        monsterName: monsterName[0],
        monsterAmount: parseInt(monsterAmount[0]),
        monsterDescription: monsterDescription[0],
        monsterArmorClass: parseInt(monsterArmorClass[0]),
        monsterHitPoints: parseInt(monsterHitPoints[0]),
        monsterAttackBonus: parseInt(monsterAttackBonus[0]),
        monsterDamageDice: parseInt(monsterDamageDice[0]),
      };
    });

    return monsterObjects;
  }
)

const attackFlowInputSchema = z.object({
  roomDescription: z.string(),
  monsters: monsterOutputSchema,
  NPCs: NPCOutputSchema,
})



// Note - I couldn't get this to work, even vastly simplifying the flow:
export const attackFlow = defineFlow(
  {
    name: "attackFlow",
    inputSchema: z.void(),
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await generate({
      prompt: `Roll a 20 sided dice`,
      model: geminiPro,
      config: {
        temperature: 0.5,
      },
      tools: [diceRollingTool],
    });

    return llmResponse.text();
  }
);

async function rollDice(sides: number): Promise<number> {
  if (sides < 1) {
    throw new Error("The dice must have at least one side.");
  }
  return Math.floor(Math.random() * sides) + 1;
}


const diceRollingTool = defineTool(
  {
    name: "rollDice",
    description:
      "Rolls a die with a specified number of sides. Use this tool whenever you need to roll a die with a specific number of sides.",
    inputSchema: z.number(),
    outputSchema: z.number(),
  },
  (sides: number) => rollDice(sides)
);

const d20Tool = defineTool(
  {
    name: "rollTwentySidedDie",
    description:
      "Rolls a twenty-sided die. Use this tool whenever you need to roll a d20.",
    inputSchema: z.number(),
    outputSchema: z.number(),
  },
  () => rollDice(20)
);


const totalOutputSchema = z.object({
  roomDescription: z.string(),
  monsters: monsterOutputSchema,
  NPCs: NPCOutputSchema,
})

export const totalFlow = defineFlow({
  name: "totalFlow",
  inputSchema: roomDescriptionInputSchema,
  outputSchema: totalOutputSchema
}, async (input) => {

  const roomDescription = await runFlow(roomDescriptionFlow, input);

  const monsters = await runFlow(extractMonsterFlow, roomDescription);

  const NPCs = await runFlow(extractNPCFlow, roomDescription);

  const attackFlowInput = {
    roomDescription,
    monsters,
    NPCs,
  }

  // const attackResult = await runFlow(attackFlow, attackFlowInput);

  return {
    roomDescription,
    monsters,
    NPCs,
  }
});

startFlowsServer();
