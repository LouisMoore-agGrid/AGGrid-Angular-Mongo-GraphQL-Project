import mongoose from "mongoose";
const Schema = mongoose.Schema;

const winnerSchema = new Schema({
  id: Number,
  athlete: String,
  age: Number,
  country: String,
  year: Number,
  date: String,
  sport: String,
  gold: Number,
  silver: Number,
  bronze: Number,
  total: Number,
});
const OlympicWinner = mongoose.model("OlympicWinner", winnerSchema);
export default OlympicWinner;
