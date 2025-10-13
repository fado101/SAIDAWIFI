// db.ts - Database connection and utilities for DMA Radius Manager
import mysql from "mysql2/promise";

// إعداد pool الاتصال بقاعدة البيانات DMA Radius Manager
export const pool = mysql.createPool({
  host: '108.181.215.206',
  user: 'radius',
  password: 'radius123',
  database: 'radius',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// دالة التحقق من صحة بيانات المستخدم (اسم المستخدم وكلمة السر)
export async function validateUserCredentials(username: string, password: string): Promise<boolean> {
  try {
    console.log(`🔐 Validating credentials for user: ${username}`);

    // فحص كلمة السر من جدول radcheck
    const [passwordRows]: any = await pool.query(
      `SELECT value FROM radcheck WHERE username = ? AND attribute = 'Cleartext-Password'`,
      [username]
    );

    if (passwordRows.length === 0) {
      console.log(`❌ User ${username} not found in radcheck table`);
      return false;
    }

    const storedPassword = passwordRows[0].value;
    console.log(`🔍 Found stored password for user ${username}`);

    // مقارنة كلمة السر
    const isValidPassword = (password === storedPassword);

    if (isValidPassword) {
      console.log(`✅ Password validation successful for user ${username}`);

      // التحقق من وجود المستخدم في جدول rm_users أيضاً
      const [userRows]: any = await pool.query(
        `SELECT username, firstname, expiration FROM rm_users WHERE username = ?`,
        [username]
      );

      if (userRows.length > 0) {
        console.log(`✅ User ${username} found in rm_users table`);
        return true;
      } else {
        console.log(`⚠️ User ${username} not found in rm_users table`);
        return false;
      }
    } else {
      console.log(`❌ Password validation failed for user ${username}`);
      return false;
    }
  } catch (error) {
    console.error('Database error in validateUserCredentials:', error);
    return false;
  }
}

// دالة جلب بيانات خدمة من rm_services
export async function getServiceData(serviceName: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT srvid, srvname, combquota, inittimeexp, unitprice FROM rm_services WHERE srvname = ?`,
      [serviceName]
    );

    if (rows.length === 0) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    return {
      srvid: rows[0].srvid,
      srvname: rows[0].srvname,
      comblimit: rows[0].combquota, // Map to expected field name
      validity: rows[0].inittimeexp,  // Map to expected field name
      price: rows[0].unitprice       // Map to expected field name
    };
  } catch (error) {
    console.error('Database error in getServiceData:', error);
    throw error;
  }
}

// دالة إنشاء فاتورة طلب باقة جديدة
export async function createPackageRequestInvoice(username: string, serviceName: string, manager = 'system') {
  try {
    // جلب بيانات الخدمة
    const serviceData = await getServiceData(serviceName);

    // حساب تاريخ الانتهاء
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(serviceData.validity));
    const expiration = expirationDate.toISOString().slice(0, 10); // YYYY-MM-DD format

    // إنشاء فاتورة غير مدفوعة مع paymode = 2 (تحويل بنكي)
    const [result]: any = await pool.query(`
      INSERT INTO rm_invoices 
      (managername, username, date, service, comblimit, days, expiration, captotal, capdate, invtype, paymode, paid, price, balance)
      VALUES
      (?, ?, NOW(), ?, ?, ?, ?, 1, 1, 0, 2, 0, ?, ?)`, 
      [manager, username, serviceName, serviceData.comblimit, serviceData.validity, expiration, serviceData.price, serviceData.price]
    );

    console.log(`✅ Created package request invoice for ${username}:`);
    console.log(`   - Invoice ID: ${result.insertId}`);
    console.log(`   - Service: ${serviceName}`);
    console.log(`   - Price: ${serviceData.price}`);
    console.log(`   - Payment Mode: 2 (Bank Transfer)`);
    console.log(`   - Status: Unpaid (paid=0)`);
    console.log(`   - Expiration: ${expiration}`);

    return {
      invoiceId: result.insertId,
      serviceData,
      expiration
    };
  } catch (error) {
    console.error('Database error in createPackageRequestInvoice:', error);
    throw error;
  }
}

// دالة تفعيل الباقة للمستخدم (اختيارية)
export async function activatePackageForUser(username: string, serviceName: string) {
  try {
    const serviceData = await getServiceData(serviceName);

    // حساب تاريخ الانتهاء
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(serviceData.validity));
    const expiration = expirationDate.toISOString().slice(0, 19).replace('T', ' '); // MySQL datetime format

    // تحديث بيانات المستخدم
    const [result]: any = await pool.query(`
      UPDATE rm_users 
      SET srvid = ?, comblimit = ?, expiration = ? 
      WHERE username = ?`,
      [serviceData.srvid, serviceData.comblimit, expiration, username]
    );

    console.log(`✅ Activated package for ${username}:`);
    console.log(`   - Service ID: ${serviceData.srvid}`);
    console.log(`   - Data Limit: ${serviceData.comblimit} bytes`);
    console.log(`   - Expiration: ${expiration}`);
    console.log(`   - Rows affected: ${result.affectedRows}`);

    return {
      success: result.affectedRows > 0,
      serviceData: { srvid: serviceData.srvid, comblimit: serviceData.comblimit, expiration }
    };
  } catch (error) {
    console.error('Database error in activatePackageForUser:', error);
    throw error;
  }
}

// دالة جلب فواتير مستخدم حسب username
export async function getUserInvoices(username: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, invnum, service, date, price, amount, paid, paymode, managername, comment, remark
       FROM rm_invoices
       WHERE username = ?
       ORDER BY id DESC`, 
      [username]
    );

    // إضافة تفاصيل إضافية لكل فاتورة
    const enhancedInvoices = rows.map((invoice: any) => {
      const paidDate = new Date(invoice.paid);
      const isUnpaid = paidDate < new Date('1900-01-01');

      console.log(`Invoice ${invoice.id}: paid=${invoice.paid}, isUnpaid=${isUnpaid}, price=${invoice.price}`);

      return {
        ...invoice,
        isUnpaid,
        statusText: isUnpaid ? 'غير مدفوعة' : 'مدفوعة'
      };
    });

    return enhancedInvoices; // مصفوفة الفواتير
  } catch (error) {
    console.error('Database error in getUserInvoices:', error);
    throw error;
  }
}

