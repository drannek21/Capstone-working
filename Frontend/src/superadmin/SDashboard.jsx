import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import "./SDashboard.css";

const SDashboard = () => {
  const [selectedBrgy, setSelectedBrgy] = useState("All");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const chartsRef = useRef([]);
  
  const barangays = ["All", "Brgy 1", "Brgy 2", "Brgy 3", "Brgy 4"];

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

  const brgyData = {
    "All": { population: [43, 44, 46, 46, 48, 50, 51, 53, 54, 56, 57, 62], growth: [10, 12, 8, 15], distribution: [150, 80, 10] },
    "Brgy 1": { population: [20, 22, 23, 25, 26, 28, 30, 31, 33, 35, 37, 40], growth: [5, 6, 4, 7], distribution: [50, 30, 5] },
    "Brgy 2": { population: [15, 17, 18, 19, 21, 23, 24, 26, 28, 29, 31, 34], growth: [3, 4, 2, 5], distribution: [40, 25, 3] },
    "Brgy 3": { population: [10, 11, 12, 14, 15, 17, 18, 20, 21, 22, 23, 25], growth: [2, 3, 2, 4], distribution: [30, 20, 2] },
    "Brgy 4": { population: [8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 21], growth: [1, 2, 2, 3], distribution: [20, 15, 1] },
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

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
      name: `Population (${selectedBrgy})`,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
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
      data: quarters,
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
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
      data: ['Female', 'Male', 'LGBTQ+'],
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
          <select 
            value={selectedBrgy} 
            onChange={(e) => setSelectedBrgy(e.target.value)}
            className="brgy-select"
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
          />
        </div>

        <div className="charts-row">
          <div className="chart-wrapper growth-chart">
            <ReactECharts 
              ref={(e) => { chartsRef.current[1] = e; }}
              option={growthOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>

          <div className="chart-wrapper distribution-chart">
            <ReactECharts 
              ref={(e) => { chartsRef.current[2] = e; }}
              option={distributionOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDashboard;
