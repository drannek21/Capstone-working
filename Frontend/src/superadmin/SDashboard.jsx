import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import "./SDashboard.css";

const SDashboard = () => {
  const [selectedBrgy, setSelectedBrgy] = useState("All");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const chartsRef = useRef([]);
  
  const barangays = ["All", "Brgy 1", "Brgy 2", "Brgy 3", "Brgy 4"];

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
      }, 250); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    
    // Initial render
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Update charts when data changes
  useEffect(() => {
    // Small timeout to ensure state has updated
    const updateTimeout = setTimeout(() => {
      chartsRef.current.forEach(chart => {
        if (chart) {
          chart.getEchartsInstance().resize();
        }
      });
    }, 100);
    
    return () => clearTimeout(updateTimeout);
  }, [selectedBrgy]);

  const brgyData = {
    "All": { population: [43, 44, 46, 46, 48, 50, 51, 53, 54, 56, 57, 62], growth: [10, 12, 8, 15], distribution: [150, 80, 10] },
    "Brgy 1": { population: [20, 22, 23, 25, 26, 28, 30, 31, 33, 35, 37, 40], growth: [5, 6, 4, 7], distribution: [50, 30, 5] },
    "Brgy 2": { population: [15, 17, 18, 19, 21, 23, 24, 26, 28, 29, 31, 34], growth: [3, 4, 2, 5], distribution: [40, 25, 3] },
    "Brgy 3": { population: [10, 11, 12, 14, 15, 17, 18, 20, 21, 22, 23, 25], growth: [2, 3, 2, 4], distribution: [30, 20, 2] },
    "Brgy 4": { population: [8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 21], growth: [1, 2, 2, 3], distribution: [20, 15, 1] },
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  // Dynamic font size calculation based on screen width
  const getFontSize = (baseSize) => {
    if (windowWidth < 480) return baseSize - 2;
    if (windowWidth < 768) return baseSize - 1;
    return baseSize;
  };

  const populationOption = {
    title: {
      text: 'Population Growth',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: getFontSize(14),
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line'
      },
      formatter: (params) => {
        const data = params[0];
        return `${data.name}: <strong>${data.value}</strong> residents`;
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
        fontSize: getFontSize(10),
        interval: windowWidth < 480 ? 2 : 0,
        rotate: windowWidth < 480 ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: getFontSize(10)
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0,0,0,0.05)'
        }
      }
    },
    series: [{
      name: `Population (${selectedBrgy})`,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: brgyData[selectedBrgy].population,
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

  const growthOption = {
    title: {
      text: 'Quarterly Growth',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: getFontSize(14),
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0];
        return `${data.name}: <strong>${data.value}%</strong> growth`;
      }
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
      data: quarters,
      axisLabel: {
        fontSize: getFontSize(10)
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: getFontSize(10),
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0,0,0,0.05)'
        }
      }
    },
    series: [{
      name: `Growth (${selectedBrgy})`,
      type: 'bar',
      barWidth: '40%',
      data: brgyData[selectedBrgy].growth,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: '#16C47F'
          }, {
            offset: 1,
            color: 'rgba(22, 196, 127, 0.3)'
          }]
        },
        borderRadius: [3, 3, 0, 0]
      },
      label: {
        show: windowWidth > 768,
        position: 'top',
        formatter: '{c}%',
        fontSize: getFontSize(10)
      }
    }]
  };

  const distributionOption = {
    title: {
      text: 'Population by Gender',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: getFontSize(14),
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <strong>{c}</strong> ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      itemWidth: 8,
      itemHeight: 8,
      data: ['Female', 'Male', 'LGBTQ+'],
      textStyle: {
        fontSize: getFontSize(10),
        padding: [0, 0, 0, 2]
      }
    },
    series: [{
      name: 'Gender Distribution',
      type: 'pie',
      radius: windowWidth < 480 ? ['30%', '60%'] : ['35%', '65%'],
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
          fontSize: getFontSize(12),
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: brgyData[selectedBrgy].distribution[0], name: 'Female', itemStyle: { color: '#FF69B4' } },
        { value: brgyData[selectedBrgy].distribution[1], name: 'Male', itemStyle: { color: '#16C47F' } },
        { value: brgyData[selectedBrgy].distribution[2], name: 'LGBTQ+', itemStyle: { color: '#9B59B6' } }
      ]
    }]
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Analytics Dashboard</h2>
        <div className="dropdown-container">
          <label htmlFor="barangay-select" className="select-label">Select Barangay:</label>
          <select 
            id="barangay-select"
            value={selectedBrgy} 
            onChange={(e) => setSelectedBrgy(e.target.value)}
            className="brgy-select"
            aria-label="Select Barangay"
          >
            {barangays.map((brgy) => (
              <option key={brgy} value={brgy}>{brgy}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper population-chart">
          <ReactECharts 
            ref={(e) => { chartsRef.current[0] = e; }}
            option={populationOption}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'svg' }}
            notMerge={true}
            lazyUpdate={true}
          />
        </div>

        <div className="charts-row">
          <div className="chart-wrapper growth-chart">
            <ReactECharts 
              ref={(e) => { chartsRef.current[1] = e; }}
              option={growthOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'svg' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>

          <div className="chart-wrapper distribution-chart">
            <ReactECharts 
              ref={(e) => { chartsRef.current[2] = e; }}
              option={distributionOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'svg' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDashboard;