import program from "commander";
import { generateData, computeMissingProbability } from "./data";

program
	.requiredOption("-c, --faction-count <count>", "# of factions per game", parseInt)
	.option("-d, --data-dir <dir>", "Directory to store data files", "data")
	.option("-o, --overwrite-data", "Overwrite existing data files", false)
	.parse(process.argv);

const { factionCount, dataDir, overwriteData } = program;

(async () => {
	try {
		await generateData(dataDir, factionCount, overwriteData);
		const missingProbability = await computeMissingProbability(dataDir, factionCount);
		console.log(`The probability of a faction not being included in a single game is ${(missingProbability * 100).toFixed(1)}%.`);
	} catch (error) {
		console.error(`Error computing probability: ${error.message}\n${error.stack}`);
	}
})();