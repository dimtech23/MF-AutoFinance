import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  Truck,
  FileText,
  ExternalLink,
  Printer,
  Globe,
  Box,
} from "lucide-react";
import AddressLabelModal from "./AddressLabelModal";

export default function ShippedRequestsView({ pendingRequests = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const stats = {
    total: pendingRequests.length,
    hazardous: pendingRequests.filter((r) => r.request.isHazardous).length,
    international: pendingRequests.filter((r) =>
      r.request.projectName.includes("Fieldstation")
    ).length,
    thisMonth: pendingRequests.filter((r) => {
      const date = new Date(r.request.actualShipmentDate);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length,
  };
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const calculateTotalOverpacks = (request) => {
    if (!request.shipmentDetail?.overpackSummaries) return 0;
    return request.shipmentDetail.overpackSummaries.reduce(
      (total, summary) => total + (summary.totalOverpacks || 0),
      0
    );
  };

  return (
    <>
    
    <div className="w-full space-y-4">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Completed Shipments
          </h2>
          <p className="text-sm text-gray-500">
            Total: {pendingRequests.length} shipments
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {pendingRequests.map((request) => (
            <div key={request.request.id} className="bg-white">
              <div
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(request.request.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Shipped
                      </span>
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.request.fullName}
                      </h3>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Project: {request.request.projectName}
                      </div>
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />  
                        Country: {request.request.country || "Not specified"}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Created: {formatDate(request.request.createdDateTime)}
                      </div>
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Agent:{" "}
                        {request.request.primaryAgent || "Not specified"}
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        AWB: {request.request.awbNumber || "Not specified"}
                      </div>
                      <div className="flex items-center">
                        <Box className="w-4 h-4 mr-2" />
                        Overpacks: {calculateTotalOverpacks(request)}
                      </div>
                      <div className="flex items-center col-span-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        Shipped:{" "}
                        {formatDate(request.request.actualShipmentDate)}
                      </div>
                    </div>
                  </div>

                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    {expandedId === request.request.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {expandedId === request.request.id && (
                <div className="px-4 pb-4 bg-gray-50">
                  <div className="border rounded-lg bg-white p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Shipment Details
                        </h4>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <dt className="text-gray-500">Total Weight:</dt>
                          <dd className="text-gray-900">
                            {request.shipmentDetail?.totalWeightKg} kg
                          </dd>
                          <dt className="text-gray-500">EORI:</dt>
                          <dd className="text-gray-900">
                            {request.shipmentDetail?.eori || "N/A"}
                          </dd>
                          <dt className="text-gray-500">VAT Reg:</dt>
                          <dd className="text-gray-900">
                            {request.shipmentDetail?.vatRegistration || "N/A"}
                          </dd>
                          <dt className="text-gray-500">HS Code:</dt>
                          <dd className="text-gray-900">
                            {request.shipmentDetail?.hsCode || "N/A"}
                          </dd>
                          <dt className="text-gray-500">Incoterm:</dt>
                          <dd className="text-gray-900">
                            {request.shipmentDetail?.incoterm || "N/A"}
                          </dd>
                        </dl>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Shipping Information
                        </h4>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="col-span-2 space-y-2">
                            <div>
                              <dt className="text-gray-500">Consignee:</dt>
                              <dd className="text-gray-900 mt-1">
                                {request.request.consigneeName || "N/A"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Address:</dt>
                              <dd className="text-gray-900 mt-1">
                                {request.request.address || "N/A"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Country:</dt>
                              <dd className="text-gray-900 mt-1">
                                {request.request.country || "N/A"}
                              </dd>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4">
                              <div>
                                <dt className="text-gray-500">Tel:</dt>
                                <dd className="text-gray-900 mt-1">
                                  {request.request.tel || "N/A"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-gray-500">Email:</dt>
                                <dd className="text-gray-900 mt-1">
                                  {request.request.staffEmail || "N/A"}
                                </dd>
                              </div>
                            </div>
                            <div>
                              <dt className="text-gray-500">Purpose:</dt>
                              <dd className="text-gray-900 mt-1">
                                {request.request.purpose || "N/A"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">
                                Project PI MRCG:
                              </dt>
                              <dd className="text-gray-900 mt-1">
                                {request.request.projectPIMRCG || "N/A"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">SCC/Leo:</dt>
                              <dd className="text-gray-900 mt-1">
                                {request.request.sccLeo || "N/A"}
                              </dd>
                            </div>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {request.shipmentDetail?.overpackSummaries && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Overpack Summary
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Type
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Boxes
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Dimensions
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Ice Capacity
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Ice Used
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {request.shipmentDetail.overpackSummaries.map(
                                (summary, idx) => (
                                  <tr key={idx}>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {summary.overpackType}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {summary.totalOverpacks}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {summary.externalDimensions}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {parseFloat(
                                        summary.dryIceCapacity
                                      ).toFixed(2)}{" "}
                                      kg
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                      {parseFloat(summary.dryIceUsed).toFixed(
                                        2
                                      )}{" "}
                                      kg
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedForPrint(request);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Printer className="w-5 h-5 mr-2" />
                            Print Address Label
                          </button>
                        </div>
                      </div>
                    )}

                    {request.request.documents &&
                      request.request.documents.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Documents
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            {request.request.documents.map((doc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                  <span className="text-sm text-gray-900">
                                    {doc.fileName}
                                  </span>
                                </div>
                                <button className="p-1 hover:bg-gray-200 rounded">
                                  <ExternalLink className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>

{selectedForPrint && (
  <AddressLabelModal
    request={selectedForPrint}
    isOpen={!!selectedForPrint}
    onClose={() => setSelectedForPrint(null)}
  />
)}
</>
  );
}