import express from "express";
import fs from "fs";

const app = express();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/video", (req, res) => {
  // range header is required,
  // otherwise we cannot tell client
  // which part of the video we want to send back
  const range = req.headers.range;
  if (!range) res.status(400).send("Require range header");

  const videoPath = __dirname + "/" + "bigbuck.mp4";
  // get the size of the video
  const videoSize = fs.statSync(videoPath).size;

  // Parse Range
  // Example: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  // replacing all the non-digit characters
  const start = Number(range?.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // + 1 because of zero based
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // 206 => partial content
  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(videoPath, { start, end });

  videoStream.pipe(res);
});

app.listen(4000, () =>
  console.log(`Server is listening on http://localhost:4000`)
);
