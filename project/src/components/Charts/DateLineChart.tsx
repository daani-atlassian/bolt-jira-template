import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calendar } from 'lucide-react';

interface DateLineChartProps {
  data: Array<{
    day: number;
    dayOfMonth: number;
    date: string;
    count: number;
    overdueCount?: number;
    isMonthStart?: boolean;
    monthLabel?: string;
  }>;
  type: 'start' | 'due';
  earliestDate: Date;
  latestDate: Date;
}

// Move custom components outside to prevent recreation on every render
const CustomDot = React.memo((props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.count === 0) {
    return null; // Don't render dot when count is 0
  }
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={3} 
      fill="#0052cc" 
      strokeWidth={0}
    />
  );
});

const CustomActiveDot = React.memo((props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.count === 0) {
    return null; // Don't render active dot when count is 0
  }
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={5} 
      fill="#0052cc" 
      strokeWidth={0}
    />
  );
});

const DateLineChart: React.FC<DateLineChartProps> = ({ data, type, earliestDate, latestDate }) => {
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Memoize expensive calculations
  const chartMetrics = useMemo(() => {
    const maxCount = Math.max(...data.map(d => d.count));
    const dynamicHeight = Math.max(3, maxCount + 1); // Reduced padding
    const chartWidth = Math.max(800, data.length * 20);
    const monthBoundaries = data.filter(d => d.isMonthStart);
    
    return { maxCount, dynamicHeight, chartWidth, monthBoundaries };
  }, [data]);

  // Memoize data lookup map for better performance
  const dataLookup = useMemo(() => {
    const lookup = new Map();
    data.forEach(d => lookup.set(d.day, d));
    return lookup;
  }, [data]);

  // Use useCallback to prevent recreation of event handlers
  const handleMouseMove = useCallback((state: any) => {
    if (state && state.activeLabel !== undefined) {
      const dataPoint = dataLookup.get(state.activeLabel);
      if (dataPoint) {
        setHoveredData(dataPoint);
        setHoverX(state.activeLabel);
      }
    }
  }, [dataLookup]);

  // Only clear hover state when mouse leaves the entire chart container
  const handleContainerMouseLeave = useCallback(() => {
    setHoveredData(null);
    setHoverX(null);
  }, []);

  // Memoize the X-axis formatter
  const formatXAxisLabel = useCallback((value: number) => {
    const dataPoint = dataLookup.get(value);
    return dataPoint ? dataPoint.dayOfMonth : value;
  }, [dataLookup]);

  // Scroll to end for due dates, start for start dates
  useEffect(() => {
    if (scrollContainerRef.current && data.length > 0) {
      const container = scrollContainerRef.current;
      if (type === 'due') {
        // Scroll to end for due dates
        container.scrollLeft = container.scrollWidth - container.clientWidth;
      } else {
        // Scroll to start for start dates
        container.scrollLeft = 0;
      }
    }
  }, [data, type]);

  // Memoize the formatted hover data
  const formattedHoverData = useMemo(() => {
    if (!hoveredData) return null;
    
    const date = new Date(hoveredData.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      date: formattedDate,
      count: hoveredData.count,
      dayOfMonth: hoveredData.dayOfMonth
    };
  }, [hoveredData]);

  return (
    <div className="w-full space-y-3">
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto overflow-y-hidden"
        style={{ height: `${Math.max(120, chartMetrics.dynamicHeight * 25)}px` }} // Reduced base height and multiplier
      >
        <div 
          ref={chartContainerRef}
          style={{ width: `${chartMetrics.chartWidth}px`, height: '100%' }}
          onMouseLeave={handleContainerMouseLeave}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data} 
              margin={{ top: 30, right: 30, left: 20, bottom: 30 }}
              onMouseMove={handleMouseMove}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" />
              
              {/* Bold month boundary lines */}
              {chartMetrics.monthBoundaries.map((boundary, index) => (
                <ReferenceLine 
                  key={`${boundary.day}-${boundary.monthLabel}`}
                  x={boundary.day}
                  stroke="#6b778c" 
                  strokeWidth={3}
                  strokeOpacity={0.8}
                  label={{ 
                    value: boundary.monthLabel, 
                    position: 'top',
                    offset: 15,
                    style: { 
                      fontSize: '12px', 
                      fill: '#6b778c', 
                      fontWeight: 'bold',
                      textAnchor: 'middle'
                    }
                  }}
                />
              ))}

              {/* Hover line that follows mouse */}
              {hoverX !== null && (
                <ReferenceLine 
                  x={hoverX} 
                  stroke="#0052cc" 
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  strokeDasharray="3 3"
                />
              )}
              
              <XAxis 
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#6b778c' }}
                interval="preserveStartEnd"
                minTickGap={15}
                tickFormatter={formatXAxisLabel}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                hide 
                domain={[0, Math.max(chartMetrics.maxCount + 1, 3)]} // Tighter Y-axis range
              />
              
              {/* Main line - both start and due dates use blue */}
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0052cc"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={<CustomActiveDot />}
                connectNulls={true}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tooltip Information Below Chart */}
      <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[50px] flex items-center"> {/* Reduced min height */}
        {formattedHoverData ? (
          <div className="flex items-center space-x-4 w-full">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                {formattedHoverData.date}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#0052cc]" />
              <span className="text-sm text-gray-600">
                Day {formattedHoverData.dayOfMonth}: {formattedHoverData.count} item{formattedHoverData.count === 1 ? '' : 's'} {type === 'start' ? 'start' : 'due'}
                {formattedHoverData.count === 1 && type === 'start' ? 's' : ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Hover over chart points to see details • Bold lines separate months</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateLineChart;