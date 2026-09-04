import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const TARGET_HEIGHT = 150;
const logoDir = path.join(process.cwd(), 'public/images/logo');

async function processLogos() {
  try {
    const files = await fs.readdir(logoDir);
    
    for (const file of files) {
      // Skip if it's already a resized png
      if (file.endsWith('_resized.png')) continue;
      
      // If it's the original file, we process it
      if (file.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
        const filePath = path.join(logoDir, file);
        const parsed = path.parse(file);
        
        // We will output to the exact same name but with .png
        // If the original was already .png, we save to a temporary name first
        const newFileName = `${parsed.name}_resized.png`;
        const newFilePath = path.join(logoDir, newFileName);
        
        console.log(`Processing ${file} -> ${newFileName}...`);
        
        await sharp(filePath)
          .resize({ height: TARGET_HEIGHT })
          .png()
          .toFile(newFilePath);
      }
    }
    console.log('Finished resizing all logos.');
  } catch (error) {
    console.error('Error processing logos:', error);
  }
}

processLogos();
