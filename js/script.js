
console.log("JS loaded");

const form = document.getElementById("contactForm");

if (form) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const data = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        const button = form.querySelector('button[type="submit"]');
        const successMsg = document.getElementById("successMsg");

        if (!successMsg || !button) {
            console.error("Submit button or success message element not found.");
            return;
        }

        // Validate empty fields
        if (!data.name || !data.email || !data.phone || !data.message) {
            successMsg.innerText = "Please fill in all fields.";
            successMsg.style.color = "red";
            return;
        }

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(data.email)) {
            successMsg.innerText = "Please enter a valid email address.";
            successMsg.style.color = "red";
            return;
        }

        // Disable button while submitting
        button.innerText = "Sending...";
        button.disabled = true;

        successMsg.innerText = "";

        try {
            const response = await fetch("http://localhost:3000/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Server error.");
            }

            if (result.emailSent === false) {
                successMsg.innerText =
                    "Your enquiry was saved, but email notification is temporarily unavailable.";
                successMsg.style.color = "orange";
            } else {
                successMsg.innerText =
                    "Thank you! Your message has been sent successfully.";
                successMsg.style.color = "green";
            }

            form.reset();

        } catch (error) {
            console.error("Contact form error:", error);

            successMsg.innerText =
                error.message || "Failed to send your message. Please try again.";

            successMsg.style.color = "red";

        } finally {
            button.innerText = "Send Message";
            button.disabled = false;
        }
    });
}
