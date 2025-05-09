"use client";

import { useEffect, useState } from "react";
import { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { ResultCard } from "@/components/result-card";
import { useToast } from "@/components/ui/use-toast";

export default function VerifyPage() {
  const { user, loading } = useUser();
  const [results, setResults] = useState<Tables<"sslc_results">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    // Redirect if not logged in (this is a backup to the middleware)
    if (!user) {
      window.location.href = "/signin";
      return;
    }

    // Fetch initial data
    const fetchResults = async () => {
      try {
        const { data, error } = await supabase
          .from("sslc_results")
          .select("*")
          .eq("active", false)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error fetching results:", error);
        toast({
          title: "Error",
          description: "Failed to load results",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();

    // Set up real-time subscription
    const subscription = supabase
      .channel("sslc_results_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sslc_results",
          filter: "active=eq.false",
        },
        (payload) => {
          const newResult = payload.new as Tables<"sslc_results">;
          setResults((prev) => [newResult, ...prev]);
          toast({
            title: "New Result",
            description: `New result added for ${newResult.name || "Unknown"}`,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sslc_results",
          filter: "active=eq.true",
        },
        (payload) => {
          const updatedResult = payload.new as Tables<"sslc_results">;
          // Remove approved results from the list
          setResults((prev) => 
            prev.filter((result) => result.id !== updatedResult.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, loading, supabase, toast]);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sslc_results")
        .update({ active: true })
        .eq("id", id);

      if (error) throw error;

      // Remove from UI immediately (the subscription will also handle this)
      setResults((prev) => prev.filter((result) => result.id !== id));
      
      toast({
        title: "Success",
        description: "Result approved successfully",
      });
    } catch (error) {
      console.error("Error approving result:", error);
      toast({
        title: "Error",
        description: "Failed to approve result",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    // Only remove from UI, don't delete from database
    setResults((prev) => prev.filter((result) => result.id !== id));
    toast({
      title: "Success",
      description: "Result removed from view",
    });
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Verify Results</h1>
        <div className="flex justify-center items-center min-h-[50vh]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Verify Results</h1>
      
      {results.length === 0 ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <p>No results pending verification</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
