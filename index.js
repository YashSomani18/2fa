const express = require('express');
const nodemailer = require('nodemailer');
const otplib = require('otplib');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User.model.js'); 

const dotenv = require('dotenv');
dotenv.config();


const app = express();
app.use(bodyParser.json());
const port = 3000;


mongoose.connect(process.env.MONGODB_URI);



otplib.authenticator.options = {
  step: parseInt(process.env.TIME, 10),
  window: parseInt(process.env.WINDOW, 10),
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.HOST_EMAILID,
    pass: process.env.HOST_PASSKEY,
  },
});

app.post('/enroll', async (req, res) => {
  const { email } = req.body;
  try {
    const secret = otplib.authenticator.generateSecret();
    const otpCode = otplib.authenticator.generate(secret);

    const mailOptions = {
      from: `2FA Service <${process.env.HOST_EMAILID}>`,
      to: email,
      subject: 'Your 2FA Enrollment Code',
      text: `Please use this code ${otpCode} to complete your 2FA enrollment. The code will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    // Save the user's email and secret in the database
    const user = new User({ email, secret });
    await user.save();

    res.status(200).json({ message: 'Enrollment code sent successfully.' });
  } catch (error) {
    console.error(`Error in enrollment: ${error.message}`);
    res.status(500).json({ message: 'An error occurred during enrollment.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(403).json({ message: 'User not found.' });
    }

    const isValid = otplib.authenticator.verify({
      token: code,
      secret: user.secret,
    });

    if (isValid) {
      res.status(200).json({ message: 'Authentication successful!' });
    } else {
      res.status(401).json({ message: 'Invalid OTP code.' });
    }
  } catch (error) {
    console.error(`Error during login: ${error.message}`);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
