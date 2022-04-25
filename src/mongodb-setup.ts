// This is only for demo purposes
// optimization is required
import express from "express";
import fs from "fs";
import mongodb from "mongodb";
import mongoose from "mongoose";

const app = express();

const url = "mongodb://user:password@db:27017";

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/init-video", async (req, res) => {
  const client = await mongodb.MongoClient.connect(url);
  const db = client.db("vidoes");
  const bucket = new mongodb.GridFSBucket(db);
  const videoUploadStream = bucket.openUploadStream("bigbuck");
  const videoReadStream = fs.createReadStream(__dirname + "/bigbuck.mp4");

  // Uploading video to our database
  videoReadStream.pipe(videoUploadStream);
  res.status(200).send("Done...");
});

app.get("/mongo-video", async (req, res) => {
  const client = await mongodb.MongoClient.connect(url);
  const range = req.headers.range;

  if (!range) return res.status(400).send("Requires range header");

  const db = client.db("videos");
  // GridFs collection
  // This is just a metadata to our video file
  const video = await db.collection("fs.files").findOne({});
  if (!video) return res.status(404).send("No video uploaded!");

  const videoSize = video.length;
  const start = Number(range.replace(/\D/g, ""));
  const end = videoSize - 1;

  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  const bucket = new mongodb.GridFSBucket(db);
  const downloadStream = bucket.openDownloadStreamByName("bigbuck", {
    start,
    end,
    revision: 0, // Learn about this feature
  });

  downloadStream.pipe(res);
});
