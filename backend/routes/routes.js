const { Router } = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const router = Router();
const ftp = require("basic-ftp");
const multer = require("multer");

const upload = multer({ dest: "../uploads/" });

router.post("/register", async (req, res) => {
  let email = req.body.email;
  let name = req.body.name;
  let password = req.body.password;

  const record = await User.findOne({ email: email });

  if (record) {
    return res.status(400).send({ message: "Email already in use." });
  } else {
    const user = new User({
      name: name,
      email: email,
      password: password,
    });

    const result = await user.save();

    const { _id } = await result.toJSON();

    const token = jwt.sign({ _id: _id }, "secret");

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.send({
      message: "successful registration!",
    });
  }
});

router.post("/login", async (req, res) => {
  const record = await User.findOne({ email: req.body.email });

  if (!record) {
    return res.status(404).send({ message: "Email doesnt exist" });
  }
  if (req.body.password != record.password) {
    return res.status(400).send({ message: "Password Incorrect" });
  }
  const token = jwt.sign({ _id: record._id }, "secret");

  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.send({
    message: "successful login!",
  });
});

router.get("/user", async (req, res) => {
  try {
    const cookie = req.cookies["jwt"];
    const claims = jwt.verify(cookie, "secret");
    if (!claims) {
      return res.status(401).send({
        message: "not signed in",
      });
    }

    const user = await User.findOne({ _id: claims._id });

    const { password, ...data } = await user.toJSON();

    res.send(data);
  } catch (err) {
    return res.status(401).send({
      message: "not signed in",
    });
  }
});

router.post("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });

  res.send({
    message: "success",
  });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: "192.168.10.1",
      user: "ftpuser",
      password: "a",
      secure: false,
    });

    const filePath = req.file.path;

    await client.uploadFrom(filePath, "/files/" + req.file.originalname);

    console.log("File uploaded successfully");
    res.status(200).send("File uploaded successfully");
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Error occurred during file upload");
  } finally {
    client.close();
  }
});

router.get("/files", async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: "192.168.10.1",
      user: "ftpuser",
      password: "a",
      secure: false,
    });

    const files = await client.list("/files");

    res.status(200).json(files);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Error occurred while fetching files");
  } finally {
    client.close();
  }
});

router.get("/download/:fileName", async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: "192.168.10.1",
      user: "ftpuser",
      password: "a",
      secure: false,
    });

    res.setHeader(
      "Content-disposition",
      `attachment; filename=${req.params.fileName}`
    );

    await client.downloadTo(res, "/files/" + req.params.fileName);

    console.log("File downloaded successfully");
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Error occurred during file download");
  } finally {
    client.close();
  }
});

module.exports = router;
