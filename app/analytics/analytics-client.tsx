"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsClientProps {
  totalEntries: number;
  aplusCount: number;
  districts: string[];
}

interface ResultData {
  id: string;
  name: string | null;
  school: string | null;
  aplus: number | null;
  reg_no: string | null;
  district?: string;
  image_url: string | null;
}

interface DistrictSummary {
  district: string;
  count: number;
  aplusCount: number;
  aplusPercentage: number;
}

export function AnalyticsClient({ totalEntries, aplusCount, districts }: AnalyticsClientProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [minAplusFilter, setMinAplusFilter] = useState<number>(0);
  const [maxAplusFilter, setMaxAplusFilter] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [filteredResults, setFilteredResults] = useState<ResultData[]>([]);
  const [districtSummaries, setDistrictSummaries] = useState<DistrictSummary[]>([]);
  const [showingResults, setShowingResults] = useState<boolean>(false);
  const [resultsCount, setResultsCount] = useState<number>(0);
  const [filteredAplusCount, setFilteredAplusCount] = useState<number>(0);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDistrict(e.target.value);
  };

  const handleMinAplusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setMinAplusFilter(isNaN(value) ? 0 : Math.min(value, 10));
  };

  const handleMaxAplusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setMaxAplusFilter(isNaN(value) ? 10 : Math.min(value, 10));
  };

  const fetchFilteredData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Build query based on selected filters
      let query = supabase.from("sslc_results").select("*");
      
      if (selectedDistrict) {
        query = query.ilike("school", `%${selectedDistrict}%`);
      }
      
      if (minAplusFilter > 0) {
        query = query.gte("aplus", minAplusFilter);
      }
      
      if (maxAplusFilter < 10) {
        query = query.lte("aplus", maxAplusFilter);
      }
      
      const { data, error, count } = await query.order("aplus", { ascending: false });
      
      if (error) {
        console.error("Error fetching data:", error);
        return;
      }
      
      // Process data to extract district from school name
      const processedData = data?.map(item => ({
        ...item,
        district: item.school?.split(",").pop()?.trim() || "Unknown",
        image_url: item.image_url
      })) || [];
      
      setFilteredResults(processedData);
      setResultsCount(processedData.length);
      setFilteredAplusCount(processedData.filter(item => item.aplus === 10).length);
      setShowingResults(true);
      
      // Generate district summaries
      const districtMap = new Map<string, { count: number; aplusCount: number }>(); 
      
      processedData.forEach(item => {
        const district = item.district || "Unknown";
        const currentData = districtMap.get(district) || { count: 0, aplusCount: 0 };
        
        districtMap.set(district, {
          count: currentData.count + 1,
          aplusCount: currentData.aplusCount + (item.aplus === 10 ? 1 : 0)
        });
      });
      
      const summaries: DistrictSummary[] = [];
      
      districtMap.forEach((data, district) => {
        summaries.push({
          district,
          count: data.count,
          aplusCount: data.aplusCount,
          aplusPercentage: data.count > 0 ? (data.aplusCount / data.count) * 100 : 0
        });
      });
      
      setDistrictSummaries(summaries.sort((a, b) => b.aplusPercentage - a.aplusPercentage));
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Build query based on selected district
      let query = supabase.from("sslc_results").select("*");
      
      if (selectedDistrict) {
        query = query.ilike("school", `%${selectedDistrict}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching data:", error);
        alert("Failed to export data. Please try again.");
        return;
      }
      
      if (!data || data.length === 0) {
        alert("No data to export.");
        return;
      }
      
      // Convert data to CSV format
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map(row => 
        Object.values(row)
          .map(value => 
            typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
          )
          .join(",")
      );
      
      const csvContent = [headers, ...rows].join("\n");
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `sslc_results_${selectedDistrict || "all"}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Export error:", error);
      alert("An error occurred during export.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    // Initial data fetch when component mounts
    fetchFilteredData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Total Entries</h2>
          <p className="text-4xl font-bold">{showingResults ? resultsCount : totalEntries}</p>
          {showingResults && resultsCount !== totalEntries && (
            <p className="text-sm text-gray-500 mt-2">
              {`${((resultsCount / totalEntries) * 100).toFixed(1)}% of total`}
            </p>
          )}
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">A+ Count (10/10)</h2>
          <p className="text-4xl font-bold">{showingResults ? filteredAplusCount : aplusCount}</p>
          <p className="text-sm text-gray-500 mt-2">
            {showingResults
              ? resultsCount > 0 
                ? `${((filteredAplusCount / resultsCount) * 100).toFixed(2)}% of filtered results` 
                : "No data available"
              : totalEntries > 0 
                ? `${((aplusCount / totalEntries) * 100).toFixed(2)}% of total` 
                : "No data available"}
          </p>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Performance</h2>
          <div className="h-16 w-full bg-gray-200 rounded-md overflow-hidden">
            {showingResults && resultsCount > 0 && (
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${(filteredAplusCount / resultsCount) * 100}%` }}
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            A+ Performance Indicator
          </p>
        </Card>
      </div>
      
      {/* Filter Section */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Advanced Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* District Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">District</label>
            <select 
              value={selectedDistrict} 
              onChange={handleDistrictChange}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          
          {/* A+ Range Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Minimum A+ Count</label>
            <input 
              type="number" 
              min="0" 
              max="10" 
              value={minAplusFilter} 
              onChange={handleMinAplusChange}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Maximum A+ Count</label>
            <input 
              type="number" 
              min="0" 
              max="10" 
              value={maxAplusFilter} 
              onChange={handleMaxAplusChange}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-4">
          <Button 
            onClick={fetchFilteredData} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {loading ? "Filtering..." : "Apply Filters"}
          </Button>
          
          <Button 
            onClick={exportToCSV} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            {loading ? "Exporting..." : "Export to CSV"}
          </Button>
        </div>
      </div>
      
      {/* District Performance Table */}
      {showingResults && districtSummaries.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">District Performance</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border">District</th>
                  <th className="p-2 text-left border">Total Students</th>
                  <th className="p-2 text-left border">A+ Count</th>
                  <th className="p-2 text-left border">A+ Percentage</th>
                </tr>
              </thead>
              <tbody>
                {districtSummaries.map((district, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-2 border">{district.district}</td>
                    <td className="p-2 border">{district.count}</td>
                    <td className="p-2 border">{district.aplusCount}</td>
                    <td className="p-2 border">{district.aplusPercentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Results Table */}
      {showingResults && filteredResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Filtered Results</h2>
          <p className="text-sm text-gray-500 mb-4">
            Showing {filteredResults.length} results
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border">Name</th>
                  <th className="p-2 text-left border">School</th>
                  <th className="p-2 text-left border">District</th>
                  <th className="p-2 text-left border">A+ Count</th>
                  <th className="p-2 text-left border">Reg No</th>
                  <th className="p-2 text-left border">Image</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.slice(0, 50).map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{result.name || "N/A"}</td>
                    <td className="p-2 border">{result.school || "N/A"}</td>
                    <td className="p-2 border">{result.district || "N/A"}</td>
                    <td className="p-2 border">{result.aplus || 0}</td>
                    <td className="p-2 border">{result.reg_no || "N/A"}</td>
                    <td className="p-2 border">
                      {result.image_url ? (
                        <a 
                          href={result.image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Image
                        </a>
                      ) : (
                        "No Image"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredResults.length > 50 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 50 results of {filteredResults.length} total results.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
