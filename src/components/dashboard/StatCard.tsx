import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  period: string;
}

const StatCard = ({ title, value, change, trend, period }: StatCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <div className="flex items-center text-sm">
        <span
          className={cn(
            "flex items-center",
            trend === "up" ? "text-green-500" : "text-red-500"
          )}
        >
          {trend === "up" ? (
            <ArrowUpIcon className="mr-1 h-3 w-3" />
          ) : (
            <ArrowDownIcon className="mr-1 h-3 w-3" />
          )}
          {change}
        </span>
        <span className="text-gray-500 ml-1">{period}</span>
      </div>
    </div>
  );
};

export default StatCard; 