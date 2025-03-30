import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as XLSX from 'xlsx';
import "./SDashboard.css";

const SDashboard = () => {
  const [selectedBrgy, setSelectedBrgy] = useState("All");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [acceptedUsers, setAcceptedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
  };

  // Fetch accepted users data
  useEffect(() => {
    const fetchAcceptedUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8081/api/users/accepted-users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAcceptedUsers(data);
      } catch (error) {
        console.error('Error fetching accepted users:', error);
        setError('Failed to load accepted users. Please make sure the backend server is running.');
        // Set some mock data for development
        setAcceptedUsers([
          { id: 1, name: "John Doe", accepted_at: "2024-03-30T10:00:00Z" },
          { id: 2, name: "Jane Smith", accepted_at: "2024-03-29T15:30:00Z" },
          { id: 3, name: "Mike Johnson", accepted_at: "2024-03-28T09:15:00Z" }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcceptedUsers();
  }, []);

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

  const getFontSize = (baseSize) => {
    if (windowWidth < 480) return baseSize - 2;
    if (windowWidth < 768) return baseSize - 1;
    return baseSize;
  };

  const commonConfig = {
    grid: {
      top: 60,
      left: '8%',
      right: '5%',
      bottom: '12%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { 
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      padding: [10, 15]
    }
  };

  const populationOption = {
    title: {
      text: 'Monthly Population Trend',
      left: 'center',
      top: 20,
      textStyle: { 
        fontSize: getFontSize(16),
        fontWeight: 500,
        color: '#333'
      }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      axisLine: {
        lineStyle: { color: '#eee' }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      splitLine: {
        lineStyle: { 
          color: '#f5f5f5',
          type: 'dashed'
        }
      }
    },
    series: [{
      name: 'Population',
      type: 'line',
      smooth: true,
      symbolSize: 8,
      data: dashboardData[selectedBrgy].population,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(22, 196, 127, 0.35)'
          }, {
            offset: 1,
            color: 'rgba(22, 196, 127, 0.05)'
          }]
        }
      },
      itemStyle: { 
        color: '#16C47F',
        borderWidth: 2,
        borderColor: '#fff'
      },
      emphasis: {
        itemStyle: {
          borderWidth: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(22, 196, 127, 0.3)'
        }
      }
    }]
  };

  const ageDistributionOption = {
    title: {
      text: 'Age Distribution',
      left: 'center',
      top: 20,
      textStyle: { 
        fontSize: getFontSize(16),
        fontWeight: 500,
        color: '#333'
      }
    },
    ...commonConfig,
    xAxis: {
      type: 'category',
      data: ['18-25', '26-35', '36-45', '46-55', '55+'],
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      axisLine: {
        lineStyle: { color: '#eee' }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        fontSize: getFontSize(11),
        color: '#666'
      },
      splitLine: {
        lineStyle: { 
          color: '#f5f5f5',
          type: 'dashed'
        }
      }
    },
    series: [{
      type: 'bar',
      data: dashboardData[selectedBrgy].ageGroups,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{
            offset: 0,
            color: '#16C47F'
          }, {
            offset: 1,
            color: '#4ECDC4'
          }]
        },
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(22, 196, 127, 0.3)'
        }
      }
    }]
  };

  const employmentOption = {
    title: {
      text: 'User Status',
      left: 'center',
      top: 20,
      textStyle: { 
        fontSize: getFontSize(16),
        fontWeight: 500,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      padding: [10, 15],
      textStyle: { color: '#333' }
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { 
        fontSize: getFontSize(11),
        color: '#666'
      }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 5,
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)'
        }
      },
      data: [
        { 
          value: dashboardData[selectedBrgy].employmentStatus[0], 
          name: 'Verified',
          itemStyle: { color: '#16C47F' }
        },
        { 
          value: dashboardData[selectedBrgy].employmentStatus[1], 
          name: 'Unverified',
          itemStyle: { color: '#FF6B6B' }
        },
        { 
          value: dashboardData[selectedBrgy].employmentStatus[2], 
          name: 'Pending',
          itemStyle: { color: '#4ECDC4' }
        }
      ]
    }]
  };

  const generateExcelReport = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 
        Barangay: selectedBrgy,
        Year: selectedYear,
        TotalPopulation: dashboardData[selectedBrgy].population.reduce((a, b) => a + b, 0),
        VerifiedUsers: dashboardData[selectedBrgy].employmentStatus[0],
        UnverifiedUsers: dashboardData[selectedBrgy].employmentStatus[1],
        PendingUsers: dashboardData[selectedBrgy].employmentStatus[2]
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Report");
    XLSX.writeFile(wb, `Dashboard_Report_${selectedBrgy}_${selectedYear}.xlsx`);
  };

  return (
    <div className="superadmin-dashboard">
      <div className="superadmin-dashboard-header">
        <div className="superadmin-header-content">
          <h1 className="superadmin-dashboard-title">Analytics Overview</h1>
          <p className="superadmin-dashboard-subtitle">Monitor and analyze your data</p>
        </div>
        <div className="superadmin-controls-wrapper">
          <div className="superadmin-filters-container">
            <div className="superadmin-filter-item">
              <label htmlFor="superadmin-barangay-select">Barangay</label>
              <select 
                id="superadmin-barangay-select"
                value={selectedBrgy} 
                onChange={(e) => setSelectedBrgy(e.target.value)}
                className="superadmin-filter-select"
              >
                {barangays.map((brgy) => (
                  <option key={brgy} value={brgy}>{brgy}</option>
                ))}
              </select>
            </div>
            <div className="superadmin-filter-item">
              <label htmlFor="superadmin-year-select">Year</label>
              <select 
                id="superadmin-year-select"
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="superadmin-filter-select"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button 
              className="superadmin-generate-btn" 
              onClick={generateExcelReport}
              title="Generate Excel Report"
            >
              <i className="fas fa-file-excel"></i>
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="superadmin-charts-grid">
        <div className="superadmin-chart-card superadmin-population-trend">
          <ReactECharts 
            ref={(e) => { chartsRef.current[0] = e; }}
            option={populationOption}
            style={{ height: '400px' }}
          />
        </div>

        <div className="superadmin-chart-card superadmin-age-distribution">
          <ReactECharts 
            ref={(e) => { chartsRef.current[1] = e; }}
            option={ageDistributionOption}
            style={{ height: '300px' }}
          />
        </div>

      
        <div className="superadmin-chart-card superadmin-user-status">
          <ReactECharts 
            ref={(e) => { chartsRef.current[2] = e; }}
            option={employmentOption}
            style={{ height: '300px' }}
          />
        </div>

        <div className="superadmin-data-table-container">
          <h2>Accepted Users</h2>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <div className="table-responsive">
            {isLoading ? (
              <div className="loading-message">
                Loading accepted users...
              </div>
            ) : (
              <table className="accepted-users-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedUsers.map((user, index) => (
                    <tr key={`${user.name}-${user.accepted_at}-${index}`}>
                      <td>{index + 1}</td>
                      <td><strong>{user.name}</strong> accepted <strong>{new Date(user.accepted_at).toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SDashboard;