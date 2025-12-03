import * as XLSX from "xlsx";
import moment from "moment";
// import { sendEMail } from "../constants/mailservices.js";

export const ValidateObj = (object, schema) => {
  return new Promise((resolve, reject) => {
    const validate = (object, schema) =>
      Object.keys(schema)
        .filter((key) => !schema[key](object[key]))
        .map((key) => new Error(`Required ${key} and must be valid.`));

    const errors = validate(object, schema);

    if (errors.length > 0) {
      for (const { message } of errors) {
        reject({ message: message, status: false });
      }
    } else {
      resolve(true);
    }
  });
};

export const sendUnpaidEmail = async (
  userName,
  userEmail,
  associationName,
  date
) => {
  try {
    var currentDate = moment();
    currentDate.month(moment(date, "YYYY-MM").month());
    currentDate.year(moment(date, "YYYY-MM").year());

    var formattedDate = currentDate.format("DD/MM/YYYY HH:mm");

    const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Society ${associationName} for the ${formattedDate} - Unpaid</title>
            </head>
            <body>
                Hi ${userName},
                <p>Thanks for being part of the society, we noticed that the society dues for the ${formattedDate} seem unpaid. Kindly pay at the earliest to avoid late fee charges.</p>
     
        
                <br/>
                <p>Regards,</p>
                <p>Admin<br>${associationName}</p>
            </body>
            </html>
        `;

    const subject = `Society ${associationName} for the ${formattedDate} - Unpaid`;

    // const emailData = await sendEMail(subject, userEmail, emailContent);
    return emailData;
  } catch (error) {
    // throw new Error('Error sending email', error);
    console.log("Error sending email", error);
  }
};


export function excelToJson(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return jsonData;
}
