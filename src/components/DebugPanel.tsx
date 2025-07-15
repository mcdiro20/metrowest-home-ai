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
      // Client-side simulation for local development
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setDebugResults({
          success: false,
          message: 'Cannot test email flow - Supabase not configured',
          type: 'email-flow'
        });
        return;
      }
      
      setDebugResults({
        success: false,
        message: 'Email flow test requires API endpoints',
        type: 'email-flow',
        note: 'To test the full email flow, run `vercel dev` or deploy to production'
      });
    } catch (error) {
      setDebugResults({
        success: false,
        message: 'Email flow test failed',
        error: error.message,
        type: 'email-flow'
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
            className="w-full flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isLoading ? 'Testing...' : 'Test API Flow (Needs vercel dev)'}
          </button>
          
          <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded">
            💡 For full API testing, run <code className="bg-gray-200 px-1 rounded">vercel dev</code> instead of <code className="bg-gray-200 px-1 rounded">npm run dev</code>
          </div>
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
            
            {debugResults.type === 'email-flow' && debugResults.success && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Lead ID: {debugResults.id}</div>
                <div>Lead Score: {debugResults.score}</div>
                <div>Contractors Notified: {debugResults.notified_contractors ? '✅' : '❌'}</div>
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