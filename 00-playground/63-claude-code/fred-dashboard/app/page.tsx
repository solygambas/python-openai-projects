"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  ChevronRight,
  TrendingUp,
  BarChart2,
  DollarSign,
  Home,
  ShoppingCart,
  Globe,
  Loader2,
} from "lucide-react";
import { useFredData } from "@/hooks/useFredData";
import { FRED_SERIES_IDS } from "@/libs/fred-api";

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState("Key Indicators");

  // Calculate date range for last 2 years
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);

  const dateRange = {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
  };

  // Fetch real data from FRED API
  const { data: cpiData, loading: cpiLoading } = useFredData(
    FRED_SERIES_IDS.CPI,
    dateRange.start,
    dateRange.end
  );

  const { data: unemploymentData, loading: unemploymentLoading } = useFredData(
    FRED_SERIES_IDS.UNEMPLOYMENT,
    dateRange.start,
    dateRange.end
  );

  const { data: treasury10YData, loading: treasury10YLoading } = useFredData(
    FRED_SERIES_IDS.TREASURY_10Y,
    dateRange.start,
    dateRange.end
  );

  const { data: treasury3MData, loading: treasury3MLoading } = useFredData(
    FRED_SERIES_IDS.TREASURY_3M,
    dateRange.start,
    dateRange.end
  );

  const sidebarItems = [
    { name: "Key Indicators", icon: BarChart2 },
    { name: "Inflation", icon: TrendingUp },
    { name: "Employment", icon: BarChart2 },
    { name: "Interest Rates", icon: BarChart2 },
    { name: "Economic Growth", icon: TrendingUp },
    { name: "Exchange Rates", icon: Globe },
    { name: "Housing", icon: Home },
    { name: "Consumer Spending", icon: ShoppingCart },
  ];

  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">FRED Indicators</h1>
          <p className="text-sm text-gray-500 mt-1">Economic Data Dashboard</p>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedCategory(item.name)}
              className={`w-full flex items-center justify-between px-6 py-3 text-sm transition-colors ${
                selectedCategory === item.name
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Data provided by Federal Reserve
            <br />
            Economic Data (FRED)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-100">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Economic Indicators Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            Real-time economic data from the Federal Reserve Economic Data
            (FRED) system
          </p>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* CPI Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Consumer Price Index (CPI)
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-900">FRED</span>
                <span className="text-xs text-gray-500">
                  All Urban Consumers: All Items (CPIAUCSL)
                </span>
              </div>
              {cpiLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={cpiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatXAxisDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <Tooltip
                      labelFormatter={formatTooltipDate}
                      formatter={(value: number) => value.toFixed(2)}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="CPI"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
                <a
                  href={`https://fred.stlouisfed.org/series/${FRED_SERIES_IDS.CPI}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Details →
                </a>
              </div>
            </div>

            {/* Unemployment Rate Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Unemployment Rate
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-900">FRED</span>
                <span className="text-xs text-gray-500">
                  Civilian Unemployment Rate (UNRATE)
                </span>
              </div>
              {unemploymentLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={unemploymentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatXAxisDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={[0, "dataMax + 1"]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      labelFormatter={formatTooltipDate}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      fill="#86efac"
                      strokeWidth={2}
                      name="Unemployment Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
                <a
                  href={`https://fred.stlouisfed.org/series/${FRED_SERIES_IDS.UNEMPLOYMENT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Details →
                </a>
              </div>
            </div>

            {/* 10-Year Treasury Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                10-Year Treasury Yield
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-900">FRED</span>
                <span className="text-xs text-gray-500">
                  Market Yield on U.S. Treasury Securities (DGS10)
                </span>
              </div>
              {treasury10YLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={treasury10YData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatXAxisDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      labelFormatter={formatTooltipDate}
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="10-Year Yield"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
                <a
                  href={`https://fred.stlouisfed.org/series/${FRED_SERIES_IDS.TREASURY_10Y}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Details →
                </a>
              </div>
            </div>

            {/* 3-Month Treasury Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                3-Month Treasury Yield
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-900">FRED</span>
                <span className="text-xs text-gray-500">
                  Market Yield on U.S. Treasury Securities (DGS3MO)
                </span>
              </div>
              {treasury3MLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={treasury3MData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatXAxisDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      labelFormatter={formatTooltipDate}
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="3-Month Yield"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
                <a
                  href={`https://fred.stlouisfed.org/series/${FRED_SERIES_IDS.TREASURY_3M}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Details →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
