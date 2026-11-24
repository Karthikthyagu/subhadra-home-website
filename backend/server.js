
require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const sendMail = require("./mailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Check required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Missing EMAIL_USER or EMAIL_PASS in .env");
    process.exit(1);
}

// MongoDB connection
const MONGO_URI =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/oldagehome";

// Contact schema
const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 254
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000
    }
}, {
    timestamps: true
});

const Contact = mongoose.model("Contact", ContactSchema);

// Home route
app.get("/", (req, res) => {
    res.send("Subhadra Home API is running successfully.");
});

// Contact form API
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate input types and required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof message !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !phone.trim() ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields correctly."
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Save enquiry to MongoDB
        const newContact = new Contact({
            name,
            email,
            phone,
            message
        });

        await newContact.save();

        console.log("CONTACT SAVED:", newContact._id);

        // Send email notification
        try {
            const emailInfo = await sendMail({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                message: message.trim()
            });

            console.log("EMAIL SENT:", emailInfo.messageId);

            return res.status(201).json({
                success: true,
                emailSent: true,
                message: "Your enquiry has been submitted successfully."
            });

        } catch (emailError) {
            console.error("EMAIL DELIVERY FAILED:", emailError);

            return res.status(201).json({
                success: true,
                emailSent: false,
                message: "Your enquiry has been saved. Email notification is temporarily unavailable."
            });
        }

    } catch (error) {
        console.error("CONTACT FORM ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit your enquiry. Please try again."
        });
    }
});

// Development-only email testing route
if (process.env.NODE_ENV !== "production") {
    app.get("/test-email", async (req, res) => {
        try {
            const info = await sendMail({
                name: "Subhadra Home Test",
                email: process.env.EMAIL_USER,
                phone: "0000000000",
                message: "Testing the Subhadra Home email system."
            });

            console.log("TEST EMAIL SENT:", info.messageId);

            res.json({
                success: true,
                message: "Test email sent successfully."
            });

        } catch (error) {
            console.error("TEST EMAIL FAILED:", error);

            res.status(500).json({
                success: false,
                message: "Test email failed."
            });
        }
    });
}

// Connect MongoDB and start server
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(`SERVER RUNNING ON PORT ${PORT}`);
            console.log(`Website API: http://localhost:${PORT}`);

            if (process.env.NODE_ENV !== "production") {
                console.log(`Email test: http://localhost:${PORT}/test-email`);
            }
        });
    })
    .catch(error => {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    });
