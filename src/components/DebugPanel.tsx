import React, { useState } from 'react';
import { Bug, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const DebugPanel: React.FC = () => {
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkEnvironmentVariables = () => {
    const envCheck = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      urlFormat: import.meta.env.VITE_SUPABASE_URL ? 
        import.meta.env.VITE_SUPABASE_URL.includes('supabase.co') : false
    };
    
    console.log('🔍 Environment Variables Check:', envCheck);
    return envCheck;
  };

  const runSupabaseTest = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting Comprehensive Supabase Test...');
      
      // Step 1: Check environment variables
      const envCheck = checkEnvironmentVariables();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        setDebugResults({
          success: false,
          message: 'SUPABASE_URL is missing',
          details: {
            issue: 'missing_url',
            solution: 'Add VITE_SUPABASE_URL to your environment variables',
            envCheck
          }
        });
        return;
      }
      
      if (!supabaseAnonKey) {
        setDebugResults({
          success: false,
          message: 'SUPABASE_ANON_KEY is missing',
          details: {
            issue: 'missing_anon_key',
            solution: 'Add VITE_SUPABASE_ANON_KEY to your environment variables',
            envCheck
          }
        });
        return;
      }
      
      // Step 2: Validate URL format
      if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
        setDebugResults({
          success: false,
          message: 'Invalid Supabase URL format',
          details: {
            issue: 'invalid_url_format',
            currentUrl: supabaseUrl,
            expectedFormat: 'https://your-project-id.supabase.co',
            solution: 'Check your Supabase project URL in the dashboard'
          }
        });
        return;
      }
      
      // Step 3: Validate anon key format
      if (!supabaseAnonKey.startsWith('eyJ')) {
        setDebugResults({
          success: false,
          message: 'Invalid Supabase anon key format',
          details: {
            issue: 'invalid_anon_key_format',
            keyStart: supabaseAnonKey.substring(0, 10) + '...',
            expectedStart: 'eyJ...',
            solution: 'Check your anon key from Supabase dashboard → Settings → API'
          }
        });
        return;
      }
      
      // Step 4: Test Supabase client creation
      let supabase;
      try {
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase client created successfully');
      } catch (clientError) {
        setDebugResults({
          success: false,
          message: 'Failed to create Supabase client',
          details: {
            issue: 'client_creation_failed',
            error: clientError.message,
            solution: 'Check if @supabase/supabase-js is installed correctly'
          }
        });
        return;
      }
      
      // Step 5: Test basic connection with a simple query
      console.log('🔍 Testing basic connection...');
      let connectionTest;
      try {
        connectionTest = await supabase.from('leads').select('count', { count: 'exact', head: true });
      } catch (connectionError) {
        setDebugResults({
          success: false,
          message: 'Network connection to Supabase failed',
          details: {
            issue: 'network_connection_failed',
            error: connectionError.message,
            solution: 'Check your internet connection and Supabase project status'
          }
        });
        return;
      }
      
      // Step 6: Analyze the response
      if (connectionTest.error) {
        const error = connectionTest.error;
        console.error('❌ Connection test failed:', error);
        
        let issue, solution;
        if (error.code === 'PGRST116') {
          issue = 'table_not_found';
          solution = 'The leads table does not exist. Run the migration SQL in your Supabase dashboard.';
        } else if (error.message.includes('Invalid API key')) {
          issue = 'invalid_api_key';
          solution = 'Your anon key is invalid. Get a new one from Supabase dashboard → Settings → API.';
        } else if (error.message.includes('Project not found')) {
          issue = 'project_not_found';
          solution = 'Your project URL is incorrect. Check the URL in your Supabase dashboard.';
        } else {
          issue = 'unknown_error';
          solution = 'Unknown error. Check Supabase dashboard for project status.';
        }
        
        setDebugResults({
          success: false,
          message: `Connection failed: ${error.message}`,
          details: {
            issue,
            solution,
            errorCode: error.code,
            errorHint: error.hint,
            envCheck
          }
        });
        return;
      }
      
      console.log('✅ Connection successful!');
      
      setDebugResults({
        success: true,
        message: 'Supabase connection working perfectly!',
        testResults: {
          environmentVariables: true,
          urlFormat: true,
          keyFormat: true,
          clientCreation: true,
          networkConnection: true,
          tableAccess: true,
          recordCount: connectionTest.count || 0
        },
        details: {
          projectUrl: supabaseUrl,
          tableExists: true,
          envCheck
        }
      });
      
    } catch (error) {
      console.error('💥 Unexpected error during debug test:', error);
      setDebugResults({
        success: false,
        message: `Unexpected error: ${error.message}`,
        error: error.message,
        details: {
          type: 'unexpected_error',
          stack: error.stack,
          solution: 'This is an unexpected error. Please check the browser console for more details.'
        }
      });
    }
    setIsLoading(false);
  };

  const testEmailFlow = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing complete email flow...');
      
      // Check if we're running on Vite dev server (which doesn't support API routes)
      const isViteDevServer = window.location.port === '5173';
      
      if (isViteDevServer) {
        setDebugResults({
          success: false,
          message: 'API endpoints not available on Vite dev server',
          type: 'email-flow',
          details: {
            error: 'Running on npm run dev (port 5173)',
            solution: 'To test API endpoints, run "vercel dev" instead of "npm run dev", or deploy to Vercel and test on the live site',
            currentPort: window.location.port,
            recommendation: 'Use "vercel dev" for full-stack testing'
          }
        });
        return;
      }
      
      // If not on Vite dev server, proceed with API testing
      console.log('🧪 Step 1: Testing API endpoint accessibility...');
      
      const testResponse = await fetch('/api/debug-env', {
        method: 'GET'
      });
      
      // Check if we're getting JavaScript source code instead of JSON
      const contentType = testResponse.headers.get('content-type');
      
      if (!testResponse.ok || !contentType?.includes('application/json')) {
        setDebugResults({
          success: false,
          message: 'API endpoints not properly configured',
          type: 'email-flow',
          details: {
            error: contentType?.includes('javascript') ? 
              'Getting JavaScript source code instead of API response' : 
              `API returned ${testResponse.status}`,
            solution: 'API routes are not being executed as serverless functions. Use "vercel dev" for full-stack testing or deploy to Vercel.',
            currentPort: window.location.port,
            contentType: contentType,
            recommendation: 'Run "vercel dev" instead of "npm run dev" to test API endpoints'
          }
        });
        return;
      }
      
      const envData = await testResponse.json();
      console.log('✅ API endpoints accessible');
      console.log('🔍 Environment check:', envData);
      
      // Test email submission flow
      console.log('🧪 Step 2: Testing email submission...');
      
      const emailTestData = {
        email: 'test@example.com',
        beforeImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        afterImage: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=1024',
        selectedStyle: 'Modern Minimalist',
        roomType: 'kitchen',
        subscribe: true,
        zipCode: '01701'
      };
      
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailTestData)
      });
      
      const emailResult = await emailResponse.json();
      console.log('📧 Email API response:', emailResult);
      
      // Test contractor notification (lead saving)
      console.log('🧪 Step 3: Testing lead saving...');
      
      const leadTestData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        zip: '01701',
        room_type: 'kitchen',
        style: 'Modern Minimalist',
        image_url: emailTestData.beforeImage,
        ai_url: emailTestData.afterImage,
        render_count: 1,
        wants_quote: true,
        social_engaged: false,
        is_repeat_visitor: false
      };
      
      const contractorResponse = await fetch('/api/notify-contractor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadTestData)
      });
      
      const contractorResult = await contractorResponse.json();
      console.log('🎯 Contractor API response:', contractorResult);
      
      // Verify Supabase direct access
      console.log('🧪 Step 4: Testing direct Supabase access...');
      
      const supabaseTestResponse = await fetch('/api/debug-supabase', {
        method: 'GET'
      });
      
      const supabaseTestResult = await supabaseTestResponse.json();
      console.log('🗄️ Supabase test result:', supabaseTestResult);
      
      // Compile results
      setDebugResults({
        success: emailResult.success && contractorResult.success && supabaseTestResult.success,
        message: 'Complete email flow test completed',
        type: 'email-flow',
        details: {
          apiAccessible: true,
          emailApiWorking: emailResult.success,
          leadSavingWorking: contractorResult.success,
          supabaseWorking: supabaseTestResult.success,
          emailResponse: emailResult,
          contractorResponse: contractorResult,
          supabaseResponse: supabaseTestResult
        }
      });
      
    } catch (error) {
      console.error('💥 Email flow test error:', error);
      setDebugResults({
        success: false,
        message: `Email flow test failed: ${error.message}`,
        type: 'email-flow',
        error: error.message
      });
    }
    setIsLoading(false);
  };

  const testStableDiffusionAPI = async () => {
    setIsLoading(true);
    try {
      // Check if we're running on Vite dev server (which doesn't support API routes)
      const isViteDevServer = window.location.port === '5173';
      
      if (isViteDevServer) {
        setDebugResults({
          success: false,
          message: 'API endpoints not available on Vite dev server',
          type: 'stable-diffusion-api',
          details: {
            error: 'Running on npm run dev (port 5173)',
            solution: 'To test API endpoints, run "vercel dev" instead of "npm run dev", or deploy to Vercel and test on the live site',
            currentPort: window.location.port,
            recommendation: 'Use "vercel dev" for full-stack testing'
          }
        });
        setIsLoading(false);
        return;
      }
      
    } catch (error) {
      console.error('💥 Stable Diffusion API test error:', error);
      setDebugResults({
        success: false,
        message: `Stable Diffusion API test failed: ${error.message}`,
        type: 'stable-diffusion-api',
        error: error.message
      });
    }
    setIsLoading(false);
  };

  const testReplicateModels = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Testing Replicate models...');
      
      const response = await fetch('/api/debug-replicate', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`API response not ok: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 Replicate debug result:', result);
      
      setDebugResults({
        success: result.success,
        message: result.message,
        type: 'replicate-models',
        details: {
          workingModels: result.workingModels || [],
          allTests: result.modelTests || [],
          stabilityModels: result.stabilityAiModels || [],
          recommendation: result.recommendation
        }
      });
      
    } catch (error) {
      console.error('💥 Replicate debug error:', error);
      setDebugResults({
        success: false,
        message: `Replicate debug failed: ${error.message}`,
        type: 'replicate-models',
        error: error.message
      });
    }
    setIsLoading(false);
  };

  const testDirectSupabase = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing direct Supabase save from client...');
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setDebugResults({
          success: false,
          message: 'Supabase environment variables missing',
          type: 'direct-supabase',
          details: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            solution: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file'
          }
        });
        return;
      }
      
      // Import and test Supabase client
      const { supabase } = await import('../lib/supabase');
      
      if (!supabase) {
        setDebugResults({
          success: false,
          message: 'Supabase client not initialized',
          type: 'direct-supabase',
          details: {
            solution: 'Check Supabase configuration in src/lib/supabase.ts'
          }
        });
        return;
      }
      
      // Test inserting a lead record
      const testLead = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        zip: '01701',
        room_type: 'kitchen',
        style: 'Modern Minimalist',
        image_url: 'data:image/jpeg;base64,test',
        ai_url: 'https://example.com/test.jpg',
        render_count: 1,
        wants_quote: true,
        social_engaged: false,
        is_repeat_visitor: false,
        lead_score: 75
      };
      
      console.log('🧪 Attempting to insert test lead...');
      
      const { data: insertedLead, error: insertError } = await supabase
        .from('leads')
        .insert(testLead)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Insert failed:', insertError);
        setDebugResults({
          success: false,
          message: `Failed to insert lead: ${insertError.message}`,
          type: 'direct-supabase',
          details: {
            errorCode: insertError.code,
            errorHint: insertError.hint,
            solution: insertError.code === 'PGRST116' ? 
              'The leads table does not exist. Run the migration in your Supabase dashboard.' :
              'Check your Supabase RLS policies and table permissions.'
          }
        });
        return;
      }
      
      console.log('✅ Test lead inserted:', insertedLead.id);
      
      // Clean up test record
      await supabase
        .from('leads')
        .delete()
        .eq('id', insertedLead.id);
      
      console.log('✅ Test record cleaned up');
      
      setDebugResults({
        success: true,
        message: 'Direct Supabase save working perfectly!',
        type: 'direct-supabase',
        details: {
          testLeadId: insertedLead.id,
          insertWorking: true,
          deleteWorking: true,
          solution: 'Client-side email saving should work now'
        }
      });
      
    } catch (error) {
      console.error('💥 Direct Supabase test error:', error);
      setDebugResults({
        success: false,
        message: `Direct Supabase test failed: ${error.message}`,
        type: 'direct-supabase',
        error: error.message
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Bug className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Debug Panel</h3>
        </div>
        
        <div className="space-y-2 mb-4">
          <button
            onClick={runSupabaseTest}
            disabled={isLoading}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="w-4 h-4" />
            {isLoading ? 'Testing...' : 'Test Supabase Connection'}
          </button>
          
          <button
            onClick={testEmailFlow}
            disabled={isLoading}
            className="w-full flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isLoading ? 'Testing...' : 'Test Complete Email Flow'}
          </button>
          
          <button
            onClick={testStableDiffusionAPI}
            disabled={isLoading}
            className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isLoading ? 'Testing...' : 'Test Stable Diffusion XL'}
          </button>
          
          <button
            onClick={testReplicateModels}
            disabled={isLoading}
            className="w-full flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isLoading ? 'Testing...' : 'Debug Replicate Models'}
          </button>
          
          <button
            onClick={testDirectSupabase}
            disabled={isLoading}
            className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isLoading ? 'Testing...' : 'Test Direct Supabase Save'}
          </button>
        </div>
        
        {debugResults && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              {debugResults.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                debugResults.success ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {debugResults.success ? 'Success' : 'Failed'}
              </span>
            </div>
            
            <p className="text-xs text-gray-600 mb-2">{debugResults.message}</p>
            
            {debugResults.details?.solution && (
              <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                <strong>💡 Solution:</strong> {debugResults.details.solution}
              </div>
            )}
            
            {debugResults.details && (
              <div className="text-xs text-gray-500">
                {debugResults.details.envCheck && (
                  <div className="space-y-1 mb-2">
                    <div>Has URL: {debugResults.details.envCheck.hasUrl ? '✅' : '❌'}</div>
                    <div>Has Anon Key: {debugResults.details.envCheck.hasAnonKey ? '✅' : '❌'}</div>
                    <div>URL Format: {debugResults.details.envCheck.urlFormat ? '✅' : '❌'}</div>
                  </div>
                )}
                {debugResults.details.issue && (
                  <div className="text-red-600 font-medium">Issue: {debugResults.details.issue}</div>
                )}
                {debugResults.details.errorCode && (
                  <div>Error Code: {debugResults.details.errorCode}</div>
                )}
              </div>
            )}
            
            {debugResults.testResults && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Environment: {debugResults.testResults.environmentVariables ? '✅' : '❌'}</div>
                <div>URL Format: {debugResults.testResults.urlFormat ? '✅' : '❌'}</div>
                <div>Key Format: {debugResults.testResults.keyFormat ? '✅' : '❌'}</div>
                <div>Client Creation: {debugResults.testResults.clientCreation ? '✅' : '❌'}</div>
                <div>Network Connection: {debugResults.testResults.networkConnection ? '✅' : '❌'}</div>
                <div>Table Access: {debugResults.testResults.tableAccess ? '✅' : '❌'}</div>
                {debugResults.testResults.recordCount !== undefined && (
                  <div>Records in table: {debugResults.testResults.recordCount}</div>
                )}
              </div>
            )}
            
            {debugResults.type === 'email-flow' && debugResults.details && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>API Accessible: {debugResults.details.apiAccessible ? '✅' : '❌'}</div>
                <div>Email API: {debugResults.details.emailApiWorking ? '✅' : '❌'}</div>
                <div>Lead Saving: {debugResults.details.leadSavingWorking ? '✅' : '❌'}</div>
                <div>Supabase: {debugResults.details.supabaseWorking ? '✅' : '❌'}</div>
                {debugResults.details.contractorResponse?.id && (
                  <div>Test Lead ID: {debugResults.details.contractorResponse.id}</div>
                )}
                {debugResults.details.contractorResponse?.score && (
                  <div>Lead Score: {debugResults.details.contractorResponse.score}</div>
                )}
              </div>
            )}
            
            {debugResults.type === 'replicate-models' && debugResults.details && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Working Models Found: {debugResults.details.workingModels?.length || 0}</div>
                {debugResults.details.workingModels?.map((model, index) => (
                  <div key={index} className="text-green-600">
                    ✅ {model.name} (v: {model.latestVersion?.substring(0, 8)}...)
                  </div>
                ))}
                {debugResults.details.allTests?.filter(test => test.status !== 'exists').map((model, index) => (
                  <div key={index} className="text-red-600">
                    ❌ {model.name} ({model.status})
                  </div>
                ))}
                {debugResults.details.recommendation && (
                  <div className="text-blue-600 font-medium mt-2">
                    💡 {debugResults.details.recommendation}
                  </div>
                )}
              </div>
            )}
            
            {debugResults.error && (
              <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                Error: {debugResults.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;