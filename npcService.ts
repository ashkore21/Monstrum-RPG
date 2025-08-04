
import { GoogleGenAI, Type } from "@google/genai";
import { Monster, Trainer } from '../types';
import { PERSONALITY_LIST } from "../constants";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Re-defining the monster schema here to avoid circular dependencies
// and keep the service self-contained.
const monsterDataSubSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A cool, unique name for a fantasy monster." },
    description: { type: Type.STRING, description: "A short, 1-2 sentence compelling description of the monster's appearance and nature." },
    personality: { type: Type.STRING, description: `A single adjective describing the monster's personality. It MUST be one of the following: ${PERSONALITY_LIST.join(', ')}.`, enum: PERSONALITY_LIST },
    hp: { type: Type.INTEGER, description: "Base health points, between 25 and 60." },
    attack: { type: Type.INTEGER, description: "Base attack power, between 8 and 20." },
    defense: { type: Type.INTEGER, description: "Base defense stat, between 5 and 18." },
    abilities: {
        type: Type.ARRAY,
        description: "A list of 2 to 4 unique abilities or attacks for the monster.",
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The creative name of the ability." },
                description: { type: Type.STRING, description: "A brief description of what the ability does." },
                damage: { type: Type.INTEGER, description: "The base damage this ability deals, between 5 and 25." }
            },
            required: ["name", "description", "damage"]
        }
    }
  },
  required: ["name", "description", "personality", "hp", "attack", "defense", "abilities"]
};


const npcDataSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "A unique, memorable name for an RPG trainer. e.g., 'Roric', 'Elara'." },
        title: { type: Type.STRING, description: "A cool title for the trainer, like 'Insect Enthusiast', 'Rock-Solid Challenger', or 'Tidal Guardian'."},
        dialogue: {
            type: Type.OBJECT,
            properties: {
                preBattle: { type: Type.STRING, description: "A short, confident, or quirky line the trainer says before battle." },
                postWin: { type: Type.STRING, description: "A gracious or informative line the trainer says after the player wins." },
                postLoss: { type: Type.STRING, description: "A slightly boastful or challenging line the trainer says after the player loses." },
            },
            required: ["preBattle", "postWin", "postLoss"],
        },
        monsterTeam: {
            type: Type.ARRAY,
            description: "A themed team of 2 monsters. Generate full monster data for each, matching the trainer's title/theme.",
            items: monsterDataSubSchema
        }
    },
    required: ["name", "title", "dialogue", "monsterTeam"]
};

export const generateRandomNpc = async (): Promise<Trainer> => {
    try {
        // Step 1: Generate trainer data and their monster team's data
        const dataResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a unique, fantasy RPG trainer. The trainer should have a clear theme (e.g., based on an element, a concept like 'speed', or a type of animal) reflected in their title and monster team. The team must have exactly 2 monsters.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: npcDataSchema,
            },
        });

        const trainerDataText = dataResponse.text.trim();
        const trainerData = JSON.parse(trainerDataText);

        // Step 2: Generate trainer sprite
        const spritePrompt = `Vibrant, cartoony avatar of a fantasy RPG trainer named "${trainerData.name}", a renowned "${trainerData.title}". Head and shoulders portrait. Isolated on a simple, dark, atmospheric background. Style: modern RPG game asset, anime-inspired, detailed.`;
        const spriteResponse = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: spritePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });
        const spriteUrl = `data:image/jpeg;base64,${spriteResponse.generatedImages[0].image.imageBytes}`;

        // Step 3: Generate images for each monster in the team
        const monsterPromises = trainerData.monsterTeam.map(async (monsterSubData: any): Promise<Monster> => {
            const imagePrompt = `A vibrant, high-quality digital painting of a fantasy creature named "${monsterSubData.name}". Description: "${monsterSubData.description}". Personality: ${monsterSubData.personality}. The creature is the central focus, isolated on a simple, dark, atmospheric background. Style: modern RPG game asset, detailed, fantasy art.`;
            
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: imagePrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
            const imageUrl = `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`;

            return {
                id: self.crypto.randomUUID(),
                name: monsterSubData.name,
                description: monsterSubData.description,
                personality: monsterSubData.personality,
                hp: monsterSubData.hp,
                maxHp: monsterSubData.hp,
                attack: monsterSubData.attack,
                defense: monsterSubData.defense,
                abilities: monsterSubData.abilities,
                imageUrl: imageUrl,
                level: 1,
                exp: 0,
                expToNextLevel: 100,
            };
        });

        const monsterTeam = await Promise.all(monsterPromises);

        const newTrainer: Trainer = {
            id: self.crypto.randomUUID(),
            name: trainerData.name,
            title: trainerData.title,
            dialogue: trainerData.dialogue,
            spriteUrl: spriteUrl,
            monsterTeam: monsterTeam,
        };

        return newTrainer;

    } catch (error) {
        console.error("Error generating NPC trainer:", error);
        throw new Error("Failed to summon a new challenger.");
    }
};
