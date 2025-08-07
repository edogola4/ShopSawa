import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor = 'bg-blue-500', 
  trend, 
  trendText,
  isCurrency = false 
}) => {
  // Format the value based on its type
  const formatValue = (val) => {
    if (val === undefined || val === null) return '0';
    
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    
    // Format large numbers with commas
    return new Intl.NumberFormat('en-US').format(val);
  };
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {formatValue(value)}
                </div>
                {trend && (
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    {trend > 0 ? (
                      <span className="sr-only">Increased by</span>
                    ) : (
                      <span className="sr-only">Decreased by</span>
                    )}
                    {trendText}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
