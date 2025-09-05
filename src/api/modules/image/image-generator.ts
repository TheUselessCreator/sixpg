// Browser-compatible image generation using HTML Canvas API
export class ImageGenerator {
  static async generateImage(width: number, height: number): Promise<string> {
    // Create a canvas element programmatically
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Basic canvas setup
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Return base64 data URL
    return canvas.toDataURL('image/png');
  }
  
  static async createTextImage(text: string, options: {
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
  } = {}): Promise<string> {
    const {
      width = 400,
      height = 200,
      fontSize = 24,
      fontFamily = 'Arial',
      color = '#000000',
      backgroundColor = '#ffffff'
    } = options;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Set text properties
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text
    ctx.fillText(text, width / 2, height / 2);
    
    return canvas.toDataURL('image/png');
  }
}