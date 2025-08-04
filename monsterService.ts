
import { GoogleGenAI, Type } from "@google/genai";
import { Monster } from '../types';
import { PERSONALITY_LIST } from "../constants";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const monsterDataSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "A cool, unique name for a fantasy monster."
    },
    description: {
      type: Type.STRING,
      description: "A short, 1-2 sentence compelling description of the monster's appearance and nature."
    },
    personality: {
      type: Type.STRING,
      description: `A single adjective describing the monster's personality. It MUST be one of the following: ${PERSONALITY_LIST.join(', ')}.`,
      enum: PERSONALITY_LIST,
    },
    hp: {
      type: Type.INTEGER,
      description: "Base health points, between 25 and 60."
    },
    attack: {
      type: Type.INTEGER,
      description: "Base attack power, between 8 and 20."
    },
    defense: {
      type: Type.INTEGER,
      description: "Base defense stat, between 5 and 18."
    },
    abilities: {
        type: Type.ARRAY,
        description: "A list of 2 to 4 unique abilities or attacks for the monster.",
        items: {
            type: Type.OBJECT,
            properties: {
                name: {
                    type: Type.STRING,
                    description: "The creative name of the ability."
                },
                description: {
                    type: Type.STRING,
                    description: "A brief description of what the ability does."
                },
                damage: {
                    type: Type.INTEGER,
                    description: "The base damage this ability deals, between 5 and 25."
                }
            },
            required: ["name", "description", "damage"]
        }
    }
  },
  required: ["name", "description", "personality", "hp", "attack", "defense", "abilities"]
};

export const generateRandomMonster = async (): Promise<Monster> => {
  try {
    // Step 1: Generate monster data
    const dataResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a unique, fantasy RPG monster. It should be suitable for a low-to-mid level encounter. From the following list, choose the one personality that fits the monster best: ${PERSONALITY_LIST.join(', ')}. Also generate 2 to 4 creative and fitting abilities. Avoid common mythological creatures like dragons or goblins.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: monsterDataSchema,
      },
    });
    
    const monsterDataText = dataResponse.text.trim();
    const monsterData = JSON.parse(monsterDataText);

    // Step 2: Generate monster image from data
    const imagePrompt = `A vibrant, high-quality digital painting of a fantasy creature named "${monsterData.name}". Description: "${monsterData.description}". Personality: ${monsterData.personality}. The creature is the central focus, isolated on a simple, dark, atmospheric background. Style: modern RPG game asset, detailed, fantasy art.`;

    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: imagePrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    // Step 3: Combine into a Monster object
    const newMonster: Monster = {
      id: self.crypto.randomUUID(),
      name: monsterData.name,
      description: monsterData.description,
      personality: monsterData.personality,
      hp: monsterData.hp,
      maxHp: monsterData.hp, // Initial maxHP is the base HP
      attack: monsterData.attack,
      defense: monsterData.defense,
      imageUrl: imageUrl,
      abilities: monsterData.abilities,
      level: 1,
      exp: 0,
      expToNextLevel: 100,
    };

    return newMonster;
  } catch (error) {
    console.error("Error generating monster:", error);
    // In case of error, you might want to return a default monster or re-throw
    throw new Error("Failed to generate a new monster from the void.");
  }
};
