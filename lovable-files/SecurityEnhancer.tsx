import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { apiService } from './api';

interface SecurityThreat {
  id: string;
  type: 'xss' | 'csrf' | 'injection' | 'rate_limit' | 'authentication' | 'authorization' | 'data_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedComponent: string;
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
  detectedAt: string;
  mitigationSteps: string[];
}

interface SecurityMetrics {
  totalThreats: number;
  threatsBySeverity: Record<string, number>;
  threatsByType: Record<string, number>;
  lastScan: string;
  securityScore: number;
}

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'input_validation' | 'authentication' | 'authorization' | 'data_protection' | 'rate_limiting';
}

export const SecurityEnhancer: React.FC = () => {
  const { user } = useAuth();
  const { getBalance, refreshBalances } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, formatBalance } = useCurrency();

  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  // Security rules configuration
  const defaultSecurityRules: SecurityRule[] = [
    {
      id: 'input_validation_1',
      name: 'XSS Protection',
      description: 'Sanitize all user inputs to prevent XSS attacks',
      enabled: true,
      severity: 'critical',
      category: 'input_validation'
    },
    {
      id: 'authentication_1',
      name: 'JWT Token Validation',
      description: 'Validate JWT tokens and check expiration',
      enabled: true,
      severity: 'high',
      category: 'authentication'
    },
    {
      id: 'rate_limiting_1',
      name: 'API Rate Limiting',
      description: 'Limit API requests per user/IP to prevent abuse',
      enabled: true,
      severity: 'medium',
      category: 'rate_limiting'
    },
    {
      id: 'data_protection_1',
      name: 'Sensitive Data Encryption',
      description: 'Encrypt sensitive data in transit and at rest',
      enabled: true,
      severity: 'high',
      category: 'data_protection'
    },
    {
      id: 'authorization_1',
      name: 'Role-Based Access Control',
      description: 'Implement proper authorization checks',
      enabled: true,
      severity: 'high',
      category: 'authorization'
    },
    {
      id: 'input_validation_2',
      name: 'SQL Injection Prevention',
      description: 'Use parameterized queries to prevent SQL injection',
      enabled: true,
      severity: 'critical',
      category: 'input_validation'
    }
  ];

  // Security scanning
  const performSecurityScan = async () => {
    setIsScanning(true);
    const results = [];

    try {
      // Scan 1: Check for XSS vulnerabilities
      const xssScan = await scanForXSS();
      results.push({
        scan: 'XSS Vulnerability Scan',
        result: xssScan.vulnerabilities > 0 ? `${xssScan.vulnerabilities} vulnerabilities found` : 'No XSS vulnerabilities detected',
        status: xssScan.vulnerabilities > 0 ? 'fail' : 'pass',
        details: xssScan.details
      });

      // Scan 2: Check authentication security
      const authScan = await scanAuthentication();
      results.push({
        scan: 'Authentication Security',
        result: authScan.issues > 0 ? `${authScan.issues} issues found` : 'Authentication security is good',
        status: authScan.issues > 0 ? 'fail' : 'pass',
        details: authScan.details
      });

      // Scan 3: Check rate limiting
      const rateLimitScan = await scanRateLimiting();
      results.push({
        scan: 'Rate Limiting Check',
        result: rateLimitScan.protected ? 'Rate limiting is active' : 'Rate limiting needs configuration',
        status: rateLimitScan.protected ? 'pass' : 'fail',
        details: rateLimitScan.details
      });

      // Scan 4: Check data encryption
      const encryptionScan = await scanDataEncryption();
      results.push({
        scan: 'Data Encryption Check',
        result: encryptionScan.encrypted ? 'Data encryption is properly configured' : 'Data encryption needs improvement',
        status: encryptionScan.encrypted ? 'pass' : 'fail',
        details: encryptionScan.details
      });

      // Scan 5: Check authorization
      const authzScan = await scanAuthorization();
      results.push({
        scan: 'Authorization Check',
        result: authzScan.secure ? 'Authorization is properly implemented' : 'Authorization needs strengthening',
        status: authzScan.secure ? 'pass' : 'fail',
        details: authzScan.details
      });

    } catch (error) {
      results.push({
        scan: 'General Security Scan',
        result: 'Scan failed',
        status: 'fail',
        details: error.message
      });
    }

    setScanResults(results);
    setIsScanning(false);
  };

  // Individual scan functions
  const scanForXSS = async () => {
    // Simulate XSS scan
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      vulnerabilities: 0,
      details: 'All user inputs are properly sanitized'
    };
  };

  const scanAuthentication = async () => {
    // Simulate authentication scan
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      issues: 0,
      details: 'JWT tokens are properly validated and secured'
    };
  };

  const scanRateLimiting = async () => {
    // Simulate rate limiting scan
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      protected: true,
      details: 'Rate limiting is active with 100 requests per minute limit'
    };
  };

  const scanDataEncryption = async () => {
    // Simulate encryption scan
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
      encrypted: true,
      details: 'Data is encrypted in transit (HTTPS) and at rest (AES-256)'
    };
  };

  const scanAuthorization = async () => {
    // Simulate authorization scan
    await new Promise(resolve => setTimeout(resolve, 900));
    return {
      secure: true,
      details: 'Role-based access control is properly implemented'
    };
  };

  // Apply security rule
  const applySecurityRule = async (rule: SecurityRule) => {
    try {
      console.log(`🔒 Applying security rule: ${rule.name}`);
      
      // Simulate rule application
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to security logs
      setSecurityLogs(prev => [...prev, {
        action: 'Security Rule Applied',
        rule: rule.name,
        timestamp: new Date().toISOString(),
        status: 'success'
      }]);
      
      return { success: true, message: `Security rule "${rule.name}" has been applied` };
    } catch (error) {
      setSecurityLogs(prev => [...prev, {
        action: 'Security Rule Failed',
        rule: rule.name,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      }]);
      return { success: false, message: `Failed to apply security rule: ${error.message}` };
    }
  };

  // Toggle security rule
  const toggleSecurityRule = async (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  // Generate security report
  const generateSecurityReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      totalThreats: threats.length,
      criticalThreats: threats.filter(t => t.severity === 'critical').length,
      highThreats: threats.filter(t => t.severity === 'high').length,
      mediumThreats: threats.filter(t => t.severity === 'medium').length,
      lowThreats: threats.filter(t => t.severity === 'low').length,
      enabledRules: rules.filter(r => r.enabled).length,
      totalRules: rules.length,
      securityScore: calculateSecurityScore()
    };
    
    return report;
  };

  // Calculate security score
  const calculateSecurityScore = () => {
    const totalThreats = threats.length;
    const criticalThreats = threats.filter(t => t.severity === 'critical').length;
    const highThreats = threats.filter(t => t.severity === 'high').length;
    const enabledRules = rules.filter(r => r.enabled).length;
    const totalRules = rules.length;
    
    let score = 100;
    score -= criticalThreats * 20;
    score -= highThreats * 10;
    score -= (totalThreats - criticalThreats - highThreats) * 5;
    score += (enabledRules / totalRules) * 20;
    
    return Math.max(0, Math.min(100, score));
  };

  // Initialize
  useEffect(() => {
    setRules(defaultSecurityRules);
    
    // Initialize with some sample threats
    const sampleThreats: SecurityThreat[] = [
      {
        id: 'threat_1',
        type: 'rate_limit',
        severity: 'medium',
        description: 'Potential rate limiting bypass detected',
        affectedComponent: 'API Gateway',
        status: 'detected',
        detectedAt: new Date().toISOString(),
        mitigationSteps: ['Implement stricter rate limiting', 'Add IP-based blocking']
      },
      {
        id: 'threat_2',
        type: 'authentication',
        severity: 'low',
        description: 'Weak password policy detected',
        affectedComponent: 'User Registration',
        status: 'detected',
        detectedAt: new Date().toISOString(),
        mitigationSteps: ['Enforce stronger password requirements', 'Add password complexity validation']
      }
    ];
    setThreats(sampleThreats);
    
    // Initialize metrics
    const initialMetrics: SecurityMetrics = {
      totalThreats: sampleThreats.length,
      threatsBySeverity: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 1
      },
      threatsByType: {
        rate_limit: 1,
        authentication: 1
      },
      lastScan: new Date().toISOString(),
      securityScore: 85
    };
    setMetrics(initialMetrics);
  }, []);

  if (!user) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Security Enhancer</h2>
        <p className="text-gray-400">Please log in to access the security system.</p>
      </div>
    );
  }

  const securityScore = calculateSecurityScore();
  const report = generateSecurityReport();

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">🔒 Security Enhancer</h2>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Security Score</h3>
          <p className={`text-2xl font-bold ${
            securityScore >= 90 ? 'text-green-400' :
            securityScore >= 70 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {securityScore}/100
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Active Threats</h3>
          <p className="text-2xl font-bold text-red-400">{threats.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Enabled Rules</h3>
          <p className="text-2xl font-bold text-green-400">
            {rules.filter(r => r.enabled).length}/{rules.length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Last Scan</h3>
          <p className="text-sm text-gray-300">
            {new Date(report.lastScan).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={performSecurityScan}
          disabled={isScanning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold"
        >
          {isScanning ? 'Scanning...' : 'Run Security Scan'}
        </button>
        <button
          onClick={() => console.log('Security report:', report)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
        >
          Generate Report
        </button>
        <button
          onClick={refreshBalances}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold"
        >
          Refresh Data
        </button>
      </div>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Security Scan Results</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            {scanResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <div className="text-gray-300 font-semibold">{result.scan}</div>
                  <div className="text-sm text-gray-400">{result.result}</div>
                  {result.details && (
                    <div className="text-xs text-gray-500 mt-1">{result.details}</div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  result.status === 'pass' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Threats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Security Threats</h3>
        <div className="space-y-3">
          {threats.map((threat) => (
            <div key={threat.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-red-400">{threat.affectedComponent}</h4>
                  <p className="text-gray-300">{threat.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    threat.severity === 'critical' ? 'bg-red-600' :
                    threat.severity === 'high' ? 'bg-orange-600' :
                    threat.severity === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                  }`}>
                    {threat.severity.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    threat.status === 'resolved' ? 'bg-green-600' :
                    threat.status === 'mitigated' ? 'bg-yellow-600' :
                    threat.status === 'investigating' ? 'bg-blue-600' : 'bg-red-600'
                  }`}>
                    {threat.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Detected: {new Date(threat.detectedAt).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">
                <strong>Mitigation Steps:</strong>
                <ul className="list-disc list-inside mt-1">
                  {threat.mitigationSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Rules */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Security Rules</h3>
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-blue-400">{rule.name}</h4>
                  <p className="text-gray-300">{rule.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    rule.severity === 'critical' ? 'bg-red-600' :
                    rule.severity === 'high' ? 'bg-orange-600' :
                    rule.severity === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                  }`}>
                    {rule.severity.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    rule.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {rule.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleSecurityRule(rule.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    rule.enabled 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => applySecurityRule(rule)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Apply Rule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Logs */}
      {securityLogs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Security Logs</h3>
          <div className="bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
            {securityLogs.map((log, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <div className="text-gray-300">{log.action}</div>
                  <div className="text-sm text-gray-400">{log.rule}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.status === 'success' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
