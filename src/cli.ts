import program from "commander";
import { generateData, computeMissingProbability } from "./data";
import { generateRandomDraft } from "./draft";

program
	.requiredOption("-c, --faction-count <count>", "# of factions per game", parseInt)
	.option("-d, --data-dir <dir>", "Directory to store data files", "data")
	.option("-o, --overwrite-data", "Overwrite existing data files", false)
	.option("-c, --create-tournament", "Create a tournament draft", false)
	.option("-g, --game-count <count>", "Number of games to create for the tournament", parseInt)
	.parse(process.argv);

const { factionCount, dataDir, overwriteData, createTournament, gameCount } = program;

(async () => {
	try {
		if (createTournament) {
			if (gameCount < 1) {
				console.log(`To create a tournament there needs to be at least one game`);
				return;
			}
			for (let i = 1; i <= gameCount; i++) {
				const draft = generateRandomDraft(factionCount);
				console.log(`Game ${i}: ${draft.join(", ")}`);
			}
		} else {
			await generateData(dataDir, factionCount, overwriteData);
			const missingProbability = await computeMissingProbability(dataDir, factionCount);
			console.log(`The probability of a faction not being included in a single game is ${(missingProbability * 100).toFixed(1)}%.`);
		}
	} catch (error) {
		console.error(`Error computing probability: ${error.message}\n${error.stack}`);
	}
})();