import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export default function ApiTest() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRemainingDetailedApi = async () => {
    setLoading(true);
    try {
      // استخدام queryClient للحصول على token
      const response = await fetch('/api/remaining-detailed', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setTestResult({ 
        status: response.status, 
        data,
        timestamp: new Date().toISOString(),
        url: '/api/remaining-detailed'
      });
    } catch (error) {
      setTestResult({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">API Test - Remaining Detailed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testRemainingDetailedApi}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'جاري الفحص...' : 'فحص API /remaining-detailed'}
            </Button>

            {testResult && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">نتيجة الفحص</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm overflow-auto max-h-96 bg-white p-4 rounded border">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">ملاحظة للفحص المباشر:</h3>
              <p className="text-sm text-yellow-700 mb-2">لفحص API مباشرة في المتصفح، استخدم Developer Console:</p>
              <code className="text-xs bg-yellow-100 p-2 rounded block">
                {`fetch('/api/remaining-detailed', {
  headers: {'Authorization': 'Bearer YOUR_TOKEN'}
}).then(r => r.json()).then(console.log)`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}