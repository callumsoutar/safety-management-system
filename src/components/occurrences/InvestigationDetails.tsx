import { format } from "date-fns";

interface InvestigationDetailsProps {
  investigation: any;
}

const InvestigationDetails = ({ investigation }: InvestigationDetailsProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM d, yyyy, h:mm a");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4">Investigation</h2>
      
      <div className="mb-6">
        <div className="flex items-center mb-4">
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
            <div className="text-sm text-gray-500">Lead Investigator</div>
            <div className="text-base font-medium">
              {investigation?.lead_investigator?.full_name || "Not assigned"}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-1">
            Change Lead Investigator
          </label>
          <div className="flex max-w-md">
            <select
              className="w-80 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={investigation?.lead_investigator?.id || ""}
            >
              <option value="">Select an investigator</option>
              <option value="1">Callum Soutar</option>
            </select>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap">
              Assign
            </button>
          </div>
        </div>

        <div className="flex items-start mb-2">
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
            <div className="text-sm text-gray-500">Started</div>
            <div className="text-base font-medium">
              {investigation?.started_at
                ? formatDate(investigation.started_at)
                : "Not started"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationDetails; 