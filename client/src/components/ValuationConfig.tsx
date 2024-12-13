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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

const valuationSchema = z.object({
  spotifyRate: z.number().min(0).max(1),
  appleMusicRate: z.number().min(0).max(1),
  yearOneDecay: z.number().min(0).max(100),
  yearTwoDecay: z.number().min(0).max(100),
  yearThreeDecay: z.number().min(0).max(100),
});

type ValuationConfig = z.infer<typeof valuationSchema>;

export default function ValuationConfig() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const onSubmit = async (data: ValuationConfig) => {
    setIsSubmitting(true);
    try {
      // Submit configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLocation("/valuation/report");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Valuation Configuration</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="spotifyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify Payout Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Average payout per stream
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appleMusicRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apple Music Payout Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Average payout per stream
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
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
                </FormItem>
              )}
            />

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
                </FormItem>
              )}
            />

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
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Generating Report..." : "Generate Valuation Report"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
