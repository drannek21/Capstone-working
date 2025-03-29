import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import "./Admin-contend-Dashboard.css";

const Dashboard = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);
  const chartsRef = useRef([]);
  
  // Mock data for the admin's barangay
  const [adminInfo, setAdminInfo] = useState({
    id: 1,
    username: "admin_user",
    barangay: "Barangay 123",
    role: "admin"
  });
  
  // Mock dashboard data
  const [dashboardData, setDashboardData] = useState({
    population: [43, 44, 46, 46, 48, 50, 51, 53, 54, 56, 57, 62],
    ageDistribution: [
      { name: '0-18', value: 25 },
      { name: '19-30', value: 35 },
      { name: '31-45', value: 22 },
      { name: '46-60', value: 15 },
      { name: '60+', value: 8 }
    ],
    genderDistribution: [
      { name: 'Female', value: 150 },
      { name: 'Male', value: 80 },
      { name: 'LGBTQ+', value: 10 }
    ],
    classificationDistribution: [
      { name: 'PWD', value: 15 },
      { name: 'Senior Citizen', value: 30 },
      { name: 'Solo Parent', value: 25 },
      { name: 'Indigenous', value: 10 },
      { name: 'Other', value: 20 }
    ],
    monthlyRegistrations: [5, 8, 12, 7, 10, 15, 9, 6, 11, 14, 8, 10],
    incomeDistribution: [
      { name: 'Below ₱10,000', value: 45 },
      { name: '₱10,000-₱20,000', value: 30 },
      { name: '₱20,000-₱30,000', value: 15 },
      { name: 'Above ₱30,000', value: 10 }
    ],
    educationDistribution: [
      { name: 'Elementary', value: 20 },
      { name: 'High School', value: 40 },
      { name: 'College', value: 25 },
      { name: 'Vocational', value: 10 },
      { name: 'Post-Graduate', value: 5 }
    ],
    employmentStatus: [
      { name: 'Employed', value: 55 },
      { name: 'Unemployed', value: 25 },
      { name: 'Self-employed', value: 15 },
      { name: 'Retired', value: 5 }
    ]
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

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
      name: `Population (${adminInfo.barangay})`,
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
  const registrationsOption = {
    title: {
      text: 'Monthly Registrations',
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
      name: `New Registrations (${adminInfo.barangay})`,
      type: 'bar',
      barWidth: '40%',
      data: dashboardData.monthlyRegistrations,
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

  // Gender Distribution Chart
  const genderDistributionOption = {
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
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10,
        padding: [0, 0, 0, 2]
      }
    },
    series: [{
      name: 'Gender Distribution',
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 10 : 12,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: dashboardData.genderDistribution.map(item => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: item.name === 'Female' ? '#FF69B4' : 
                 item.name === 'Male' ? '#16C47F' : '#9B59B6'
        }
      }))
    }]
  };

  // Age Distribution Chart
  const ageDistributionOption = {
    title: {
      text: 'Age Distribution',
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
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10,
        padding: [0, 0, 0, 2]
      }
    },
    series: [{
      name: 'Age Distribution',
      type: 'pie',
      radius: '65%',
      center: ['50%', '45%'],
      roseType: 'radius',
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 10 : 12,
          fontWeight: 'bold'
        }
      },
      data: dashboardData.ageDistribution.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: [
            '#FF9F43', '#1ABC9C', '#3498DB', '#9B59B6', '#34495E'
          ][index % 5]
        }
      }))
    }]
  };

  // Classification Distribution Chart
  const classificationOption = {
    title: {
      text: 'Beneficiary Classification',
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
        type: 'shadow'
      }
    },
    grid: {
      top: 40,
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dashboardData.classificationDistribution.map(item => item.name),
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10,
        interval: 0,
        rotate: windowWidth < 768 ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: 'Count',
      type: 'bar',
      barWidth: '60%',
      data: dashboardData.classificationDistribution.map((item, index) => ({
        value: item.value,
        itemStyle: {
          color: [
            '#FF9F43', '#1ABC9C', '#3498DB', '#9B59B6', '#34495E'
          ][index % 5]
        }
      })),
      label: {
        show: true,
        position: 'top',
        fontSize: windowWidth < 768 ? 9 : 10
      }
    }]
  };

  // Income Distribution Chart
  const incomeOption = {
    title: {
      text: 'Income Distribution',
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
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10,
        padding: [0, 0, 0, 2]
      }
    },
    series: [{
      name: 'Income Distribution',
      type: 'pie',
      radius: ['30%', '60%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 10 : 12,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: dashboardData.incomeDistribution.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: [
            '#2ECC71', '#3498DB', '#9B59B6', '#F1C40F'
          ][index % 4]
        }
      }))
    }]
  };

  // Education Distribution Chart
  const educationOption = {
    title: {
      text: 'Education Level',
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
        type: 'shadow'
      }
    },
    grid: {
      top: 40,
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    yAxis: {
      type: 'category',
      data: dashboardData.educationDistribution.map(item => item.name),
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: 'Count',
      type: 'bar',
      barWidth: '60%',
      data: dashboardData.educationDistribution.map((item, index) => ({
        value: item.value,
        itemStyle: {
          color: [
            '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'
          ][index % 5]
        }
      })),
      label: {
        show: true,
        position: 'right',
        fontSize: windowWidth < 768 ? 9 : 10
      }
    }]
  };

  // Employment Status Chart
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
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10,
        padding: [0, 0, 0, 2]
      }
    },
    series: [{
      name: 'Employment Status',
      type: 'pie',
      radius: '65%',
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: true,
        formatter: '{b}: {d}%',
        fontSize: windowWidth < 768 ? 9 : 10
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 10 : 12,
          fontWeight: 'bold'
        }
      },
      data: dashboardData.employmentStatus.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: [
            '#27AE60', '#E74C3C', '#F39C12', '#7F8C8D'
          ][index % 4]
        }
      }))
    }]
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {adminInfo ? `${adminInfo.barangay} Dashboard` : 'Loading...'}
        </h2>
        <div className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <div className="charts-container">
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>Total Beneficiaries</h3>
                <p className="stat-value">{dashboardData.population[11]}</p>
                <p className="stat-change positive">+{dashboardData.population[11] - dashboardData.population[10]} this month</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="stat-content">
                <h3>New Registrations</h3>
                <p className="stat-value">{dashboardData.monthlyRegistrations[11]}</p>
                <p className="stat-change positive">+{dashboardData.monthlyRegistrations[11] - dashboardData.monthlyRegistrations[10]} from last month</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-wheelchair"></i>
              </div>
              <div className="stat-content">
                <h3>PWD Beneficiaries</h3>
                <p className="stat-value">{dashboardData.classificationDistribution[0].value}</p>
                <p className="stat-change neutral">{Math.round(dashboardData.classificationDistribution[0].value / dashboardData.population[11] * 100)}% of total</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-user-graduate"></i>
              </div>
              <div className="stat-content">
                <h3>College Educated</h3>
                <p className="stat-value">{dashboardData.educationDistribution[2].value}</p>
                <p className="stat-change neutral">{Math.round(dashboardData.educationDistribution[2].value / dashboardData.population[11] * 100)}% of total</p>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-wrapper population-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[0] = e; }}
                option={populationOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
            
            <div className="chart-wrapper registrations-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[1] = e; }}
                option={registrationsOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-wrapper gender-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[2] = e; }}
                option={genderDistributionOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>

            <div className="chart-wrapper age-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[3] = e; }}
                option={ageDistributionOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-wrapper income-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[4] = e; }}
                option={incomeOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>

            <div className="chart-wrapper employment-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[5] = e; }}
                option={employmentOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-wrapper classification-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[6] = e; }}
                option={classificationOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>

            <div className="chart-wrapper education-chart">
              <ReactECharts 
                ref={(e) => { chartsRef.current[7] = e; }}
                option={educationOption}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
