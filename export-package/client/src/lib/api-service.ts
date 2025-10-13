export async function fetchUsageReport(username: string, period: string) {
  const url = `/api/usage?username=${encodeURIComponent(username)}&period=${encodeURIComponent(period)}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json();
    console.error('Usage API Error:', errorData);
    throw new Error(errorData.message || "فشل في جلب تقرير الاستخدام");
  }
  const json = await res.json();
  console.log('Usage API Response:', json);
  
  // Return the full data structure including statistics
  if (json.data?.reports?.data) {
    return json.data.reports.data;
  } else if (json.data?.reports) {
    return json.data.reports;
  } else if (json.data) {
    return json.data;
  }
  
  console.warn('Unexpected usage report format:', json);
  return { reports: [], statistics: null };
}
