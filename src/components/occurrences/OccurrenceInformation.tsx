import { format } from "date-fns";

interface OccurrenceInformationProps {
  occurrence: any;
  details: any;
}

const OccurrenceInformation = ({ occurrence, details }: OccurrenceInformationProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "MMM d, yyyy, h:mm a");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Basic Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-2">BASIC INFORMATION</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-blue-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-blue-600"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Date & Time</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {formatDate(occurrence.occurrence_date)}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-blue-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-blue-600"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Aircraft</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {occurrence.aircraft?.registration || "ZK-ELA"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                C-152 Cessna
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-blue-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-blue-600"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Location</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {occurrence.location || "NZPP"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-2">FLIGHT CONDITIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-indigo-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-indigo-600"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Flight Phase</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {occurrence.flight_phase || "Circuit"}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-indigo-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-indigo-600"
              >
                <path d="M17 16.2c.9 1.6 2.2 2.8 3 2.8 1.3 0 2-1.9 2-4s-.7-4-2-4c-.8 0-2.1 1.2-3 2.8" />
                <path d="M7 16.2c-.9 1.6-2.2 2.8-3 2.8-1.3 0-2-1.9-2-4s.7-4 2-4c.8 0 2.1 1.2 3 2.8" />
                <path d="M14.5 16.5c.5 1.5 1.3 2.5 2 2.5.9 0 1.5-1.9 1.5-4s-.6-4-1.5-4c-.7 0-1.5 1-2 2.5" />
                <path d="M9.5 16.5c-.5 1.5-1.3 2.5-2 2.5-.9 0-1.5-1.9-1.5-4s.6-4 1.5-4c.7 0 1.5 1 2 2.5" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Weather Conditions</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {occurrence.weather_conditions || "Calm winds. Overcast cloud at 2000'"}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-indigo-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-indigo-600"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Flight Rules</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {details?.flight_rules || "VFR"}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-indigo-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-indigo-600"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Flight Type</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {details?.flight_type || "local"}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-indigo-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-indigo-600"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Flight Purpose</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {details?.flight_purpose || "dual_instruction"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-2">ANALYSIS</h3>
        
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Suggested Causes</h4>
          <p className="text-base text-gray-800">
            {details?.suggested_causes || "Situational Awareness Issue: The pilot of the Cessna 172 may not have visually acquired the other aircraft on final."}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Suggested Outcomes</h4>
          <p className="text-base text-gray-800">
            {details?.suggested_outcomes || "Circuit Procedure Refresher: Organize a refresher session covering right-of-way rules and best practices for circuit separation."}
          </p>
        </div>
      </div>

      {/* Reporting Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-2">REPORTING DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-green-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-green-600"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">CAA Report</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {details?.caa_report || "Submitted"}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 bg-green-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-green-600"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Airport Operator</div>
              <div className="text-base font-medium text-gray-800 mt-1">
                {details?.airport_operator || "Not advised"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-2">RESPONSE</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Corrective Actions</h4>
          <p className="text-base text-gray-800 italic">
            {details?.corrective_actions || "No corrective actions recorded."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OccurrenceInformation; 