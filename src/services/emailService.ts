export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export const emailService = {
  /**
   * Sends an email using the backend Nodemailer API.
   * Make sure your SMTP credentials are set in the environment variables.
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Default to the service alias for automated notifications, 
      // but allow users to reply to the support email.
      const payload = {
        from: '"ShelterBee Support" <support@shelterbee.com>',
        replyTo: 'support@shelterbee.com',
        ...options
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      return data;
    } catch (error: any) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }
};
