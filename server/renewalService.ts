// renewalService.ts - Enhanced renewal service for expired subscriptions only
import { pool } from './db.js';

interface RenewalResult {
  success: boolean;
  message: string;
  data?: any;
}

interface UserInfo {
  expiration: string;
  totalbytes: number;
  dlbytes: number;
  ulbytes: number;
  srvid: number;
  enableuser: string;
}

export class RenewalService {
  
  /**
   * Check if user subscription is expired (by date or data usage)
   */
  private async checkExpiry(username: string): Promise<{ expired: boolean, reason: string, userInfo: UserInfo }> {
    try {
      // Get user info from DMA Radius Manager API
      // استخدام متغيرات البيئة للأمان
      const RADIUS_API_USER = process.env.RADIUS_API_USER || 'api';
      const RADIUS_API_PASS = process.env.RADIUS_API_PASS || 'api123';
      const apiUrl = `https://saidawifi.com/radiusmanager/api/sysapi.php?apiuser=${RADIUS_API_USER}&apipass=${RADIUS_API_PASS}&q=get_userdata&username=${encodeURIComponent(username)}`;
      
      const response = await fetch(apiUrl);
      const rawText = await response.text();
      
      let apiData;
      try {
        apiData = JSON.parse(rawText);
      } catch {
        throw new Error('Invalid API response format');
      }
      
      if (apiData[0] !== 0) {
        throw new Error('User not found or API error');
      }
      
      const userData = apiData[1];
      const simuse = apiData.simuse;
      
      const userInfo: UserInfo = {
        expiration: simuse ? apiData.expiry : userData.contractvalid,
        totalbytes: simuse ? apiData.totalbytes : 0,
        dlbytes: simuse ? apiData.dlbytes : 0,
        ulbytes: simuse ? apiData.ulbytes : 0,
        srvid: userData.srvid,
        enableuser: userData.enableuser
      };
      
      // Check if user is disabled
      if (userInfo.enableuser !== '1') {
        return { expired: true, reason: 'User account is disabled', userInfo };
      }
      
      // Check date expiry
      const now = new Date();
      const expiryDate = new Date(userInfo.expiration);
      
      if (expiryDate <= now) {
        return { expired: true, reason: 'Subscription expired by date', userInfo };
      }
      
      // Check data usage expiry
      if (userInfo.totalbytes > 0) {
        const usedBytes = userInfo.dlbytes + userInfo.ulbytes;
        const usagePercentage = (usedBytes / userInfo.totalbytes) * 100;
        
        if (usagePercentage >= 100) {
          return { expired: true, reason: 'Data quota exceeded', userInfo };
        }
        
        // Consider near expiry (>95%) as expired for renewal eligibility
        if (usagePercentage >= 95) {
          return { expired: true, reason: 'Data quota nearly exceeded', userInfo };
        }
      }
      
      return { expired: false, reason: 'Subscription is still active', userInfo };
      
    } catch (error) {
      console.error(`Error checking expiry for user ${username}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Unable to check subscription status: ${errorMessage}`);
    }
  }
  
  /**
   * Get service details by service ID
   */
  private async getServiceDetails(srvid: number) {
    try {
      const [serviceRows]: any = await pool.query(
        `SELECT srvname, groupid, price FROM rm_services WHERE srvid = ? LIMIT 1`,
        [srvid]
      );
      
      if (serviceRows.length > 0) {
        return serviceRows[0];
      }
      
      // Default service mapping if not found in database
      const defaultServices = {
        1: { srvname: '100GB-4M-PPPOE', groupid: 4, trafficcomb: 107374182400, price: 100000 },
        2: { srvname: '300GB-10M-PPPOE', groupid: 4, trafficcomb: 322122547200, price: 275000 },
        3: { srvname: '50GB-4M-PPPOE', groupid: 4, trafficcomb: 53687091200, price: 65000 },
        7: { srvname: '200GB-6M-PPPOE', groupid: 4, trafficcomb: 214748364800, price: 175000 }
      };
      
      return (defaultServices as any)[srvid] || { srvname: 'Unknown Service', groupid: 4, trafficcomb: 107374182400, price: 100000 };
      
    } catch (error) {
      console.error('Error getting service details:', error);
      return { srvname: 'Unknown Service', groupid: 4, trafficcomb: 107374182400, price: 100000 };
    }
  }
  