// دالة جلب بيانات الاستهلاك اليومي للمستخدم
export async function getDailyUsage(username: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT SUM(dlbytes + ulbytes) AS daily_usage 
       FROM rm_radacct 
       WHERE username = ? AND acctstarttime >= CURDATE()`,
      [username]
    );
    return rows[0]?.daily_usage || 0;
  } catch (error) {
    console.error('Database error in getDailyUsage:', error);
    return 0;
  }
}

// دالة جلب مدة الجلسة الحالية
export async function getCurrentSessionTime(username: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT acctsessiontime 
       FROM rm_radacct 
       WHERE username = ? 
       ORDER BY radacctid DESC 
       LIMIT 1`,
      [username]
    );
    return rows[0]?.acctsessiontime || 0;
  } catch (error) {
    console.error('Database error in getCurrentSessionTime:', error);
    return 0;
  }
}

// دالة إنشاء فاتورة جديدة (غير مدفوعة) عند التجديد
export async function createRenewalInvoice(username: string, serviceName: string, price: number = 100000) {
  try {
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    const [result]: any = await pool.query(
      `INSERT INTO rm_invoices (username, service, date, price, paymode, managername)
       VALUES (?, ?, ?, ?, 2, 'system')`,
      [username, serviceName, currentDate, price]
    );

    console.log(`Created renewal invoice for ${username}: ID ${result.insertId}, Service: ${serviceName}, Price: ${price}`);
    return result.insertId;
  } catch (error) {
    console.error('Database error in createRenewalInvoice:', error);
    throw error;
  }
}

