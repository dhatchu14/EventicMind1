// src/components/AiPredictionCard.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner'; // Use sonner

// Shadcn/UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Lucide Icons
import { TrendingUp, Loader2 } from 'lucide-react';

export function AiPredictionCard() {
    const [isLoading, setIsLoading] = useState(false);
    const [predictionData, setPredictionData] = useState(null);
    const [error, setError] = useState(null);

    const handlePredictTrends = async () => {
        setIsLoading(true);
        setPredictionData(null);
        setError(null);
        const loadingToastId = toast.loading("Generating AI prediction...");

        try {
            // --- Use Vite's environment variable syntax ---
            // Ensure you have VITE_API_URL defined in your .env file
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'; // Fallback
            // --- End of change ---

            const apiUrl = `${baseUrl}/api/v1/ai/predict-seasonal-demand`;

            console.log("Attempting API request to (Vite):", apiUrl); // Log the URL being used

            const response = await axios.post(
                apiUrl,
                {}, // Empty body uses default PredictionParams
                { headers: { 'Content-Type': 'application/json' } }
            );

            toast.dismiss(loadingToastId);
            toast.success("Prediction generated successfully!");
            setPredictionData(response.data);

        } catch (err) {
            toast.dismiss(loadingToastId); // Ensure dismissal on error
            console.error("Prediction error:", err);
            let errorMessage = "Failed to fetch AI prediction.";

            if (axios.isAxiosError(err) && err.response) {
                const detail = err.response.data?.detail;
                const statusText = err.response.statusText;
                errorMessage = `Error ${err.response.status}: ${detail || statusText || 'Server error'}`;
                 if (err.response.status === 503) { errorMessage = "Service Unavailable: AI service might be down or LLM unavailable."; }
                 else if (err.response.status === 400) { errorMessage = `Bad Request: ${detail || 'Invalid input.'}`; }
            } else if (err.request) { errorMessage = "Network Error: Could not reach the server."; }
            else {
                // The error "process is not defined" should no longer happen here if Vite setup is correct
                errorMessage = `Request Setup Error: ${err.message}`;
            }

            toast.error(errorMessage);
            setError(errorMessage);
            setPredictionData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // --- JSX Rendering ---
    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Upcoming Demand Insights (AI)
                        </CardTitle>
                        <CardDescription className="mt-1">AI-powered forecast for potential sales trends.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handlePredictTrends} disabled={isLoading} className={`flex-shrink-0 ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}>
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2 text-primary" />}
                        {isLoading ? 'Predicting...' : 'Predict Trends'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-6"><p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating insights...</p></div>
                ) : error ? (
                     <div className="text-center py-6 text-sm text-destructive"><p>Error loading predictions:</p><p>{error}</p></div>
                 ) : predictionData ? (
                    <div>
                        {predictionData?.summary && (<p className="text-sm font-medium mb-4">{predictionData.summary}</p>)}
                        {predictionData?.insights && predictionData.insights.length > 0 ? (
                            <ul className="space-y-3">
                                {predictionData.insights.map((insight, index) => (
                                    insight && (
                                        <li key={index} className="border-l-4 border-primary/60 pl-3 py-1 text-sm">
                                            <p className="font-semibold">{insight.event_or_season} {insight.timeframe ? `(${insight.timeframe})` : ''}</p>
                                            <p> <span className="font-medium text-muted-foreground">Categories:</span> {Array.isArray(insight.affected_categories) ? insight.affected_categories.join(', ') : 'N/A'}</p>
                                            <p><span className="font-medium text-muted-foreground">Impact:</span> {insight.predicted_impact}</p>
                                            {insight.inventory_warning && (<p className="text-orange-600 dark:text-orange-400"><span className="font-medium">Warning:</span> {insight.inventory_warning}</p>)}
                                        </li>
                                    )
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-muted-foreground text-center py-6">No specific insights generated by the AI.</p>)}
                        {predictionData?.raw_response && (
                             <details className="mt-4 text-xs"><summary className="cursor-pointer">Raw AI Response (Parsing Failed)</summary><pre className="bg-muted p-2 rounded text-muted-foreground overflow-auto max-h-40"><code>{predictionData.raw_response}</code></pre></details>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Click "Predict Trends" to generate an AI forecast.</p>
                )}
            </CardContent>
        </Card>
    );
}