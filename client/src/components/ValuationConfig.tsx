/**
 * Valuation Configuration Component
 * Handles user input for configuring music catalog valuation parameters
 * @module components/ValuationConfig
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * Zod schema for valuation configuration validation
 * Defines acceptable ranges and steps for each parameter
 */
const valuationSchema = z.object({
  /** Spotify per-stream rate (0-1) with 3 decimal precision */
  spotifyRate: z.number()
    .min(0, "Rate must be positive")
    .max(1, "Rate cannot exceed 1")
    .multipleOf(0.001, "Use up to 3 decimal places"),
  
  /** Apple Music per-stream rate (0-1) with 3 decimal precision */
  appleMusicRate: z.number()
    .min(0, "Rate must be positive")
    .max(1, "Rate cannot exceed 1")
    .multipleOf(0.001, "Use up to 3 decimal places"),
  
  /** First year decay percentage (0-100) whole numbers */
  yearOneDecay: z.number()
    .int("Must be a whole number")
    .min(0, "Decay rate must be positive")
    .max(100, "Decay rate cannot exceed 100%"),
  
  /** Second year decay percentage (0-100) whole numbers */
  yearTwoDecay: z.number()
    .int("Must be a whole number")
    .min(0, "Decay rate must be positive")
    .max(100, "Decay rate cannot exceed 100%"),
  
  /** Third year decay percentage (0-100) whole numbers */
  yearThreeDecay: z.number()
    .int("Must be a whole number")
    .min(0, "Decay rate must be positive")
    .max(100, "Decay rate cannot exceed 100%"),
});

/** Type definition derived from validation schema */
type ValuationConfig = z.infer<typeof valuationSchema>;

/**
 * API response interface for valuation configuration submission
 */
interface ValuationResponse {
  id: number;
  config: ValuationConfig;
  summary: {
    totalTracks: number;
    currentAnnualRevenue: number;
    totalStreams: number;
    projectedValue: number;
  };
  projections: Array<{
    year: number;
    revenue: number;
  }>;
}

/**
 * ValuationConfig Component
 * Form interface for configuring valuation parameters with validation
 * @returns {JSX.Element} Rendered component
 */
export default function ValuationConfig() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize form with default values and validation
   */
  const form = useForm<ValuationConfig>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      spotifyRate: 0.004,
      appleMusicRate: 0.01,
      yearOneDecay: 30,
      yearTwoDecay: 20,
      yearThreeDecay: 10,
    },
  });

  /**
   * Handles form submission
   * Sends configuration to server and redirects to report view
   * @param {ValuationConfig} data - Validated form data
   */
  const onSubmit = async (data: ValuationConfig) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/valuation/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit configuration');
      }

      const result: ValuationResponse = await response.json();
      setLocation(`/valuation/${result.id}/report`);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process valuation configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Spotify Rate Configuration */}
            <FormField
              control={form.control}
              name="spotifyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify Rate (per stream)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Average payout rate per stream on Spotify
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Apple Music Rate Configuration */}
            <FormField
              control={form.control}
              name="appleMusicRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apple Music Rate (per stream)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Average payout rate per stream on Apple Music
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year 1-2 Decay Rate */}
            <FormField
              control={form.control}
              name="yearOneDecay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year 1-2 Decay Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected revenue decay for years 1-2
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year 3-4 Decay Rate */}
            <FormField
              control={form.control}
              name="yearTwoDecay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year 3-4 Decay Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected revenue decay for years 3-4
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year 5+ Decay Rate */}
            <FormField
              control={form.control}
              name="yearThreeDecay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year 5+ Decay Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected revenue decay for year 5 and beyond
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              "Generate Valuation Report"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}