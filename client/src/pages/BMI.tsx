import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockBMIData = [
  { date: "Jan 2024", bmi: 22.5 },
  { date: "Feb 2024", bmi: 22.3 },
  { date: "Mar 2024", bmi: 22.1 },
  { date: "Apr 2024", bmi: 21.9 },
  { date: "May 2024", bmi: 21.8 },
];

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { category: "Underweight", color: "text-blue-500" };
  if (bmi < 25) return { category: "Normal", color: "text-green-500" };
  if (bmi < 30) return { category: "Overweight", color: "text-orange-500" };
  return { category: "Obese", color: "text-red-500" };
};

const BMI = () => {
  const currentBMI = mockBMIData[mockBMIData.length - 1].bmi;
  const bmiStatus = getBMICategory(currentBMI);

  return (
    <MainLayout>
      <div className="animate-in">
        <h1 className="mb-8 text-3xl w-fit font-bold primary-grad">
          BMI Tracker
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>BMI Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockBMIData}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[18, 30]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bmi"
                      stroke="#9b87f5"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current BMI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold">{currentBMI}</div>
                <div className={`mt-2 text-lg ${bmiStatus.color}`}>
                  {bmiStatus.category}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  BMI Categories:
                  <div className="mt-2 grid grid-cols-2 gap-2 text-left">
                    <div>Underweight: &lt;18.5</div>
                    <div>Normal: 18.5-24.9</div>
                    <div>Overweight: 25-29.9</div>
                    <div>Obese: ≥30</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your BMI is in the {bmiStatus.category.toLowerCase()} range.
                  Here are some recommendations:
                </p>
                <ul className="list-inside list-disc space-y-2 text-sm">
                  <li>Maintain a balanced diet</li>
                  <li>Exercise regularly (30 minutes daily)</li>
                  <li>Stay hydrated</li>
                  <li>Get adequate sleep</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default BMI;
