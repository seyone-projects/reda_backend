import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import mime from "mime-types";

// Config File
import {
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
  awsBucketName,
} from "../config.js";

/**
 * Update AWS Config
 */

AWS.config.update({
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
});

const s3 = new AWS.S3();

/**
 * Get Public Image Url
 *
 * @param {*} filePath
 * @returns
 */

export function getPublicImageUrl(filePath) {
  return `https://${awsBucketName}.s3.${awsRegion}.amazonaws.com/${filePath}`;
}

/**
 * Upload Base64 To File
 *
 * @param base64
 * @param newPath
 * @param callback
 */

export function uploadBase64File(base64, newPath, callback) {
  const buffer = Buffer.from(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const params = {
    Bucket: awsBucketName,
    Key: newPath,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/png",
    ACL: "public-read",
  };

  const extension = path.extname(newPath);

  const newFilePath = `${path.basename(newPath, extension)}${extension}`;

  params.Key = newFilePath;

  s3.putObject(params, (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, newPath);
  });
}

// Use mime-types package to get content types from extensions

export function uploadDocstoAws(base64, newPath, callback) {
  const base64Data = base64.split(",")[1];
  const buffer = Buffer.from(base64Data, "base64");

  // Detect the file extension and content type
  const extension = path.extname(newPath);
  const contentType = mime.lookup(extension) || "application/octet-stream";

  const params = {
    Bucket: awsBucketName,
    Key: newPath,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: contentType,
    ACL: "public-read",
  };

  s3.putObject(params, (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, newPath);
  });
}

// use as array if single file
export const uploadFilesAndGenerateUrls = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file) => {
    if (!file) return null;

    try {
      const fileName = file.originalname;
      const fileType = file.mimetype;
      const newPath = `document/${Date.now()}_${fileName}`;

      await uploadFilestoAws(file, newPath);

      const documentUrl = getPublicImageUrl(newPath);

      return {
        documentName: fileName,
        documentPath: documentUrl,
        documentType: fileType,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error(`Error uploading file ${file.originalname}:`, error);
      return null;
    }
  });

  // Wait for all uploads to complete
  const uploadedFiles = await Promise.all(uploadPromises);

  // Filter out any failed uploads
  return uploadedFiles.filter((file) => file !== null);
};

// export function uploadFilestoAws(file, newPath, callback) {
//   const buffer = file.buffer;

//   // Detect the file extension and content type
//   const extension = path.extname(newPath);
//   const contentType = mime.lookup(extension) || "application/octet-stream";

//   const params = {
//     Bucket: awsBucketName,
//     Key: newPath,
//     Body: buffer,
//     ContentType: contentType,
//     ACL: "public-read",
//   };

//   s3.putObject(params, (err) => {
//     if (err) {
//       return callback(err);
//     }
//     return callback(null, newPath);
//   });
// }

export async function uploadFilestoAws(file, newPath) {
  try {
    const buffer = file.buffer;

    const extension = path.extname(newPath);
    const contentType = mime.lookup(extension) || "application/octet-stream";

    const params = {
      Bucket: awsBucketName,
      Key: newPath,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    };

    await s3.putObject(params).promise();
    return newPath;
  } catch (err) {
    throw new Error(`Error uploading file to AWS: ${err.message}`);
  }
}

export async function uploadOneFile(file) {
  if (file && file.fileName && file.fileData) {
    try {
      const base64Data = file.fileData;
      const fileType = base64Data.split(";")[0].split("/")[1];
      const newFileName = file.fileName;
      const newFilePath = newFileName;

      return new Promise((resolve, reject) => {
        uploadBase64File(base64Data, newFilePath, (err, mediaPath) => {
          if (err) {
            return reject(err);
          }

          resolve({
            documentName: newFileName,
            documentPath: getPublicImageUrl(mediaPath),
            documentType: fileType,
            createdAt: new Date(),
          });
        });
      });
    } catch (error) {
      throw new Error("File upload failed: " + error.message);
    }
  } else {
    throw new Error("Missing file name or data");
  }
}

export async function uploadSingleFile(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid filePath received.");
  }

  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        return reject(new Error(`Error checking file stats: ${err.message}`));
      }

      if (!stats.isFile()) {
        return reject(new Error(`The path is not a valid file: ${filePath}`));
      }

      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath);

      const extension = path.extname(filePath);
      const contentType = mime.lookup(extension) || "application/octet-stream";

      const params = {
        Bucket: awsBucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: "image/png",
        ContentDisposition: "inline", // Ensure the file is displayed inline in the browser
        ACL: "public-read",
      };

      s3.putObject(params, (err, data) => {
        if (err) {
          return reject(
            new Error(`Error uploading file to S3: ${err.message}`)
          );
        }

        const documentPath = getPublicImageUrl(fileName);
        resolve({
          documentPath: documentPath,
          documentName: fileName,
          documentType: path.extname(fileName),
        });
      });
    });
  });
}

export async function deleteImageFromS3(filePath) {
  try {
    // Decode special characters in file path
    const fileKey = decodeURIComponent(filePath.split(".com/")[1]);

    if (!fileKey) {
      throw new Error("Invalid file path format.");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileKey,
    };

    // Delete object
    await s3_delete.deleteObject(params).promise();

    // Verify deletion
    try {
      await s3_delete.headObject(params).promise();

      return false;
    } catch (err) {
      if (err.code === "NotFound") {
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return false;
  }
}

export async function deleteFileFromS3(filePath) {
  try {
    const fileKey = decodeURIComponent(filePath.split(".com/")[1]);

    if (!fileKey) {
      throw new Error("Invalid file path format.");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileKey,
    };

    // Attempt to delete the file
    await s3_delete.deleteObject(params).promise();

    // Verify deletion
    try {
      await s3_delete.headObject(params).promise();

      return false;
    } catch (err) {
      if (err.code === "NotFound") {
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return false;
  }
}