  /**
   * Renew subscription for expired users only
   */
  async renewExpiredSubscription(username: string): Promise<RenewalResult> {
    try {
      console.log(`🔄 Checking renewal eligibility for user: ${username}`);
      
      // Step 1: Check if subscription is expired
      const { expired, reason, userInfo } = await this.checkExpiry(username);
      
      if (!expired) {
        return {
          success: false,
          message: 'التجديد غير متاح. الاشتراك لا يزال نشطاً'
        };
      }
      
      console.log(`✅ User ${username} is eligible for renewal. Reason: ${reason}`);
      
      // Step 2: Get current service details
      const serviceDetails = await this.getServiceDetails(userInfo.srvid);
      console.log(`📦 Current service: ${serviceDetails.srvname}`);
      
      // Step 3: Calculate new expiry date (30 days from today, not from old expiry)
      const currentDate = new Date();
      const newExpiryDate = new Date(currentDate);
      newExpiryDate.setDate(currentDate.getDate() + 30);
      const formattedExpiry = newExpiryDate.toISOString().slice(0, 19).replace('T', ' ');
      
      console.log(`📅 New expiry date: ${formattedExpiry}`);
      
      // Step 4: Reset data usage and set new expiry via DMA API
      const RADIUS_API_USER = process.env.RADIUS_API_USER || 'api';
      const RADIUS_API_PASS = process.env.RADIUS_API_PASS || 'api123';
      const renewalUrl = `https://saidawifi.com/radiusmanager/api/sysapi.php?apiuser=${RADIUS_API_USER}&apipass=${RADIUS_API_PASS}&q=edit_user&username=${encodeURIComponent(username)}&dlbytes=0&ulbytes=0&expiry=${encodeURIComponent(formattedExpiry)}&enableuser=1`;
      
      const renewalResponse = await fetch(renewalUrl);
      const renewalText = await renewalResponse.text();
      
      console.log(`🔄 Renewal API response: ${renewalText}`);
      
      // Parse API response
      let renewalResult;
      try {
        renewalResult = JSON.parse(renewalText);
      } catch {
        // Handle non-JSON responses
        if (renewalText.includes('[0') || renewalText.includes('"0"')) {
          renewalResult = [0, 'Success'];
        } else {
          throw new Error(`API returned error: ${renewalText}`);
        }
      }
      
      if (renewalResult[0] !== 0) {
        throw new Error(`Renewal failed: ${renewalResult[1] || 'Unknown error'}`);
      }
      
      console.log(`✅ Successfully renewed subscription for ${username}`);
      
      // Step 5: Create unpaid bank transfer invoice (matching admin panel format)
      const invoiceNumber = `INV-${currentDate.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
      
      // Get valid price from service details (ensure it's a reasonable value)
      const servicePrice = serviceDetails.price || 100000;
      const validPrice = Math.min(servicePrice, 1000000); // Max 1 million to avoid irrational values
      
      try {
        const [invoiceResult]: any = await pool.query(`
          INSERT INTO rm_invoices 
          (username, date, paymode, paid, payeddate, service, amount, price, comment, invnum, managername) 
          VALUES (
            ?, NOW(), 2, 0, NULL, ?, ?, ?, CONCAT('مرجع: تحويل بنكي-', CURDATE()), ?, 'system'
          )`, [
          username, serviceDetails.srvname, validPrice, validPrice, invoiceNumber
        ]);
        
        console.log(`💰 Created unpaid invoice: ${invoiceNumber} (ID: ${invoiceResult.insertId})`);
        
      } catch (invoiceError) {
        console.error('Invoice creation failed:', invoiceError);
        // Don't fail the renewal if invoice creation fails
        console.log('⚠️  Renewal successful but invoice creation failed');
      }
      
      return {
        success: true,
        message: 'تم تجديد الاشتراك بنجاح بدون رصيد. يمكنك الآن استخدام الخدمة.',
        data: {
          username,
          service: serviceDetails.srvname,
          expiryDate: formattedExpiry,
          daysAdded: 30,
          invoiceNumber,
          paymentRequired: 'Bank Transfer'
        }
      };
      
    } catch (error) {
      console.error(`❌ Renewal failed for user ${username}:`, error);
      return {
        success: false,
        message: `فشل في التجديد: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const renewalService = new RenewalService();