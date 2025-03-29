import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import brain from "brain";
import { trackPageView } from "../utils/analytics";
import { API_URL } from "app";
import { TemplateManager } from "../components/TemplateManager";

interface AnalyticsData {
  total_transformations: number;
  total_uploads: number;
  total_downloads: number;
  total_shares: number;
  template_popularity: Record<string, number>;
  conversion_rate: number;
  daily_activity: Record<string, Record<string, number>>;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [clearingShowcase, setClearingShowcase] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  // Track page view
  useEffect(() => {
    trackPageView("admin");
  }, []);

  const handleAuthenticate = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await brain.admin_auth({ password });
      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
        fetchAnalyticsData();
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await brain.get_faceswap_analytics({ password });
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const clearShowcase = async () => {
    setClearingShowcase(true);
    setClearSuccess(null);
    setError(null);

    try {
      // Use brain client instead of fetch
      const response = await brain.clear_showcase();
      const data = await response.json();

      setClearSuccess("Successfully cleared all showcase items.");
      console.log("Showcase cleared successfully:", data);
      
      // Refresh analytics after clearing
      fetchAnalyticsData();
    } catch (err) {
      console.error("Error clearing showcase:", err);
      setError("Failed to clear showcase. Please try again.");
    } finally {
      setClearingShowcase(false);
    }
  };

  // Convert template popularity object to array for PieChart
  const getTemplatePopularityData = () => {
    if (!analyticsData?.template_popularity) return [];

    return Object.entries(analyticsData.template_popularity).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Convert daily activity object to array for LineChart
  const getDailyActivityData = () => {
    if (!analyticsData?.daily_activity) return [];

    return Object.entries(analyticsData.daily_activity)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, activities]) => ({
        date,
        ...activities,
      }));
  };

  // Colors for the charts
  const COLORS = ["#00ffff", "#fe00fe", "#0088fe", "#ff8042"];

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="h-full w-full bg-[linear-gradient(#00ffff_1px,transparent_1px),linear-gradient(90deg,#00ffff_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#fe00fe]/40 shadow-[0_0_5px_#fe00fe] bg-black/60 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#fe00fe]">
            MemeSwap Admin
          </h1>
          <Button variant="neon" size="sm" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {!isAuthenticated ? (
          <Card variant="neon" className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-[#00ffff] drop-shadow-[0_0_5px_#00ffff]">
                Admin Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-[#fe00fe] mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border-2 border-[#fe00fe] bg-black/60 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent"
                    placeholder="Enter admin password"
                    onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-900/50 border border-red-500 rounded-md">
                    <p className="text-red-500">{error}</p>
                  </div>
                )}

                <Button
                  variant="cyanNeon"
                  className="w-full"
                  onClick={handleAuthenticate}
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Login"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Success message */}
            {clearSuccess && (
              <div className="p-4 border-2 border-green-500 bg-green-900/20 rounded-lg">
                <p className="text-green-400">{clearSuccess}</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-6 bg-red-900/30 border border-red-500 rounded-lg">
                <p className="text-red-500">{error}</p>
                <Button variant="neon" className="mt-4" onClick={fetchAnalyticsData}>
                  Retry Loading Data
                </Button>
              </div>
            )}

            {/* Admin Actions Card */}
            <Card variant="neon" className="bg-black/80">
              <CardHeader>
                <CardTitle className="text-[#fe00fe]">
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Use these tools to manage your app's content and data.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card variant="cyan" className="bg-black/80">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold text-[#00ffff] mb-2">Clear Showcase</h3>
                        <p className="text-gray-300 text-sm mb-4">
                          This will remove all transformations from the community showcase. 
                          New transformations will appear as users create them.
                        </p>
                        <Button 
                          variant="cyanNeon" 
                          onClick={clearShowcase}
                          disabled={clearingShowcase}
                          className="w-full"
                        >
                          {clearingShowcase ? "Clearing..." : "Clear All Showcase Items"}
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card variant="neon" className="bg-black/80">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold text-[#fe00fe] mb-2">Refresh Analytics</h3>
                        <p className="text-gray-300 text-sm mb-4">
                          Update the dashboard with the latest analytics data from your app.
                        </p>
                        <Button 
                          variant="neon" 
                          onClick={fetchAnalyticsData}
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? "Loading..." : "Refresh Analytics"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Management */}
            <Card variant="neon" className="bg-black/80">
              <CardHeader>
                <CardTitle className="text-[#fe00fe]">
                  Template Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Add, edit, and delete template images used throughout the app.
                </p>
                
                <TemplateManager adminPassword={password} />
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-12 h-12 border-4 border-t-transparent border-[#00ffff] rounded-full animate-spin"></div>
              </div>
            ) : analyticsData ? (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card variant="neon" className="bg-black/80">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#fe00fe]">
                        Total Transformations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-[#00ffff]">
                        {analyticsData.total_transformations}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="neon" className="bg-black/80">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#fe00fe]">
                        Total Uploads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-[#00ffff]">
                        {analyticsData.total_uploads}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="neon" className="bg-black/80">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#fe00fe]">
                        Total Downloads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-[#00ffff]">
                        {analyticsData.total_downloads}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="neon" className="bg-black/80">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#fe00fe]">
                        Conversion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-[#00ffff]">
                        {(analyticsData.conversion_rate * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Template Popularity */}
                <Card variant="neon" className="bg-black/80">
                  <CardHeader>
                    <CardTitle className="text-[#fe00fe]">
                      Template Popularity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getTemplatePopularityData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {getTemplatePopularityData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value} uses`, "Usage"]} 
                            contentStyle={{ backgroundColor: "black", borderColor: "#fe00fe" }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Activity */}
                <Card variant="neon" className="bg-black/80">
                  <CardHeader>
                    <CardTitle className="text-[#fe00fe]">
                      Daily Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getDailyActivityData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "black", borderColor: "#fe00fe" }} 
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="upload"
                            stroke="#00ffff"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="transformation_complete"
                            stroke="#fe00fe"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="download"
                            stroke="#0088fe"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="share"
                            stroke="#ff8042"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
