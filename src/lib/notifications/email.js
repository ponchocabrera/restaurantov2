import nodemailer from 'nodemailer';

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send zone update notification email
 */
export async function sendZoneUpdateEmail(email, restaurantName, changes) {
  let subject = `Zone Update for ${restaurantName}`;
  let changesList = [];
  
  if (changes.ratingChanged) {
    const direction = changes.newRating > changes.oldRating ? 'increased' : 'decreased';
    changesList.push(`Rating has ${direction} from ${changes.oldRating} to ${changes.newRating}`);
  }
  
  if (changes.rankChanged) {
    const direction = changes.newRank < changes.oldRank ? 'improved' : 'dropped';
    changesList.push(`Competitive position has ${direction} from #${changes.oldRank} to #${changes.newRank}`);
  }
  
  if (changes.areaInsightsChanged) {
    changesList.push('New trends have been detected in your area');
  }
  
  if (changesList.length > 0) {
    subject = `${changesList[0]} for ${restaurantName}`;
  }
  
  const mailOptions = {
    from: `"Restaurant AI" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Zone Update for ${restaurantName}</h2>
        
        <p>We've detected some changes in your restaurant's zone:</p>
        
        <ul>
          ${changesList.map(change => `<li>${change}</li>`).join('')}
        </ul>
        
        <h3>Area Trends</h3>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${changes.areaInsights.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
        
        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/restaurant-insights" style="background-color: #4B50B6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
            View Full Details
          </a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated notification from your Restaurant AI assistant.
        </p>
      </div>
    `,
  };
  
  return transporter.sendMail(mailOptions);
} 