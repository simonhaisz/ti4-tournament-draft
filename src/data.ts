import { existsSync, unlinkSync, promises as fs, createReadStream, ensureDirSync } from "fs-extra";
import { join } from "path";
import { Draft, generateAllDrafts } from "./draft";
import { createInterface } from "readline";
import { Faction } from "./faction";

export async function generateData(dataDir: string, numberOfFactions: number, overwrite: boolean) {
	const file = createDataFilePath(dataDir, numberOfFactions);
	if (existsSync(file)) {
		if (overwrite) {
			unlinkSync(file);
		} else {
			console.log(`Data file '${file}' already exists, skipping generation`);
			return;
		}
	}
	ensureDirSync(dataDir);
	const saveDraft = async (draft: Draft): Promise<void> => {
		try {
			await fs.appendFile(file, draft.join(",") + "\n", { encoding: "utf8" });
		} catch (error) {
			throw new Error(`Error appending to file '${file}': ${error.message}\n${error.stack}`);
		}
	};

	await generateAllDrafts(numberOfFactions, saveDraft);
}

export async function computeMissingProbability(dataDir: string, numberOfFactions: number, faction: Faction = Faction.Arborec): Promise<number> {
	let numberOfGames = 0;
	let factionFoundCount = 0;
	const handleLine = line => {
		numberOfGames++;
		const factions = line.split(",");
		if (factions.includes(faction)) {
			factionFoundCount++;
		}	
	}
	await processData(dataDir, numberOfFactions, handleLine);
	return 1 - (factionFoundCount / numberOfGames);
}

function processData(dataDir: string, numberOfFactions: number, lineCallback: (line: string) => void): Promise<void> {
	const file = createDataFilePath(dataDir, numberOfFactions);
	if (!existsSync(file)) {
		throw new Error(`Data file '${file}' does not exist`);
	}

	return new Promise((resolve, reject) => {
        const reader = createInterface(createReadStream(file))
        reader.on("line", line => {
			lineCallback(line);
        });
        reader.on("close", () => {
            resolve();
        });
        reader.on("error", error => {
            reject(error);
        });
    });
}


function createDataFilePath(dataDir: string, numberOfFactions: number): string {
	const fileName = `${numberOfFactions}-factions.data`;
	return join(dataDir, fileName);
}