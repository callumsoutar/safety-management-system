import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface OccurrenceDetailsProps {
  occurrence: any;
  details: any;
}

const OccurrenceDetails = ({ occurrence, details }: OccurrenceDetailsProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM d, yyyy, h:mm a");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-yellow-100 text-yellow-800";
      case "in_review":
        return "bg-blue-100 text-blue-800";
      case "under_investigation":
        return "bg-orange-100 text-orange-800";
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{occurrence.title}</h2>
          <div className="flex items-center text-gray-500 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-1"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Reported on {formatDate(occurrence.created_at)}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              getStatusBadgeClass(occurrence.status)
            )}
          >
            {occurrence.status === "in_review"
              ? "Under Review"
              : occurrence.status === "under_investigation"
              ? "Under Investigation"
              : occurrence.status.charAt(0).toUpperCase() +
                occurrence.status.slice(1)}
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              getSeverityBadgeClass(occurrence.severity)
            )}
          >
            {occurrence.severity.charAt(0).toUpperCase() +
              occurrence.severity.slice(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="flex items-center p-3 bg-gray-50 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 mr-2 text-gray-500"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <div className="text-xs text-gray-500">Occurred on</div>
            <div className="text-sm font-medium">
              {formatDate(occurrence.occurrence_date)}
            </div>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 mr-2 text-gray-500"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <div className="text-xs text-gray-500">Incident</div>
            <div className="text-sm font-medium">
              {occurrence.occurrence_type.charAt(0).toUpperCase() +
                occurrence.occurrence_type.slice(1)}
            </div>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 mr-2 text-gray-500"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <div>
            <div className="text-xs text-gray-500">Reported by</div>
            <div className="text-sm font-medium">
              {occurrence.reporter?.full_name || "Unknown"}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">DESCRIPTION</h3>
        <p className="text-gray-700">{occurrence.description}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">BASIC INFORMATION</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 mr-2 text-gray-500 mt-0.5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <div className="text-sm text-gray-500">Date & Time</div>
              <div className="text-sm font-medium">
                {formatDate(occurrence.occurrence_date)}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 mr-2 text-gray-500 mt-0.5"
            >
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
            <div>
              <div className="text-sm text-gray-500">Aircraft</div>
              <div className="text-sm font-medium">
                {occurrence.aircraft?.registration || "N/A"}
              </div>
              <div className="text-xs text-gray-500">
                {occurrence.aircraft?.type} {occurrence.aircraft?.model}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OccurrenceDetails; 