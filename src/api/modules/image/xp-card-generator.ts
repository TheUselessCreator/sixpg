import { ImageGenerator } from './image-generator';

export class XPCardGenerator {
  static async generateXPCard(userData: {
    username: string;
    level: number;
    xp: number;
    xpToNext: number;
    rank?: number;
    avatarUrl?: string;
  }): Promise<string> {
    const { username, level, xp, xpToNext, rank } = userData;
    
    // For now, create a simple text-based XP card
    // In a full implementation, you'd create a more sophisticated design
    const cardText = `${username} - Level ${level}\nXP: ${xp}/${xpToNext}${rank ? `\nRank: #${rank}` : ''}`;
    
    return await ImageGenerator.createTextImage(cardText, {
      width: 600,
      height: 200,
      fontSize: 20,
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
      backgroundColor: '#f0f0f0'
    });
  }
  
  static async generateRankCard(userData: {
    username: string;
    level: number;
    xp: number;
    totalXP: number;
    rank: number;
    avatarUrl?: string;
  }): Promise<string> {
    const { username, level, xp, totalXP, rank } = userData;
    
    const cardText = `Rank #${rank}\n${username}\nLevel ${level}\nTotal XP: ${totalXP}`;
    
    return await ImageGenerator.createTextImage(cardText, {
      width: 500,
      height: 150,
      fontSize: 18,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: '#7289da'
    });
  }
}