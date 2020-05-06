import { Faction, FACTIONS } from "./faction";
import { randomBytes } from "crypto";

export type Draft = Faction[];

export function generateRandomDraft(factionsPerGame: number): Draft {
	const draft: Draft = [];
	for (let i = 0; i < factionsPerGame; i++) {
		const index = randomBytes(1).readInt8(0) % FACTIONS.length;
		draft.push(FACTIONS[index]);
	}
	return draft;
}

export type SaveDraft = (draft: Draft) => Promise<void>;

export async function generateAllDrafts(factionsPerGame: number, saveDraft: SaveDraft) {
	const totalNumberOfGames = computeNumberOfGames(factionsPerGame);

	// start with 0,1,...,n-2,n-1
	const factions = [...Array(factionsPerGame).keys()];
	
	let n = 1;
	let foundEnd = false;
	for (; n <= totalNumberOfGames; n++) {
		await saveDraft(selectFactions(factions));
		let resetIndex = findResetIndex(factions);
		if (resetIndex >= factions.length) {
			// no reset
			incrementLastFaction(factions);
		} else if (resetIndex > -1) {
			// on reset, each reset faction should be one greater than the previous
			// increment the first reset from itself
			incrementFaction(factions, resetIndex);
			// then increment the following from the previous
			for (let i = resetIndex + 1; i < factions.length; i++) {
				factions[i] = factions[i-1];
				incrementFaction(factions, i);
			}
		} else {
			foundEnd = true;
			// we're done
			break;
		}
	}
	if (n < totalNumberOfGames) {
		throw new Error(`Reached the expected end state but only generated ${n} out of an expected ${totalNumberOfGames} number of games`);
	}
	if (!foundEnd) {
		throw new Error(`Generated the expexted number of games (${totalNumberOfGames}) but did not reach the expected end state`);
	}
}

function computeNumberOfGames(factionsPerGame: number): number {
	// COULD I have used a math library to do the 17 choose 7 math? sure
	// SHOULD I have? probably
	// WHY didn't I? it's was faster to write the code below than to choose a package from npm
	// BUT what about the time it took to write these comments? shut up
	const n = factorial(FACTIONS.length);
	const r = factorial(factionsPerGame);
	const d = factorial(FACTIONS.length - factionsPerGame);
	return n / (r * d);
}

function factorial(n: number): number {
	let f = 1;
	for (let i = n; i > 1; i--) {
		f *= i;
	}
	return f;
}

function incrementLastFaction(factions: number[]) {
	incrementFaction(factions, factions.length - 1);
}

function incrementFaction(factions: number[], index: number) {
	let currentFaction = factions[index];
	currentFaction++;
	overflowCheck(currentFaction);
	factions[index] = currentFaction;
}

function selectFactions(factionIndexes: number[]): Faction[] {
	return factionIndexes.map(i => FACTIONS[i]);
}

function findResetIndex(factions: number[]): number {
	let resetIndex = factions.length;
	for (let i = factions.length - 1; i >= 0; i--) {
		if (atEnd(factions, i)) {
			// if we are at the end at this index we MAY be at the end at the previous index so keep looking
			resetIndex = i - 1;
		} else {
			break;
		}
	}
	return resetIndex;
}

function atEnd(factions: number[], index: number): boolean {
	const currentFaction = factions[index];
	let offset = factions.length - 1 - index;
	/**
	 * 1:	1	->	n-r
	 * 2:	2	->	n-r+1
	 * r-1:	r-1	->	n-1
	 * r:	r	->	n
	 */
	return (currentFaction + offset) === (FACTIONS.length - 1);
}

function overflowCheck(faction: number) {
	if (faction >= FACTIONS.length) {
		throw new Error(`Faction overflow`);
	}
}