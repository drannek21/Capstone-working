import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as XLSX from 'xlsx';
import "./SDashboard.css";

const SDashboard = () => {
  const [selectedBrgy, setSelectedBrgy] = useState("All");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const chartsRef = useRef([]);
  
  const barangays = ["All", "Brgy 1", "Brgy 2", "Brgy 3", "Brgy 4"];
  const years = ["2024", "2023", "2022"];

  // Mock data structure
  const dashboardData = {
    "All": {
      population: [43, 44, 46, 46, 48, 50, 51, 53, 54, 56, 57, 62],
      growth: [10, 12, 8, 15],
      distribution: [150, 80, 10],
      ageGroups: [25, 45, 30, 15, 10],
      employmentStatus: [120, 80, 40],
      educationLevel: [30, 45, 55, 35],
      incomeDistribution: [20, 35, 45, 30, 10],
      applicationStatus: [150, 50, 30],
      assistanceTypes: [40, 35, 45, 30, 20]
    },
    // ... similar data structure for other barangays
  };

  // Resize handler with debounce
  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowWidth(window.innerWidth);
        chartsRef.current.forEach(chart => {
          if (chart) {
            chart.getEchartsInstance().resize();
          }
        });
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Dynamic font size calculation
  const getFontSize = (baseSize) => {
    if (windowWidth < 480) return baseSize - 2;
    if (windowWidth < 768) return baseSize - 1;
    return baseSize;
  };

  // Common chart configurations
  const commonConfig = {
    grid: {
      top: 40,
      left: '8%',
      right: '5%',
      bottom: '12%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    }
  };

  // Chart options
  const populationOption = {
    title: {
      text: 'Monthly Population Trend',
      left: 'center',
      top: 5,
      textStyle: { fontSize: getFontSize(14) }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisLabel: { fontSize: getFontSize(10) }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: getFontSize(10) }
    },
    series: [{
      name: 'Population',
      type: 'line',
      smooth: true,
      data: dashboardData[selectedBrgy].population,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(22, 196, 127, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(22, 196, 127, 0.05)'
          }]
        }
      },
      itemStyle: { color: '#16C47F' }
    }]
  };

  const ageDistributionOption = {
    title: {
      text: 'Age Distribution',
      left: 'center',
      top: 5,
      textStyle: { fontSize: getFontSize(14) }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ['18-25', '26-35', '36-45', '46-55', '55+'],
      axisLabel: { fontSize: getFontSize(10) }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: getFontSize(10) }
    },
    series: [{
      type: 'bar',
      data: dashboardData[selectedBrgy].ageGroups,
      itemStyle: {
        color: '#16C47F',
        borderRadius: [3, 3, 0, 0]
      }
    }]
  };

  const employmentOption = {
    title: {
      text: 'Employment Status',
      left: 'center',
      top: 5,
      textStyle: { fontSize: getFontSize(14) }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: getFontSize(10) }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      label: { show: false },
      data: [
        { value: dashboardData[selectedBrgy].employmentStatus[0], name: 'Employed', itemStyle: { color: '#16C47F' } },
        { value: dashboardData[selectedBrgy].employmentStatus[1], name: 'Unemployed', itemStyle: { color: '#FF6B6B' } },
        { value: dashboardData[selectedBrgy].employmentStatus[2], name: 'Self-employed', itemStyle: { color: '#4ECDC4' } }
      ]
    }]
  };

  const educationOption = {
    title: {
      text: 'Education Level',
      left: 'center',
      top: 5,
      textStyle: { fontSize: getFontSize(14) }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ['Elementary', 'High School', 'College', 'Vocational'],
      axisLabel: { fontSize: getFontSize(10), interval: 0, rotate: windowWidth < 480 ? 30 : 0 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: getFontSize(10) }
    },
    series: [{
      type: 'bar',
      data: dashboardData[selectedBrgy].educationLevel,
      itemStyle: {
        color: '#16C47F',
        borderRadius: [3, 3, 0, 0]
      }
    }]
  };

  const incomeOption = {
    title: {
      text: 'Monthly Income Distribution',
      left: 'center',
      top: 5,
      textStyle: { fontSize: getFontSize(14) }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ['<10k', '10k-20k', '20k-30k', '30k-40k', '>40k'],
      axisLabel: { fontSize: getFontSize(10) }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: getFontSize(10) }
    },
    series: [{
      type: 'bar',
      data: dashboardData[selectedBrgy].incomeDistribution,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{
            offset: 0,
            color: '#16C47F'
          }, {
            offset: 1,
            color: 'rgba(22, 196, 127, 0.3)'
          }]
        },
        borderRadius: [3, 3, 0, 0]
      }
    }]
  };

  const applicationStatusOption = {
    title: {
      text: 'Application Status',
      left: 'center',
      top: 5,
      textStyle: { fontSize: getFontSize(14) }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: getFontSize(10) }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      label: { show: false },
      data: [
        { value: dashboardData[selectedBrgy].applicationStatus[0], name: 'Approved', itemStyle: { color: '#16C47F' } },
        { value: dashboardData[selectedBrgy].applicationStatus[1], name: 'Pending', itemStyle: { color: '#FFD93D' } },
        { value: dashboardData[selectedBrgy].applicationStatus[2], name: 'Declined', itemStyle: { color: '#FF6B6B' } }
      ]
    }]
  };

  const assistanceTypesOption = {
    title: {
      text: 'Types of Assistance',
      left: 'center',
      top: 5,
      textStyle: { fontSize: getFontSize(14) }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ['Financial', 'Medical', 'Educational', 'Housing', 'Others'],
      axisLabel: { fontSize: getFontSize(10), interval: 0, rotate: windowWidth < 480 ? 30 : 0 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: getFontSize(10) }
    },
    series: [{
      type: 'bar',
      data: dashboardData[selectedBrgy].assistanceTypes,
      itemStyle: {
        color: '#16C47F',
        borderRadius: [3, 3, 0, 0]
      }
    }]
  };

  const generateExcelReport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Generate sheets for each dataset
      const sheets = {
        'Population Trend': {
          headers: ['Month', 'Population'],
          data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, idx) => [
            month,
            dashboardData[selectedBrgy].population[idx]
          ])
        },
        'Age Distribution': {
          headers: ['Age Group', 'Count'],
          data: ['18-25', '26-35', '36-45', '46-55', '55+'].map((group, idx) => [
            group,
            dashboardData[selectedBrgy].ageGroups[idx]
          ])
        },
        'Employment Status': {
          headers: ['Status', 'Count'],
          data: [
            ['Employed', dashboardData[selectedBrgy].employmentStatus[0]],
            ['Unemployed', dashboardData[selectedBrgy].employmentStatus[1]],
            ['Self-employed', dashboardData[selectedBrgy].employmentStatus[2]]
          ]
        },
        'Education Level': {
          headers: ['Level', 'Count'],
          data: ['Elementary', 'High School', 'College', 'Vocational'].map((level, idx) => [
            level,
            dashboardData[selectedBrgy].educationLevel[idx]
          ])
        },
        'Income Distribution': {
          headers: ['Range', 'Count'],
          data: ['<10k', '10k-20k', '20k-30k', '30k-40k', '>40k'].map((range, idx) => [
            range,
            dashboardData[selectedBrgy].incomeDistribution[idx]
          ])
        },
        'Application Status': {
          headers: ['Status', 'Count'],
          data: [
            ['Approved', dashboardData[selectedBrgy].applicationStatus[0]],
            ['Pending', dashboardData[selectedBrgy].applicationStatus[1]],
            ['Declined', dashboardData[selectedBrgy].applicationStatus[2]]
          ]
        },
        'Assistance Types': {
          headers: ['Type', 'Count'],
          data: ['Financial', 'Medical', 'Educational', 'Housing', 'Others'].map((type, idx) => [
            type,
            dashboardData[selectedBrgy].assistanceTypes[idx]
          ])
        }
      };

      // Add each sheet to workbook
      Object.entries(sheets).forEach(([sheetName, { headers, data }]) => {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `Solo_Parent_Report_${selectedBrgy}_${date}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Analytics Dashboard</h2>
        <div className="header-controls">
          <div className="filters-container">
            <div className="filter-item">
              <label htmlFor="barangay-select">Barangay:</label>
              <select 
                id="barangay-select"
                value={selectedBrgy} 
                onChange={(e) => setSelectedBrgy(e.target.value)}
                className="filter-select"
              >
                {barangays.map((brgy) => (
                  <option key={brgy} value={brgy}>{brgy}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label htmlFor="year-select">Year:</label>
              <select 
                id="year-select"
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            className="generate-btn" 
            onClick={generateExcelReport}
            title="Generate Excel Report"
          >
            <i className="fas fa-file-excel"></i>
            Generate Report
          </button>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card population-trend">
          <ReactECharts 
            ref={(e) => { chartsRef.current[0] = e; }}
            option={populationOption}
            style={{ height: '100%', minHeight: '300px' }}
          />
        </div>

        <div className="chart-card age-distribution">
          <ReactECharts 
            ref={(e) => { chartsRef.current[1] = e; }}
            option={ageDistributionOption}
            style={{ height: '100%', minHeight: '300px' }}
          />
        </div>

        <div className="chart-card employment-status">
          <ReactECharts 
            ref={(e) => { chartsRef.current[2] = e; }}
            option={employmentOption}
            style={{ height: '100%', minHeight: '300px' }}
          />
        </div>

        <div className="chart-card education-level">
          <ReactECharts 
            ref={(e) => { chartsRef.current[3] = e; }}
            option={educationOption}
            style={{ height: '100%', minHeight: '300px' }}
          />
        </div>

        <div className="chart-card income-distribution">
          <ReactECharts 
            ref={(e) => { chartsRef.current[4] = e; }}
            option={incomeOption}
            style={{ height: '100%', minHeight: '300px' }}
          />
        </div>

        <div className="chart-card application-status">
          <ReactECharts 
            ref={(e) => { chartsRef.current[5] = e; }}
            option={applicationStatusOption}
            style={{ height: '100%', minHeight: '300px' }}
          />
        </div>

        <div className="chart-card assistance-types">
          <ReactECharts 
            ref={(e) => { chartsRef.current[6] = e; }}
            option={assistanceTypesOption}
            style={{ height: '100%', minHeight: '300px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default SDashboard;