'use client';

import { useState } from 'react';
import { 
  Building2, 
  Users, 
  Wrench,
  CheckCircle,
  Activity,
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Share2,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Analytics data based on what we actually have implemented
const analyticsData = {
  overview: {
    totalFacilities: {
      value: 5,
      trend: '+1',
      percentage: '+25%',
      period: 'vs. last quarter'
    },
    totalBuildings: {
      value: 12,
      trend: '+2',
      percentage: '+20%',
      period: 'vs. last month'
    },
    totalRooms: {
      value: 156,
      trend: '+8',
      percentage: '+5%',
      period: 'vs. last month'
    },
    activeSystems: {
      value: 89,
      trend: '+3',
      percentage: '+3%',
      period: 'vs. last quarter'
    }
  },
  buildingStatus: {
    active: 85,
    maintenance: 10,
    inactive: 5
  },
  systemTypes: {
    hvac: 35,
    electrical: 25,
    plumbing: 20,
    security: 12,
    fire: 8
  },
  renovationStatus: {
    planning: 3,
    inProgress: 2,
    completed: 8,
    onHold: 1
  },
  taskStatus: {
    new: 12,
    inProgress: 8,
    completed: 45,
    pending: 6
  }
};

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('month');
  const [reportType, setReportType] = useState('facility');
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [showReportPreview, setShowReportPreview] = useState(false);

  // Mock data for dropdowns
  const facilities = [
    { id: 'all', name: 'All Facilities' },
    { id: '1', name: 'Central High School' },
    { id: '2', name: 'Memorial Hospital' },
    { id: '3', name: 'Tech Hub Office Complex' },
    { id: '4', name: 'Mendota Unified District Office' },
    { id: '5', name: 'Manchester Mall' }
  ];

  const buildings = [
    { id: 'all', name: 'All Buildings' },
    { id: '1', name: 'Main Building', facilityId: '1' },
    { id: '2', name: 'Building A', facilityId: '1' },
    { id: '3', name: 'Building B', facilityId: '2' },
    { id: '4', name: 'Gymnasium', facilityId: '1' },
    { id: '5', name: 'Administration Building', facilityId: '3' },
    { id: '6', name: 'North Wing', facilityId: '2' },
    { id: '7', name: 'South Wing', facilityId: '2' }
  ];

  // Filter buildings based on selected facility
  const getFilteredBuildings = () => {
    if (selectedFacility === 'all') {
      return [{ id: 'all', name: 'All Buildings' }, ...buildings.filter(b => b.id !== 'all')];
    }
    return [
      { id: 'all', name: 'All Buildings in Facility' },
      ...buildings.filter(b => b.facilityId === selectedFacility)
    ];
  };

  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacility(facilityId);
    setSelectedBuilding('all'); // Reset building selection when facility changes
  };

  const handleViewReport = () => {
    setShowReportPreview(true);
    console.log('Viewing report:', {
      type: reportType,
      facility: selectedFacility,
      building: selectedBuilding,
      timeframe
    });
  };

  const generateReportData = () => {
    const facilityName = selectedFacility === 'all' ? 'All Facilities' : 
                        facilities.find(f => f.id === selectedFacility)?.name;
    const buildingName = selectedBuilding === 'all' 
      ? (selectedFacility === 'all' ? 'All Buildings' : 'All Buildings in Facility')
      : getFilteredBuildings().find(b => b.id === selectedBuilding)?.name;

    return {
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1).replace('_', ' ')} Report`,
      scope: `${facilityName}${selectedBuilding !== 'all' ? ` - ${buildingName}` : ''}`,
      period: timeframe,
      generatedDate: new Date().toLocaleDateString(),
      data: {
        facilities: selectedFacility === 'all' ? 5 : 1,
        buildings: selectedBuilding === 'all' ? (selectedFacility === 'all' ? 12 : 3) : 1,
        rooms: selectedBuilding === 'all' ? 156 : 13,
        systems: selectedBuilding === 'all' ? 89 : 7,
        activeTasks: 23,
        completedTasks: 45,
        renovations: 2
      }
    };
  };

  const downloadReport = (format: string) => {
    const reportData = generateReportData();
    
    if (format === 'pdf') {
      // Create a simple HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { color: #666; margin: 5px 0; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #8b5cf6; }
            .metric { display: inline-block; margin: 10px 20px 10px 0; }
            .metric-value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
            .metric-label { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${reportData.title}</h1>
            <p class="subtitle">Generated for: ${reportData.scope}</p>
            <p class="subtitle">Period: ${reportData.period} | Generated: ${reportData.generatedDate}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="metric">
              <div class="metric-value">${reportData.data.facilities}</div>
              <div class="metric-label">Facilities</div>
            </div>
            <div class="metric">
              <div class="metric-value">${reportData.data.buildings}</div>
              <div class="metric-label">Buildings</div>
            </div>
            <div class="metric">
              <div class="metric-value">${reportData.data.rooms}</div>
              <div class="metric-label">Rooms</div>
            </div>
            <div class="metric">
              <div class="metric-value">${reportData.data.systems}</div>
              <div class="metric-label">Systems</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Performance Overview</h2>
            <table>
              <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
              <tr><td>Active Tasks</td><td>${reportData.data.activeTasks}</td><td>In Progress</td></tr>
              <tr><td>Completed Tasks</td><td>${reportData.data.completedTasks}</td><td>Completed</td></tr>
              <tr><td>Active Renovations</td><td>${reportData.data.renovations}</td><td>Ongoing</td></tr>
            </table>
          </div>
        </body>
        </html>
      `;

      // Create and download PDF
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.title.replace(/\s+/g, '_')}_${reportData.generatedDate.replace(/\//g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Create CSV content
      const csvContent = `Report Type,${reportData.title}
Scope,${reportData.scope}
Period,${reportData.period}
Generated Date,${reportData.generatedDate}

Metric,Value
Facilities,${reportData.data.facilities}
Buildings,${reportData.data.buildings}
Rooms,${reportData.data.rooms}
Systems,${reportData.data.systems}
Active Tasks,${reportData.data.activeTasks}
Completed Tasks,${reportData.data.completedTasks}
Active Renovations,${reportData.data.renovations}`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.title.replace(/\s+/g, '_')}_${reportData.generatedDate.replace(/\//g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      // Create a simple tab-separated format that Excel can open
      const excelContent = `Report Type\t${reportData.title}
Scope\t${reportData.scope}
Period\t${reportData.period}
Generated Date\t${reportData.generatedDate}

Metric\tValue
Facilities\t${reportData.data.facilities}
Buildings\t${reportData.data.buildings}
Rooms\t${reportData.data.rooms}
Systems\t${reportData.data.systems}
Active Tasks\t${reportData.data.activeTasks}
Completed Tasks\t${reportData.data.completedTasks}
Active Renovations\t${reportData.data.renovations}`;

      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.title.replace(/\s+/g, '_')}_${reportData.generatedDate.replace(/\//g, '-')}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadReport = () => {
    downloadReport(reportFormat);
  };

  const handleGenerateReport = () => {
    handleViewReport();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Facility Analytics</h1>
            <p className="text-gray-300 mt-2">Overview of your facilities, buildings, and operations</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last 12 months</option>
            </select>
          </div>
        </div>

        {/* Report Generation Section */}
        <Card className="bg-gray-800/30 border-gray-700/50 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            Generate Facility Reports
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report Configuration */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500"
                >
                  <option value="facility">Facility Overview Report</option>
                  <option value="building">Building Detailed Report</option>
                  <option value="systems">Building Systems Report</option>
                  <option value="renovations">Renovations Summary</option>
                  <option value="maintenance">Maintenance Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Facility
                </label>
                <select
                  value={selectedFacility}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500"
                >
                  {facilities.map(facility => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Building
                </label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500"
                >
                  {getFilteredBuildings().map(building => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Download Format
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pdf"
                      checked={reportFormat === 'pdf'}
                      onChange={(e) => setReportFormat(e.target.value)}
                      className="mr-2 text-purple-600"
                    />
                    <span className="text-gray-300">PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="excel"
                      checked={reportFormat === 'excel'}
                      onChange={(e) => setReportFormat(e.target.value)}
                      className="mr-2 text-purple-600"
                    />
                    <span className="text-gray-300">Excel</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={reportFormat === 'csv'}
                      onChange={(e) => setReportFormat(e.target.value)}
                      className="mr-2 text-purple-600"
                    />
                    <span className="text-gray-300">CSV</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Report Preview/Actions */}
            <div className="space-y-6">
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/50">
                <h3 className="text-lg font-medium text-white mb-3">Report Summary</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-white capitalize">{reportType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Facility:</span>
                    <span className="text-white">
                      {selectedFacility === 'all' ? 'All Facilities' : 
                       facilities.find(f => f.id === selectedFacility)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Building:</span>
                    <span className="text-white">
                      {selectedBuilding === 'all' 
                        ? (selectedFacility === 'all' ? 'All Buildings' : 'All Buildings in Facility')
                        : getFilteredBuildings().find(b => b.id === selectedBuilding)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="text-white capitalize">{timeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="text-white uppercase">{reportFormat}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleViewReport}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Report
                </Button>

                <Button
                  onClick={handleDownloadReport}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Report Link
                </Button>
              </div>

              <div className="text-xs text-gray-400">
                <p>Reports include facility overview, building details, system status, maintenance records, and renovation history based on selected criteria.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Report Preview Modal/Section */}
        {showReportPreview && (
          <Card className="bg-white text-black p-0 mb-8 overflow-hidden">
            {/* Report Header */}
            <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
                <p className="text-gray-600 mt-1">Professional facility management report</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowReportPreview(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Close Preview
              </Button>
            </div>

            {/* Professional Report Content */}
            <div className="p-8 bg-white">
              {/* Report Title Section */}
              <div className="border-b-2 border-purple-600 pb-6 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {reportType.charAt(0).toUpperCase() + reportType.slice(1).replace('_', ' ')} Report
                </h1>
                <div className="text-gray-600 space-y-1">
                  <p><span className="font-medium">Scope:</span> {
                    selectedFacility === 'all' ? 'All Facilities' : 
                    facilities.find(f => f.id === selectedFacility)?.name
                  }{selectedBuilding !== 'all' && 
                    ` - ${getFilteredBuildings().find(b => b.id === selectedBuilding)?.name}`}
                  </p>
                  <p><span className="font-medium">Period:</span> {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}</p>
                  <p><span className="font-medium">Generated:</span> {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-6 text-purple-600">Executive Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {selectedFacility === 'all' ? '5' : '1'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Facilities</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {selectedBuilding === 'all' ? (selectedFacility === 'all' ? '12' : '3') : '1'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Buildings</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {selectedBuilding === 'all' ? '156' : '13'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Rooms</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600 mb-1">
                      {selectedBuilding === 'all' ? '89' : '7'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Systems</div>
                  </div>
                </div>
              </div>

              {/* Performance Overview */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-6 text-purple-600">Performance Overview</h2>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Metric</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Value</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Active Tasks</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">23</td>
                        <td className="px-6 py-4 text-sm text-blue-600">In Progress</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Completed Tasks</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">45</td>
                        <td className="px-6 py-4 text-sm text-green-600">Completed</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Active Renovations</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">2</td>
                        <td className="px-6 py-4 text-sm text-orange-600">Ongoing</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">System Health</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">92%</td>
                        <td className="px-6 py-4 text-sm text-green-600">Excellent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Insights */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-6 text-purple-600">Key Insights</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border-l-4 border-green-400">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-green-800">Positive:</span> System health is at 92%, indicating excellent maintenance practices.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-blue-800">Opportunity:</span> 23 active tasks provide opportunities for operational improvements.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 border-l-4 border-purple-400">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-purple-800">Recommendation:</span> Continue current maintenance schedule to maintain high system performance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200 flex gap-4">
                <Button
                  onClick={handleDownloadReport}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {reportFormat.toUpperCase()}
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Report
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Facilities"
            value={analyticsData.overview.totalFacilities.value}
            trend={analyticsData.overview.totalFacilities.percentage}
            period={analyticsData.overview.totalFacilities.period}
            icon={Building2}
            trendDirection="up"
          />
          <MetricCard
            title="Total Buildings"
            value={analyticsData.overview.totalBuildings.value}
            trend={analyticsData.overview.totalBuildings.percentage}
            period={analyticsData.overview.totalBuildings.period}
            icon={Building2}
            trendDirection="up"
          />
          <MetricCard
            title="Total Rooms"
            value={analyticsData.overview.totalRooms.value}
            trend={analyticsData.overview.totalRooms.percentage}
            period={analyticsData.overview.totalRooms.period}
            icon={Users}
            trendDirection="up"
          />
          <MetricCard
            title="Building Systems"
            value={analyticsData.overview.activeSystems.value}
            trend={analyticsData.overview.activeSystems.percentage}
            period={analyticsData.overview.activeSystems.period}
            icon={Wrench}
            trendDirection="up"
          />
        </div>

        {/* Detailed Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Building Status */}
          <Card className="bg-gray-800/30 border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Building Status
            </h2>
            <div className="space-y-4">
              <ProgressBar
                label="Active Buildings"
                value={analyticsData.buildingStatus.active}
                color="bg-green-500"
              />
              <ProgressBar
                label="Under Maintenance"
                value={analyticsData.buildingStatus.maintenance}
                color="bg-yellow-500"
              />
              <ProgressBar
                label="Inactive"
                value={analyticsData.buildingStatus.inactive}
                color="bg-red-500"
              />
            </div>
          </Card>

          {/* System Types Distribution */}
          <Card className="bg-gray-800/30 border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              Building Systems
            </h2>
            <div className="space-y-4">
              <ProgressBar
                label="HVAC Systems"
                value={analyticsData.systemTypes.hvac}
                color="bg-blue-500"
              />
              <ProgressBar
                label="Electrical Systems"
                value={analyticsData.systemTypes.electrical}
                color="bg-yellow-500"
              />
              <ProgressBar
                label="Plumbing Systems"
                value={analyticsData.systemTypes.plumbing}
                color="bg-cyan-500"
              />
              <ProgressBar
                label="Security Systems"
                value={analyticsData.systemTypes.security}
                color="bg-purple-500"
              />
              <ProgressBar
                label="Fire Safety"
                value={analyticsData.systemTypes.fire}
                color="bg-red-500"
              />
            </div>
          </Card>

          {/* Renovation Projects */}
          <Card className="bg-gray-800/30 border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Renovation Projects
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <StatusCard
                label="Planning"
                value={analyticsData.renovationStatus.planning}
                icon={Calendar}
                color="text-blue-400"
              />
              <StatusCard
                label="In Progress"
                value={analyticsData.renovationStatus.inProgress}
                icon={Activity}
                color="text-yellow-400"
              />
              <StatusCard
                label="Completed"
                value={analyticsData.renovationStatus.completed}
                icon={CheckCircle}
                color="text-green-400"
              />
              <StatusCard
                label="On Hold"
                value={analyticsData.renovationStatus.onHold}
                icon={AlertTriangle}
                color="text-red-400"
              />
            </div>
          </Card>
        </div>

        {/* Bottom Row Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Management */}
          <Card className="bg-gray-800/30 border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              Task Management
            </h2>
            <div className="space-y-4">
              <ProgressBar
                label="Completed Tasks"
                value={analyticsData.taskStatus.completed}
                color="bg-green-500"
              />
              <ProgressBar
                label="In Progress"
                value={analyticsData.taskStatus.inProgress}
                color="bg-blue-500"
              />
              <ProgressBar
                label="New Tasks"
                value={analyticsData.taskStatus.new}
                color="bg-purple-500"
              />
              <ProgressBar
                label="Pending"
                value={analyticsData.taskStatus.pending}
                color="bg-yellow-500"
              />
            </div>
            <div className="mt-4 p-3 bg-gray-900/30 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="text-green-400 font-medium">71 total tasks</span> managed across all facilities.
              </p>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gray-800/30 border-gray-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              Quick Statistics
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Average Rooms per Building</span>
                <span className="text-white font-semibold">13</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Systems per Building</span>
                <span className="text-white font-semibold">7.4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Renovations</span>
                <span className="text-white font-semibold">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Task Completion Rate</span>
                <span className="text-green-400 font-semibold">63%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// MetricCard component
function MetricCard({ 
  title, 
  value, 
  trend, 
  period, 
  icon: Icon,
  trendDirection
}: { 
  title: string;
  value: number;
  trend: string;
  period: string;
  icon: React.ElementType;
  trendDirection: 'up' | 'down';
}) {
  return (
    <Card className="bg-gray-800/30 border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-purple-600/10 rounded-lg">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <span className={`text-sm font-medium ${
          trendDirection === 'up' ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      <p className="text-2xl font-semibold mt-2 text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{period}</p>
    </Card>
  );
}

// ProgressBar component
function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-medium text-white">{value}%</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2">
        <div 
          className={`${color} rounded-full h-2 transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// StatusCard component
function StatusCard({ 
  label, 
  value, 
  icon: Icon,
  color 
}: { 
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-gray-900/30 rounded-lg p-4 text-center border border-gray-700/30">
      <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="text-sm text-gray-300">{label}</p>
    </div>
  );
} 