/**
 * Comprehensive Test Runner for ImageCraft Pro
 * Runs all test suites and generates reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      performance: null,
      security: null,
      raw: null,
      coverage: null
    };
    
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTestSuite(name, command) {
    this.log(`Starting ${name} tests...`);
    const startTime = Date.now();
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.results[name] = {
        status: 'passed',
        duration,
        output: output.slice(-1000) // Keep last 1000 chars
      };
      
      this.log(`${name} tests completed in ${duration}ms`, 'success');
      return true;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.results[name] = {
        status: 'failed',
        duration,
        error: error.message,
        output: error.stdout ? error.stdout.slice(-1000) : ''
      };
      
      this.log(`${name} tests failed after ${duration}ms`, 'error');
      this.log(`Error: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive test suite for ImageCraft Pro');
    
    const testSuites = [
      {
        name: 'unit',
        command: 'npm run test:unit',
        description: 'Unit tests for core functionality'
      },
      {
        name: 'security',
        command: 'npm run test:security',
        description: 'Security validation tests'
      },
      {
        name: 'raw',
        command: 'npm run test:raw',
        description: 'RAW format detection tests'
      },
      {
        name: 'integration',
        command: 'npm run test:integration',
        description: 'End-to-end integration tests'
      },
      {
        name: 'performance',
        command: 'npm run test:performance',
        description: 'Performance and stress tests'
      },
      {
        name: 'coverage',
        command: 'npm run test:coverage',
        description: 'Test coverage analysis'
      }
    ];

    let passedSuites = 0;
    let totalSuites = testSuites.length;

    for (const suite of testSuites) {
      this.log(`\n📋 Running ${suite.description}...`);
      const passed = await this.runTestSuite(suite.name, suite.command);
      if (passed) passedSuites++;
    }

    this.generateReport();
    
    const totalTime = Date.now() - this.startTime;
    this.log(`\n🏁 Test suite completed in ${totalTime}ms`);
    this.log(`📊 Results: ${passedSuites}/${totalSuites} test suites passed`);
    
    if (passedSuites === totalSuites) {
      this.log('🎉 All tests passed!', 'success');
      process.exit(0);
    } else {
      this.log('⚠️  Some tests failed. Check the report for details.', 'error');
      process.exit(1);
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: Object.keys(this.results).length,
        passedSuites: Object.values(this.results).filter(r => r && r.status === 'passed').length,
        failedSuites: Object.values(this.results).filter(r => r && r.status === 'failed').length,
        totalDuration: Date.now() - this.startTime
      },
      results: this.results
    };

    // Save JSON report
    const reportPath = path.join(process.cwd(), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`📄 Test report saved to ${reportPath}`);

    // Generate HTML report
    this.generateHTMLReport(report);
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ImageCraft Pro - Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .test-suite { margin-bottom: 20px; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .suite-content { padding: 15px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
        .output { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.8em; max-height: 200px; overflow-y: auto; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖼️ ImageCraft Pro - Test Report</h1>
            <p class="timestamp">Generated: ${report.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value">${report.summary.totalSuites}</div>
                <div class="stat-label">Total Suites</div>
            </div>
            <div class="stat-card">
                <div class="stat-value passed">${report.summary.passedSuites}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value failed">${report.summary.failedSuites}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(report.summary.totalDuration / 1000)}s</div>
                <div class="stat-label">Total Time</div>
            </div>
        </div>
        
        <div class="test-results">
            ${Object.entries(report.results).map(([name, result]) => {
              if (!result) return '';
              
              return `
                <div class="test-suite">
                    <div class="suite-header">
                        <span>${name.charAt(0).toUpperCase() + name.slice(1)} Tests</span>
                        <div>
                            <span class="status-badge status-${result.status}">${result.status.toUpperCase()}</span>
                            <span style="margin-left: 10px;">${result.duration}ms</span>
                        </div>
                    </div>
                    <div class="suite-content">
                        ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                        ${result.output ? `<div class="output">${result.output}</div>` : ''}
                    </div>
                </div>
              `;
            }).join('')}
        </div>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(process.cwd(), 'test-report.html');
    fs.writeFileSync(htmlPath, html);
    this.log(`📊 HTML report saved to ${htmlPath}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;