// دالة جلب آخر فاتورة مدفوعة للمستخدم (للحصول على اسم الخدمة والسعر)
export async function getLastPaidInvoice(username: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT service, price
       FROM rm_invoices
       WHERE username = ? AND paid IS NOT NULL
       ORDER BY date DESC
       LIMIT 1`,
      [username]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in getLastPaidInvoice:', error);
    return null;
  }
}

// دالة جلب معلومات الخدمة من اسم الخدمة
export async function getServiceSpeed(serviceName: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT downrate 
       FROM rm_services 
       WHERE srvname = ? 
       LIMIT 1`,
      [serviceName]
    );
    return rows[0]?.downrate || null;
  } catch (error) {
    console.error('Database error in getServiceSpeed:', error);
    return null;
  }
}

// دالة جلب بيانات التقارير من جدول radacct
export async function getRadacctData(username: string, startDate?: string, endDate?: string) {
  try {
    let query = `
      SELECT 
        radacctid AS id,
        username,
        DATE(acctstarttime) AS date,
        SUM(acctsessiontime) AS sessionTime,
        SUM(acctinputoctets) AS uploadBytes,
        SUM(acctoutputoctets) AS downloadBytes,
        SUM(acctinputoctets + acctoutputoctets) AS totalBytes
      FROM radacct 
      WHERE username = ?
    `;

    const params: any[] = [username];

    if (startDate && endDate) {
      query += ` AND DATE(acctstarttime) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else {
      // Default to last 30 days
      query += ` AND acctstarttime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    }

    query += ` GROUP BY DATE(acctstarttime) ORDER BY date DESC`;

    console.log('Executing radacct query for user:', username);
    console.log('Date range:', startDate, 'to', endDate);

    const [rows]: any = await pool.query(query, params);
    console.log('Radacct data retrieved, row count:', rows.length);
    if (rows.length > 0) {
      console.log('Sample row:', rows[0]);
    }

    return rows;
  } catch (error) {
    console.error('Database error in getRadacctData:', error);
    return [];
  }
}

// دالة جلب آخر فاتورة للمستخدم لمعرفة اسم الخدمة
export async function getLastInvoiceService(username: string) {
  try {
    const [rows]: any = await pool.query(
      `SELECT service 
       FROM rm_invoices 
       WHERE username = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [username]
    );
    return rows[0]?.service || null;
  } catch (error) {
    console.error('Database error in getLastInvoiceService:', error);
    return null;
  }
}

// دالة اختبار الاتصال بقاعدة البيانات
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// ===============================
// دالة المتبقي حسب آخر باقة مدفوعة
// ===============================

export async function getCustomRemaining(username: string) {
  // 1. جلب آخر فاتورة مدفوعة وتاريخ تفعيلها وسعة الباقة
  const [lastPaid]: any = await pool.query(
    `SELECT date, service 
     FROM rm_invoices 
     WHERE username = ? AND paid IS NOT NULL AND paid <> 0
     ORDER BY id DESC LIMIT 1`,
    [username]
  );
  if (!lastPaid[0]) {
    // لا يوجد فاتورة مدفوعة
    return { success: false, message: "لا يوجد فاتورة مدفوعة لهذا المستخدم." };
  }

  const activationDate = lastPaid[0].date;
  const serviceName = lastPaid[0].service;

  // 2. جلب سعة الباقة من جدول الخدمات
  const [serviceRows]: any = await pool.query(
    `SELECT combquota FROM rm_services WHERE srvname = ? LIMIT 1`,
    [serviceName]
  );
  if (!serviceRows[0]) {
    return { success: false, message: "الخدمة غير معرفة." };
  }
  const totalbytes = Number(serviceRows[0].combquota);

  // 3. جلب مجموع الاستهلاك من تاريخ التفعيل حتى الآن
  const [usageRows]: any = await pool.query(
    `SELECT SUM(dlbytes) as total_dl, SUM(ulbytes) as total_ul
     FROM rm_radacct
     WHERE username = ? AND acctstarttime >= ?`,
    [username, activationDate]
  );
  const used = Number(usageRows[0].total_dl || 0) + Number(usageRows[0].total_ul || 0);

  // 4. حساب المتبقي
  const remaining = Math.max(0, totalbytes - used);

  return {
    success: true,
    totalbytes,
    used,
    remaining,
    remainingGB: +(remaining / (1024 ** 3)).toFixed(2),
    activationDate
  };
}
