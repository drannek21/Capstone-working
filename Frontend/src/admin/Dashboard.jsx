import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as XLSX from 'xlsx';
import "./Admin-contend-Dashboard.css";

const API_URL = 'http://localhost:8081';

const Dashboard = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const chartsRef = useRef([]);
  
  // Get admin info from localStorage
  const [adminInfo, setAdminInfo] = useState(() => {
    const id = localStorage.getItem('id');
    const barangay = localStorage.getItem('barangay');
    console.log('Admin Info from localStorage:', { id, barangay });
    return { id, barangay };
  });
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    population: Array(12).fill(0),
    monthlyRemarks: Array(12).fill(0),
    genderDistribution: [
      { name: 'Female', value: 0 },
      { name: 'Male', value: 0 },
      { name: 'LGBTQ+', value: 0 }
    ],
    employmentStatus: [
      { name: 'Employed', value: 0 },
      { name: 'Self-employed', value: 0 },
      { name: 'Not employed', value: 0 }
    ]
  });

  // Add useEffect to fetch admin info if not in localStorage
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const adminId = localStorage.getItem('id');
        if (!adminId) {
          console.error('No admin ID found in localStorage');
          return;
        }

        const response = await fetch(`${API_URL}/api/users/admin-info?id=${adminId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch admin info');
        }
        const data = await response.json();
        console.log('Fetched admin info:', data);
        
        // Update localStorage with the fetched barangay
        localStorage.setItem('barangay', data.barangay);
        
        // Update state with the fetched data
        setAdminInfo({
          id: data.id,
          barangay: data.barangay
        });
      } catch (error) {
        console.error('Error fetching admin info:', error);
      }
    };

    fetchAdminInfo();
  }, []);

  // Update the dashboard title to handle undefined barangay
  const dashboardTitle = adminInfo.barangay ? `${adminInfo.barangay} Dashboard` : 'Loading Dashboard...';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data for admin:', adminInfo);
        if (!adminInfo.id) {
          console.error('No admin ID found');
          setLoading(false);
          return;
        }

        // Build query string with date filters
        let queryString = `adminId=${adminInfo.id}`;
        if (startDate && endDate) {
          queryString += `&startDate=${startDate}&endDate=${endDate}`;
        }

        // Fetch population data for admin's barangay
        const populationResponse = await fetch(`${API_URL}/api/users/admin-population-users?${queryString}`);
        if (!populationResponse.ok) {
          throw new Error(`HTTP error! status: ${populationResponse.status}`);
        }
        const populationData = await populationResponse.json();
        console.log('Population data:', populationData);

        // Fetch remarks data
        const remarksResponse = await fetch(`${API_URL}/api/users/remarks-users?${queryString}`);
        if (!remarksResponse.ok) {
          throw new Error(`HTTP error! status: ${remarksResponse.status}`);
        }
        const remarksData = await remarksResponse.json();
        
        // Process the data
        const monthlyData = Array(12).fill(0);
        const monthlyRemarksData = Array(12).fill(0);
        const genderCounts = { Female: 0, Male: 0, 'LGBTQ+': 0 };
        const employmentCounts = { 
          'Employed': 0, 
          'Self-employed': 0, 
          'Not employed': 0 
        };

        // Process population data
        populationData.forEach(user => {
          const date = new Date(user.accepted_at);
          const month = date.getMonth();
          monthlyData[month]++;

          // Count gender
          const gender = standardizeGender(user.gender);
          if (gender) {
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
          }

          // Count employment status
          const status = standardizeEmploymentStatus(user.employment_status);
          employmentCounts[status] = (employmentCounts[status] || 0) + 1;
        });

        // Process remarks data
        remarksData.forEach(remark => {
          const date = new Date(remark.remarks_at);
          const month = date.getMonth();
          monthlyRemarksData[month]++;
        });

        console.log('Gender counts:', genderCounts);

        // Update dashboard data
        setDashboardData({
          population: monthlyData,
          monthlyRemarks: monthlyRemarksData,
          genderDistribution: Object.entries(genderCounts).map(([name, value]) => ({ 
            name, 
            value,
            itemStyle: {
              color: name === 'Female' ? '#FF69B4' : name === 'Male' ? '#4169E1' : '#9370DB'
            }
          })),
          employmentStatus: Object.entries(employmentCounts).map(([name, value]) => ({ name, value }))
        });

        // Add a small delay before setting loading to false
        setTimeout(() => {
          setLoading(false);
        }, 100);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    if (adminInfo.id) {
      fetchDashboardData();
    } else {
      console.error('No admin ID found, skipping data fetch');
      setLoading(false);
    }
  }, [adminInfo.id, startDate, endDate]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      chartsRef.current.forEach(chart => {
        if (chart) {
          chart.getEchartsInstance().resize();
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Population Growth Chart
  const populationOption = {
    title: {
      text: 'Population Growth',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line'
      }
    },
    grid: {
      top: 40,
      left: '8%',
      right: '5%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10,
        interval: windowWidth < 480 ? 2 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Population (${adminInfo.barangay})` : 'Population',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: dashboardData.population,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(22, 196, 127, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(22, 196, 127, 0.05)'
          }]
        }
      },
      lineStyle: {
        width: 2,
        color: '#16C47F'
      },
      itemStyle: {
        color: '#16C47F',
        borderWidth: 2
      }
    }]
  };

  // Monthly Registrations Chart
  const remarksOption = {
    title: {
      text: 'Monthly Remarks',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      top: 40,
      left: '12%',
      right: '5%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10,
        interval: windowWidth < 480 ? 2 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Remarks (${adminInfo.barangay})` : 'Remarks',
      type: 'bar',
      barWidth: '40%',
      data: dashboardData.monthlyRemarks,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: '#3498DB'
          }, {
            offset: 1,
            color: 'rgba(52, 152, 219, 0.3)'
          }]
        },
        borderRadius: [3, 3, 0, 0]
      }
    }]
  };

  // Add gender chart option
  const genderOption = {
    title: {
      text: 'Gender Distribution',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Gender (${adminInfo.barangay})` : 'Gender',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 12 : 14,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: dashboardData.genderDistribution
    }]
  };

  // Add employment status chart option
  const employmentOption = {
    title: {
      text: 'Employment Status',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Employment (${adminInfo.barangay})` : 'Employment',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 12 : 14,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: dashboardData.employmentStatus.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: [
            '#27AE60', // Employed - Green
            '#F1C40F', // Self-employed - Yellow
            '#E74C3C'  // Not employed - Red
          ][index % 3]
        }
      }))
    }]
  };

  // Update the date validation function
  const validateDates = (start, end) => {
    // Clear previous error
    setDateError("");

    // Get current year
    const currentYear = new Date().getFullYear();

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Check if either date's year is in the future
      if (startDate.getFullYear() > currentYear || endDate.getFullYear() > currentYear) {
        setDateError("Cannot select future years");
        return false;
      }

      // Check if end date is before start date
      if (endDate < startDate) {
        setDateError("End date cannot be earlier than start date");
        return false;
      }
    }
    return true;
  };

  // Update the date change handlers
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    if (validateDates(newStartDate, endDate)) {
      setStartDate(newStartDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (validateDates(startDate, newEndDate)) {
      setEndDate(newEndDate);
    }
  };

  // Update the generateExcelReport function
  const generateExcelReport = async () => {
    if (!startDate || !endDate) {
      setDateError('Please select both start and end dates for the report');
      return;
    }

    if (!validateDates(startDate, endDate)) {
      return;
    }

    try {
      // Fetch population data with date range
      const populationResponse = await fetch(
        `${API_URL}/api/users/admin-population-users?adminId=${adminInfo.id}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!populationResponse.ok) {
        throw new Error('Failed to fetch population data');
      }

      const populationData = await populationResponse.json();

      // Fetch remarks data with date range
      const remarksResponse = await fetch(
        `${API_URL}/api/users/remarks-users?adminId=${adminInfo.id}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!remarksResponse.ok) {
        throw new Error('Failed to fetch remarks data');
      }

      const remarksData = await remarksResponse.json();

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summarySheet = XLSX.utils.json_to_sheet([
        { 
          Barangay: adminInfo.barangay,
          StartDate: new Date(startDate).toLocaleDateString(),
          EndDate: new Date(endDate).toLocaleDateString(),
          TotalPopulation: populationData.length,
          TotalRemarks: remarksData.length,
          VerifiedUsers: populationData.filter(user => user.status === 'Verified').length,
          PendingRemarksUsers: populationData.filter(user => user.status === 'Pending Remarks').length,
          TerminatedUsers: populationData.filter(user => user.status === 'Terminated').length
        }
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Sheet 2: Monthly Population Data
      const monthNames = ["January", "February", "March", "April", "May", "June", 
                           "July", "August", "September", "October", "November", "December"];
      const monthlyPopulationData = Array(12).fill(0);
      
      populationData.forEach(user => {
        const date = new Date(user.accepted_at);
        const month = date.getMonth();
        monthlyPopulationData[month]++;
      });

      const monthlyPopulationSheet = XLSX.utils.json_to_sheet(
        monthNames.map((month, index) => ({
          Month: month,
          Population: monthlyPopulationData[index]
        }))
      );
      XLSX.utils.book_append_sheet(wb, monthlyPopulationSheet, "Monthly Population");

      // Sheet 3: Monthly Remarks Data
      const monthlyRemarksData = Array(12).fill(0);
      
      remarksData.forEach(remark => {
        const date = new Date(remark.remarks_at);
        const month = date.getMonth();
        monthlyRemarksData[month]++;
      });

      const monthlyRemarksSheet = XLSX.utils.json_to_sheet(
        monthNames.map((month, index) => ({
          Month: month,
          Remarks: monthlyRemarksData[index]
        }))
      );
      XLSX.utils.book_append_sheet(wb, monthlyRemarksSheet, "Monthly Remarks");

      // Sheet 4: Gender Distribution
      const genderCounts = { 
        Female: 0, 
        Male: 0, 
        'LGBTQ+': 0 
      };

      populationData.forEach(user => {
        if (user.gender) {
          const gender = standardizeGender(user.gender);
          if (gender) {
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
          }
        }
      });

      const genderSheet = XLSX.utils.json_to_sheet([
        {
          Category: 'Gender Distribution',
          Female: genderCounts.Female,
          Male: genderCounts.Male,
          LGBTQ: genderCounts['LGBTQ+']
        }
      ]);
      XLSX.utils.book_append_sheet(wb, genderSheet, "Gender Distribution");

      // Sheet 5: Employment Status
      const employmentCounts = {
        'Employed': 0,
        'Self-employed': 0,
        'Not employed': 0
      };

      populationData.forEach(user => {
        const status = standardizeEmploymentStatus(user.employment_status);
        employmentCounts[status] = (employmentCounts[status] || 0) + 1;
      });

      const employmentSheet = XLSX.utils.json_to_sheet([
        {
          Category: 'Employment Status',
          Employed: employmentCounts['Employed'],
          'Self-employed': employmentCounts['Self-employed'],
          'Not employed': employmentCounts['Not employed']
        }
      ]);
      XLSX.utils.book_append_sheet(wb, employmentSheet, "Employment Status");

      // Save the workbook
      XLSX.writeFile(wb, `Dashboard_Report_${adminInfo.barangay}_${startDate}_to_${endDate}.xlsx`);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  // Add helper function for employment status
  const standardizeEmploymentStatus = (status) => {
    if (!status) return 'Not employed';
    
    status = status.toLowerCase().trim();
    
    if (status.includes('self') || status.includes('self-employed') || status.includes('business')) {
      return 'Self-employed';
    } else if (status.includes('employ') || status.includes('working')) {
      return 'Employed';
    } else {
      return 'Not employed';
    }
  };

  // Add helper function for standardizing gender
  const standardizeGender = (gender) => {
    if (!gender) return null;
    
    gender = gender.toLowerCase().trim();
    
    if (gender.includes('female')) {
      return 'Female';
    } else if (gender.includes('male') && !gender.includes('female')) {
      return 'Male';
    } else if (gender.includes('lgbtq') || gender.includes('lgbt') || gender.includes('+')) {
      return 'LGBTQ+';
    }
    
    return null;
  };

  // Add a function to get the max date allowed (last day of current year)
  const getMaxDateForInput = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-12-31`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{dashboardTitle}</h1>
          <p className="dashboard-subtitle">View and analyze your barangay's population data</p>
        </div>
        
        <div className="dashboard-controls">
          <div className="date-filters">
            <div className="date-input-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                className="date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                className="date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <button className="export-btn" onClick={generateExcelReport}>
            <i className="fas fa-download"></i>
            Export Data
          </button>
        </div>
        
        {dateError && <p className="date-error">{dateError}</p>}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card population-trend">
            <h2>Population Growth</h2>
            <ReactECharts
              ref={(e) => { chartsRef.current[0] = e; }}
              option={populationOption}
              style={{ height: '400px' }}
            />
          </div>
          
          <div className="chart-card">
            <h2>Gender Distribution</h2>
            <ReactECharts
              ref={(e) => { chartsRef.current[1] = e; }}
              option={genderOption}
              style={{ height: '300px' }}
            />
          </div>
          
          <div className="chart-card">
            <h2>Employment Status</h2>
            <ReactECharts
              ref={(e) => { chartsRef.current[2] = e; }}
              option={employmentOption}
              style={{ height: '300px' }}
            />
          </div>
          
          <div className="chart-card">
            <h2>Monthly Remarks</h2>
            <ReactECharts
              ref={(e) => { chartsRef.current[3] = e; }}
              option={remarksOption}
              style={{ height: '300px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
