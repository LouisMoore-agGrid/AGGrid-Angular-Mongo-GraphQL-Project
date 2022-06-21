import OlympicWinner from "./models/olympicWinner.js";
import data from "./data.json";

function initOlympicWinnerCollection(): Promise<void | any[]> {
  return OlympicWinner.collection.drop().then(() => {
    return OlympicWinner.insertMany(data.olympicWinners);
  });
}

export default initOlympicWinnerCollection;
