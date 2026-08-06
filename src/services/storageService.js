import fs from "fs/promises";
import path from "path";

/**
 * Automatically creates a dedicated storage folder for a doctor.
 * @param {string} doctorId - The unique ID of the doctor
 * @returns {Promise<string>} The path to the created folder
 */
export const createDoctorFolder = async (doctorId) => {
  try {
    // We create a folder in the backend/uploads/doctors directory
    const folderPath = path.join(process.cwd(), "uploads", "doctors", String(doctorId));
    
    // recursive: true ensures parent folders are created if they don't exist
    await fs.mkdir(folderPath, { recursive: true });
    
    // We can also create subfolders for specific types of data if needed
    await fs.mkdir(path.join(folderPath, "prescriptions"), { recursive: true });
    await fs.mkdir(path.join(folderPath, "reports"), { recursive: true });
    
    console.log(`Successfully created storage folders for doctor: ${doctorId}`);
    return folderPath;
  } catch (error) {
    console.error(`Error creating folder for doctor ${doctorId}:`, error);
    throw new Error("Failed to create doctor storage folder");
  }
};
