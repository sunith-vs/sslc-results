
import { Tables } from "@/database.types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResultCardProps {
  result: Tables<"sslc_results">;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ResultCard({ result, onApprove, onDelete }: ResultCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg">{result.name || "Unknown"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {result.image_url && (
          <div className="flex justify-center w-full">
            <img
              src={result.image_url}
              alt={result.name || "Student"}
              width="300"
              height="300"
              className="rounded-md max-h-[350px] w-auto h-auto object-contain"
              loading="eager"
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">School:</span>
            <span className="text-sm">{result.school || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">A+ Count:</span>
            <span className="text-sm">{result.aplus || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Reg No:</span>
            <span className="text-sm">{result.reg_no || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Phone:</span>
            <span className="text-sm">{result.phone_number || "N/A"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button 
          variant="outline" 
          onClick={() => onDelete(result.id)}
          className="w-1/2 mr-2"
        >
          Delete
        </Button>
        <Button 
          onClick={() => onApprove(result.id)}
          className="w-1/2"
        >
          Approve
        </Button>
      </CardFooter>
    </Card>
  );
}
