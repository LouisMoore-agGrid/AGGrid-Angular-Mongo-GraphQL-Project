import mongoose from "mongoose";
import initOlympicWinnerCollection from "./init";

mongoose.connect(
  "mongodb+srv://<Username>:<Password>@cluster0.fexoh.mongodb.net/"
);

mongoose.connection.once("open", () => {
  initOlympicWinnerCollection().then(() => {
    process.exit(1);
  });
});
