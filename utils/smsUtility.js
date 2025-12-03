import axios from "axios";

export async function sendSMS(msg, mobile) {
  const mobileStr = String(mobile).trim();

  if (!msg || msg.length > 19) {
    console.warn("Skipped SMS: Message must be 1–19 characters long.");
    return;
  }

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobileStr)) {
    console.warn("Skipped SMS: Invalid mobile number.");
    return;
  }

  const formattedMobile = `+91${mobileStr}`;

  try {
    await axios.post("https://your-sms-provider.com/api/send", {
      to: formattedMobile,
      message: msg,
    });

    console.log(`SMS sent successfully to ${formattedMobile}`);
  } catch (error) {
    console.error("SMS API Error:", error.message);
  }
}
