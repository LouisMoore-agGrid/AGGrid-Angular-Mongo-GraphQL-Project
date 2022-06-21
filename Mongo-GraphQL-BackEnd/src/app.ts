import express from "express";
import { graphqlHTTP } from "express-graphql";
import schema from "./schema";
import cors from "cors";
import mongoose from "mongoose";

const app = express();

const allowedOrigins = ["http://localhost:4200"];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
};
app.use(cors(options));

mongoose.connect(
  "mongodb+srv://<Username>:<Password>@cluster0.fexoh.mongodb.net/"
);

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.listen(5000, () => {
  console.log("Listening on port 5000");
});
