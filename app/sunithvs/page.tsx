import { createClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createClient();
  
  // Fetch total entries
  const { count: totalEntries } = await supabase
    .from("sslc_results")
    .select("*", { count: "exact", head: true });
  
  // Fetch A+ count (students with aplus = 10)
  const { count: aplusCount } = await supabase
    .from("sslc_results")
    .select("*", { count: "exact", head: true })
    .eq("aplus", 10);
  
  // Fetch district data for filtering
  const { data: districts } = await supabase
    .from("sslc_results")
    .select("school")
    .not("school", "is", null);
  
  // Extract unique districts from school names (assuming district is part of school name)
  // In a real application, you might have a separate district field
  const uniqueDistricts = Array.from(
    new Set(
      districts
        ?.map((item) => item.school?.split(",").pop()?.trim())
        .filter(Boolean) as string[]
    )
  ).sort();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">SSLC Results Analytics</h1>
      
      <AnalyticsClient 
        totalEntries={totalEntries || 0} 
        aplusCount={aplusCount || 0} 
        districts={uniqueDistricts || []} 
      />
    </div>
  );
}
