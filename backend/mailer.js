
const nodemailer = require("nodemailer");

// Create Gmail transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s/g, "")
    }
});

// Send contact form enquiry
const sendMail = async (data) => {
    // Validate required fields
    if (!data || !data.name || !data.email || !data.phone || !data.message) {
        throw new Error("All contact form fields are required.");
    }

    // Verify email configuration
    await transporter.verify();

    // Send enquiry email
    const info = await transporter.sendMail({
        from: `"Subhadra Home Website" <${process.env.EMAIL_USER}>`,
        to: "thesubhatrahome@gmail.com",
        replyTo: data.email,
        subject: "New Enquiry - Subhadra Home",

        text: `
New Contact Form Enquiry

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

Message:
${data.message}
        `
    });

    console.log("Email sent successfully:", info.messageId);

    return info;
};

module.exports = sendMail;
