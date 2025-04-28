import React, { useState, useContext, useCallback, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleUp,
  faArrowLeft,
  faExclamationTriangle,
  faSpinner,
  faFileAlt,
  faUpload,
  faCheckCircle,
  faSearch,
  faEye,
  faCalendarAlt,
  faCheckSquare,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { format } from "date-fns";
// import "../components/SampleShipmentAgreement.css";
import Select from "react-select";
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Col,
  Row,
  Card,
  CardBody,
  CardTitle,
  Collapse,
  Table,
  FormFeedback,
  Badge,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  FormText,
  UncontrolledTooltip,
} from "reactstrap";
import { UserContext } from "Context/UserContext";
import { pdf } from "@react-pdf/renderer";
import OverpackSelect from "./OverpackSelect";
import ShipmentAgreementPDF from "./ShipmentAgreementPDF";
import { useHistory } from "react-router-dom";
import PDFPreviewModal from "./PDFPreviewModal";

const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://apps.mrc.gm/bioship"
    : "https://localhost:7097";

const RequestStatus = {
  PENDING_REVIEW: 1,
  AWAITING_AGENT: 2,
  AWAITING_CHECKLIST: 3,
  SHIPPED: 4,
};

const overpackTypes = [
  {
    value: "TC-5",
    label: "TC-5",
    dimensions: "26.6 x 26.6 x 27.2",
    dryIceCapacity: 4.0,
  },
  {
    value: "TC-9",
    label: "TC-9",
    dimensions: "35.0 x 35.0 x 35.0",
    dryIceCapacity: 7.5,
  },
  {
    value: "TC-20",
    label: "TC-20",
    dimensions: "39.2 x 39.2 x 45.0",
    dryIceCapacity: 13.4,
  },
  {
    value: "TC-30",
    label: "TC-30",
    dimensions: "45.6 x 45.6 x 43.6",
    dryIceCapacity: 21.1,
  },
  {
    value: "TC-33",
    label: "TC-33",
    dimensions: "57.6 x 43.8 x 38.7",
    dryIceCapacity: 27.0,
  },
  {
    value: "TC-42",
    label: "TC-42",
    dimensions: "45.6 x 45.6 x 55.6",
    dryIceCapacity: 31.0,
  },
  {
    value: "TC-10",
    label: "TC-10",
    dimensions: "92.0 x 78.0 x 75.0",
    dryIceCapacity: 185.0,
  },
];

const OverpackLimits = {
  "TC-5": 1,
  "TC-9": 6,
  "TC-20": 8,
  "TC-30": 10,
  "TC-33": 12,
  "TC-42": 16,
  "TC-10": 20,
};

const styles = {
  container: {
    width: "100%",
    position: "relative",
    marginBottom: "2rem",
  },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    position: "relative",
  },
  table: {
    width: "100%",
    minWidth: "100%",
    margin: "0",
    borderCollapse: "separate",
    borderSpacing: "0",
  },
  tableHeader: {
    tableHeader: {
      backgroundColor: "#f8f9fa",
      padding: "1rem !important",
      borderBottom: "2px solid #dee2e6",
      whiteSpace: "nowrap",
    },
    tableCell: {
      padding: "1rem !important",
      verticalAlign: "middle",
      borderBottom: "1px solid #dee2e6",
      position: "relative",
    },
    overpackCell: {
      width: "300px",
      padding: "1rem",
      position: "relative",
      overflow: "visible",
    },
  },
  collapseButton: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    marginBottom: "1rem",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#e9ecef",
    },
  },
  collapseIcon: {
    transition: "transform 0.2s",
  },
  summarySection: {
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  selectContainer: {
    marginBottom: "0.5rem",
  },
  badge: {
    padding: "0.25rem 0.5rem",
    borderRadius: "0.25rem",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  usageIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.25rem 0",
  },
  tableWrapper: {
    width: "100%",
    position: "relative",
  },
};

const customStyles = {
  header: {
    style: {
      minHeight: "56px",
      padding: "0.75rem",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f8f9fa",
      borderBottom: "2px solid #dee2e6",
    },
  },
  headCells: {
    style: {
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "#495057",
      padding: "1rem",
    },
  },
  cells: {
    style: {
      padding: "1rem",
    },
  },
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    1: { color: "warning", label: "Pending Review", icon: faSpinner },
    6: { color: "info", label: "Awaiting Documents", icon: faFileAlt },
    7: { color: "primary", label: "Awaiting Agent", icon: faUpload },
    2: { color: "success", label: "Shipped", icon: faCheckCircle },
  };

  const config = statusConfig[status] || {
    color: "secondary",
    label: "Unknown",
    icon: faExclamationTriangle,
  };

  return (
    <Badge color={config.color} className="d-flex align-items-center p-2">
      <FontAwesomeIcon icon={config.icon} className="mr-2" />
      {config.label}
    </Badge>
  );
};

const SampleShipmentAgreement = ({ pendingRequests = [], refreshRequests }) => {
  const history = useHistory();
  const { token, refreshToken, logout } = useContext(UserContext);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [collapse1, setCollapse1] = useState(false);
  const [collapse2, setCollapse2] = useState(false);

  const [shipmentDetails, setShipmentDetails] = useState({
    totalWeightKg: "",
    agent: "",
    vatRegistration: "",
    eori: "",
    hsCode: "",
    incoterm: "",
    productDescription: "",
    overpackSummaries: [],
  });
  const [sampleDescriptions, setSampleDescriptions] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [otherAgent, setOtherAgent] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfContent, setPdfContent] = useState(null);

  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [shipmentDateModalOpen, setShipmentDateModalOpen] = useState(false);
  const [actualShipmentDate, setActualShipmentDate] = useState("");

  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredRequests = pendingRequests.filter((item) => {
    const matchesFilter =
      item.request.fullName.toLowerCase().includes(filterText.toLowerCase()) ||
      item.request.projectName
        .toLowerCase()
        .includes(filterText.toLowerCase()) ||
      item.request.chargeCode.toLowerCase().includes(filterText.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" ||
      item.request.statusId.toString() === selectedStatus;

    return matchesFilter && matchesStatus;
  });

  // Function to handle document upload
  const handleDocumentUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one document to upload");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("documents", file);
    });

    try {
      const response = await axios.post(
        `${baseURL}/api/Shipper/UploadDocuments/${selectedRequest.request.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Documents uploaded successfully");
        setUploadedDocuments((prev) => [...prev, ...response.data.documents]);
        setDocumentModalOpen(false);
        setSelectedFiles([]);
        refreshRequests();
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Failed to upload documents");
    }
  };

  // Function to handle actual shipment date submission
  const handleShipmentDateSubmit = async () => {
    if (!actualShipmentDate) {
      toast.error("Please select a shipment date");
      return;
    }

    try {
      const response = await axios.put(
        `${baseURL}/api/Shipper/UpdateActualShipmentDate/${selectedRequest.request.id}`,
        { actualShipmentDate },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Shipment date updated successfully");
        setShipmentDateModalOpen(false);
        refreshRequests();
      }
    } catch (error) {
      console.error("Error updating shipment date:", error);
      toast.error("Failed to update shipment date");
    }
  };

  const agentOptions = [
    { value: "Axon", label: "Axon" },
    { value: "Redcoat", label: "Redcoat" },
    { value: "MARKEN", label: "MARKEN" },
    { value: "World Courier", label: "World Courier" },
    { value: "FedEx", label: "FedEx" },
    { value: "DHL", label: "DHL" },
    { value: "other", label: "Other" },
  ];

  const sortedPendingRequests = pendingRequests.sort(
    (a, b) =>
      new Date(b.request.createdDateTime) - new Date(a.request.createdDateTime)
  );

  const handleActionClick = (request) => {
    setSelectedRequest(request);
    setShipmentDetails(
      request.shipmentDetail || {
        totalWeightKg: "",
        agent: "",
        vatRegistration: "",
        eori: "",
        hsCode: "",
        incoterm: "",
        productDescription: "",
        category: request.request.shipmentCategory || "",
        overpackSummaries: [],
      }
    );

    setSampleDescriptions(request.request.sampleDescriptions);
    const agents = request.shipmentDetail?.agent
      ? request.shipmentDetail.agent.split(", ")
      : [];
    setSelectedAgents(agents.map((agent) => ({ value: agent, label: agent })));
    setValidationErrors({});
  };

  const handleShipmentDetailsChange = (field, value) => {
    setShipmentDetails((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: null }));
  };

  // const fetchAvailableIds = useCallback(
  //   async (overpackType) => {
  //     try {
  //       const response = await axios.get(
  //         `${baseURL}/api/Shipper/AvailableOverpackIds/${overpackType}`,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );

  //       if (response.data && response.data.availableIds) {
  //         setGlobalAvailableIds((prevState) => ({
  //           ...prevState,
  //           [overpackType]: response.data.availableIds,
  //         }));
  //         setIdUsage((prevState) => ({
  //           ...prevState,
  //           [overpackType]: response.data.idUsage,
  //         }));

  //         // Get next available ID
  //         try {
  //           const nextIdResponse = await axios.get(
  //             `${baseURL}/api/Shipper/NextAvailableId`,
  //             { headers: { Authorization: `Bearer ${token}` } }
  //           );

  //           if (nextIdResponse.data?.nextId) {
  //             setGlobalNextId(nextIdResponse.data.nextId);
  //             setUsedIds(nextIdResponse.data.usedIds || {});
  //           }
  //         } catch (error) {
  //           console.error("Error fetching next ID:", error);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error fetching available overpack IDs:", error);
  //       toast.error("Failed to fetch available overpack IDs");
  //     }
  //   },
  //   [token]
  // );

  const handleOverpackTypeChange = async (index, selectedOption) => {
    try {
      console.log("Selected option:", selectedOption); // Debug log

      const updatedDescriptions = [...sampleDescriptions];
      updatedDescriptions[index] = {
        ...updatedDescriptions[index],
        overpackType: selectedOption.value,
        overpackID: null,
      };

      setSampleDescriptions(updatedDescriptions);

      // Add error logging to updateOverpackSummaries
      console.log("Before update:", updatedDescriptions);
      await updateOverpackSummaries(updatedDescriptions);
      console.log("After update:", shipmentDetails);
    } catch (error) {
      console.error("Error in handleOverpackTypeChange:", error);
      toast.error("Failed to update overpack type");
    }
  };

  const handleOverpackIDChange = (index, selectedId) => {
    setSampleDescriptions((prev) => {
      const updatedDescriptions = [...prev];
      updatedDescriptions[index] = {
        ...updatedDescriptions[index],
        overpackID: selectedId,
      };

      return updatedDescriptions; // Ensure state change triggers re-render
    });

    updateOverpackSummaries(sampleDescriptions);
  };

  const updateOverpackSummaries = useCallback(
    (descriptions) => {
      const summaries = new Map();

      // Process all samples that have both type and ID assigned
      descriptions.forEach((desc) => {
        if (desc.overpackType && desc.overpackID) {
          const key = `${desc.overpackType}-${desc.overpackID}`;

          if (!summaries.has(key)) {
            // Find matching overpack type info
            const overpackInfo = overpackTypes.find(
              (ot) => ot.value === desc.overpackType
            );
            if (overpackInfo) {
              summaries.set(key, {
                overpackType: desc.overpackType,
                overpackID: desc.overpackID,
                totalOverpacks: 1,
                externalDimensions: overpackInfo.dimensions,
                dryIceCapacity: overpackInfo.dryIceCapacity,
                sampleCount: 1,
                iceDisplaced: 0.6, // 0.6kg per sample
                dryIceUsed: 0,
              });
            }
          } else {
            // Update existing summary
            const summary = summaries.get(key);
            summary.sampleCount += 1;
            summary.iceDisplaced = summary.sampleCount * 0.6;
          }
        }
      });

      // Calculate final dry ice values and convert to array
      const finalSummaries = Array.from(summaries.values()).map((summary) => ({
        ...summary,
        dryIceUsed: Math.max(0, summary.dryIceCapacity - summary.iceDisplaced),
      }));

      console.log("Updating overpack summaries:", {
        descriptions: descriptions.map((d) => ({
          type: d.overpackType,
          id: d.overpackID,
        })),
        summaries: finalSummaries,
      });

      setShipmentDetails((prev) => ({
        ...prev,
        overpackSummaries: finalSummaries,
      }));
    },
    [overpackTypes]
  ); // Add any other dependencies your component needs

  // Add this useEffect to handle immediate updates
  useEffect(() => {
    if (sampleDescriptions?.length > 0) {
      updateOverpackSummaries(sampleDescriptions);
    }
  }, [sampleDescriptions, updateOverpackSummaries]);

  const handleAgentChange = (selectedOptions) => {
    setSelectedAgents(selectedOptions);
    const agentValues = selectedOptions.map((option) => option.value);
    handleShipmentDetailsChange("agent", agentValues.join(", "));
  };

  const handleOtherAgentChange = (e) => {
    setOtherAgent(e.target.value);
    updateAgentField(selectedAgents, e.target.value);
  };

  const updateAgentField = (selectedOptions, otherAgentValue = otherAgent) => {
    const agentValues = selectedOptions
      .filter((option) => option.value !== "other")
      .map((option) => option.value);

    if (
      selectedOptions.some((option) => option.value === "other") &&
      otherAgentValue
    ) {
      agentValues.push(otherAgentValue);
    }

    handleShipmentDetailsChange("agent", agentValues.join(", "));
  };

  const validateShipmentDetails = (details) => {
    const errors = {};

    // Only validate the absolutely essential fields
    if (!details.agent) {
      errors.agent = "Agent is required.";
    }

    if (!details.productDescription) {
      errors.productDescription = "Product Description is required.";
    }

    // Remove overpackSummaries validation since it's handled separately
    // and is derived from sample descriptions

    return errors;
  };

  const validateOverpackLimits = (overpackSummaries) => {
    const violations = [];
    overpackSummaries.forEach((summary) => {
      const limit = OverpackLimits[summary.overpackType];
      if (summary.sampleCount > limit) {
        violations.push({
          type: summary.overpackType,
          id: summary.overpackID,
          count: summary.sampleCount,
          limit: limit,
        });
      }
    });
    return violations;
  };

  const handleShipmentUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend = {
        ShipmentDetails: {
          ...shipmentDetails,
          totalWeightKg: parseFloat(shipmentDetails.totalWeightKg) || 0, // Default to 0 if empty
          category: shipmentDetails.category,
          SampleDescriptions: sampleDescriptions.map((sd) => ({
            id: sd.id,
            overpackType: sd.overpackType,
            overpackID: sd.overpackID,
          })),
        },
      };

      if (!shipmentDetails.category) {
        setValidationErrors((prev) => ({
          ...prev,
          category: "Please select a shipment category",
        }));
        setIsLoading(false);
        return;
      }

      const response = await axios.put(
        `${baseURL}/api/Shipper/UpdateShipmentDetails/${selectedRequest.request.id}`,
        dataToSend,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Shipment details updated successfully");
        if (selectedRequest.request.statusId === 1) {
          toast.info("Please upload the required shipping documents.");
          setDocumentModalOpen(true);
        }
        refreshRequests();
        generateAndDownloadPDF();
      } else {
        toast.error(
          response.data.message || "Failed to update shipment details"
        );
      }
    } catch (error) {
      console.error("Error updating shipment details:", error);
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Failed to update shipment details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateError = async (error) => {
    if (error.response && error.response.status === 400) {
      const serverErrors = error.response.data.errors;
      setValidationErrors(serverErrors);
      toast.error("Please correct the errors in the form.");
    } else if (error.response && error.response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        handleShipmentUpdate(new Event("submit"));
      } else {
        toast.error("Session expired. Please log in again.");
        logout();
      }
    } else {
      toast.error(`Error updating shipment details: ${error.message}`);
    }
  };

  const calculateTotalSummary = () => {
    const summary = {
      totalSampleCount: 0,
      totalOverpacks: 0,
      overpackTypes: new Set(),
      externalDimensions: new Set(),
      totalSampleVolume: 0,
      totalDryIce: 0,
      totalIceDisplaced: 0,
      totalWeightKg: shipmentDetails.totalWeightKg || 0,
    };

    shipmentDetails.overpackSummaries.forEach((overpack) => {
      summary.totalSampleCount += overpack.sampleCount;
      summary.totalOverpacks += overpack.totalOverpacks;
      summary.overpackTypes.add(overpack.overpackType);
      summary.externalDimensions.add(overpack.externalDimensions);

      const iceDisplaced = overpack.sampleCount * 0.6;
      summary.totalIceDisplaced += iceDisplaced * overpack.totalOverpacks;
      summary.totalDryIce += overpack.dryIceUsed * overpack.totalOverpacks;
    });

    sampleDescriptions.forEach((sample) => {
      summary.totalSampleVolume += parseFloat(sample.totalVolume) || 0;
    });

    // Check if total dry ice exceeds 200kg
    if (summary.totalDryIce > 200) {
      toast.warning(
        "Warning: Total dry ice exceeds 200kg! This may exceed aircraft limitations. Consider splitting the shipment into multiple consignments for safety and regulatory compliance.",
        {
          autoClose: false,
          position: "top-center",
          closeButton: true,
          closeOnClick: false,
        }
      );
    }

    return {
      ...summary,
      overpackTypes: Array.from(summary.overpackTypes).join(", "),
      externalDimensions: Array.from(summary.externalDimensions).join(", "),
      totalSampleVolume: summary.totalSampleVolume.toFixed(2),
      totalDryIce: summary.totalDryIce.toFixed(2),
      totalIceDisplaced: summary.totalIceDisplaced.toFixed(2),
    };
  };
  const downloadPDF = useCallback(async () => {
    if (!pdfContent) return;

    try {
      const blob = await pdf(pdfContent).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shipment_invoice_${selectedRequest.request.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded successfully");
      setIsPdfModalOpen(false);
      history.push("/admin/shipper-requests", { newRequest: true });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  }, [pdfContent, selectedRequest, history]);

  const generateAndDownloadPDF = useCallback(async () => {
    if (!selectedRequest || !shipmentDetails) {
      console.error("No request or shipment details available");
      toast.error(
        "Unable to generate PDF: Missing request or shipment details."
      );
      return;
    }

    try {
      console.log("Generating PDF with data:", {
        request: selectedRequest.request,
        shipmentDetails,
      });

      // Split agents string and generate PDF for each agent
      const agents = shipmentDetails.agent.split(", ");

      for (const agent of agents) {
        const content = (
          <ShipmentAgreementPDF
            request={selectedRequest.request}
            shipmentDetails={{ ...shipmentDetails, agent }}
          />
        );

        const blob = await pdf(content).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `shipment_invoice_${selectedRequest.request.id}_${agent}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success(`${agents.length} Invoice PDF(s) downloaded successfully`);
      setTimeout(() => {
        history.push("/admin/shipper-requests", { newRequest: true });
      }, 2000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        `Failed to generate PDF: ${error.message}. Please try again.`
      );
    }
  }, [selectedRequest, shipmentDetails, history]);

  const subHeaderComponent = (
    <div className="w-100 d-flex justify-content-between align-items-center mb-3">
      <div className="d-flex align-items-center">
        <InputGroup style={{ width: "300px" }}>
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <FontAwesomeIcon icon={faSearch} />
            </InputGroupText>
          </InputGroupAddon>
          <Input
            type="text"
            placeholder="Search by name, project, or code..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </InputGroup>
        <Select
          className="ml-3"
          value={{ value: selectedStatus, label: "Filter by Status" }}
          onChange={(option) => setSelectedStatus(option.value)}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "1", label: "Pending Review" },
            { value: "6", label: "Awaiting Documents" },
            { value: "7", label: "Awaiting Agent" },
            { value: "2", label: "Shipped" },
          ]}
          styles={{ container: (base) => ({ ...base, width: "200px" }) }}
        />
      </div>
      <div>
        <span className="text-muted mr-3">
          Total Requests: {filteredRequests.length}
        </span>
      </div>
    </div>
  );

  const columns = [
    {
      name: "Status",
      selector: (row) => row.request.statusId,
      sortable: true,
      cell: (row) => <StatusBadge status={row.request.statusId} />,
      width: "180px",
    },
    {
      name: "Requestor",
      selector: (row) => row.request.fullName,
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-weight-bold">{row.request.fullName}</div>
          <div className="text-muted small">{row.request.staffEmail}</div>
        </div>
      ),
      width: "250px",
    },
    {
      name: "Project",
      selector: (row) => row.request.projectName,
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-weight-bold">{row.request.projectName}</div>
          <div className="text-muted small">
            Code: {row.request.chargeCode}
            {row.request.isHazardous && (
              <Badge color="danger" pill className="ml-2">
                Hazardous
              </Badge>
            )}
          </div>
        </div>
      ),
      width: "250px",
    },
    {
      name: "Samples",
      selector: (row) => row.request.sampleDescriptions?.length || 0,
      sortable: true,
      cell: (row) => {
        const totalSamples =
          row.request.sampleDescriptions?.reduce(
            (sum, desc) => sum + desc.totalNumber,
            0
          ) || 0;
        return (
          <div>
            <div>{totalSamples} samples</div>
            <div className="text-muted small">
              {row.request.sampleDescriptions?.length || 0} description(s)
            </div>
          </div>
        );
      },
      width: "150px",
    },
    {
      name: "Shipment Mode",
      cell: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.request.shipmentModes.map((mode, index) => (
            <Badge key={index} color="light" className="mr-1 p-2">
              {mode}
            </Badge>
          ))}
        </div>
      ),
      width: "200px",
    },
    {
      name: "Submitted",
      selector: (row) => row.request.createdDateTime,
      sortable: true,
      cell: (row) =>
        format(new Date(row.request.createdDateTime), "MMM dd, yyyy"),
      width: "150px",
    },
    {
      name: "Actions",
      cell: (row) => {
        const buttonId = `action-button-${row.request.id}`;
        const actionConfig = {
          1: {
            color: "primary",
            icon: faEye,
            label: "Review",
            tooltip: "Review and update shipment details",
          },
          6: {
            color: "info",
            icon: faUpload,
            label: "Upload",
            tooltip: "Upload shipping documents",
          },
          7: {
            color: "success",
            icon: faCalendarAlt,
            label: "Set Date",
            tooltip: "Set actual shipment date",
          },
        }[row.request.statusId] || {
          color: "secondary",
          icon: faEye,
          label: "View",
          tooltip: "View request details",
        };

        return (
          <>
            <Button
              color={actionConfig.color}
              size="sm"
              onClick={() => handleActionClick(row)}
              id={buttonId}
            >
              <FontAwesomeIcon icon={actionConfig.icon} className="mr-2" />
              {actionConfig.label}
            </Button>
            <UncontrolledTooltip placement="left" target={buttonId}>
              {actionConfig.tooltip}
            </UncontrolledTooltip>
          </>
        );
      },
      width: "150px",
      right: true,
    },
  ];

  return (
    <div className="form-container">
      <Card>
        <CardBody>
          <Row className="align-items-center mb-4">
            <Col>
              <CardTitle tag="h5" className="m-0">
                {selectedRequest
                  ? "Update Shipment Agreement"
                  : "Pending Sample Requests"}
              </CardTitle>
            </Col>
            {selectedRequest && (
              <Col xs="auto">
                <Button
                  color="secondary"
                  onClick={() => setSelectedRequest(null)}
                  className="btn-sm"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back to Requests
                </Button>
              </Col>
            )}
          </Row>
          {!selectedRequest ? (
            <>
              {sortedPendingRequests.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  No pending requests found
                </p>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Project
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date Submitted
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Shipment Mode
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedPendingRequests.map((request) => (
                        <tr
                          key={request.request.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {request.request.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.request.projectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(
                              new Date(request.request.createdDateTime),
                              "MMM dd, yyyy"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.request.shipmentModes.join(", ")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleActionClick(request)}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded-md transition-colors duration-200"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <Form onSubmit={handleShipmentUpdate}>
              <h5 className="mb-3">Request Information</h5>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>User Name</Label>
                    <Input value={selectedRequest.request.fullName} readOnly />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Email</Label>
                    <Input
                      value={selectedRequest.request.staffEmail}
                      readOnly
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Charge Code</Label>
                    <Input
                      value={selectedRequest.request.chargeCode}
                      readOnly
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Project Name</Label>
                    <Input
                      value={selectedRequest.request.projectName}
                      readOnly
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>SCC/Leo</Label>
                    <Input value={selectedRequest.request.sccLeo} readOnly />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Project PI MRCG</Label>
                    <Input
                      value={selectedRequest.request.projectPIMRCG}
                      readOnly
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label>Shipment Modes</Label>
                    <Input
                      value={selectedRequest.request.shipmentModes.join(", ")}
                      readOnly
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Is Hazardous</Label>
                    <Input
                      value={selectedRequest.request.isHazardous ? "Yes" : "No"}
                      readOnly
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Has MTA</Label>
                    <Input
                      value={selectedRequest.request.hasMTA ? "Yes" : "No"}
                      readOnly
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label>Purpose</Label>
                    <Input value={selectedRequest.request.purpose} readOnly />
                  </FormGroup>
                </Col>
              </Row>
            
              <h5 className="mt-4 mb-3">Consignee Information</h5>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Consignee Name</Label>
                    <Input
                      value={selectedRequest.request.consigneeName}
                      readOnly
                      style={{
                        backgroundColor: "#e9ecef",
                        color: "#495057",
                        cursor: "default",
                      }}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Email</Label>
                    <Input
                      value={selectedRequest.request.consigneeEmail}
                      readOnly
                      style={{
                        backgroundColor: "#e9ecef",
                        color: "#495057",
                        cursor: "default",
                      }}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Tel</Label>
                    <Input
                      value={selectedRequest.request.tel}
                      readOnly
                      style={{
                        backgroundColor: "#e9ecef",
                        color: "#495057",
                        cursor: "default",
                      }}
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Address</Label>
                    <Input
                      type="textarea"
                      value={selectedRequest.request.address}
                      readOnly
                      style={{
                        backgroundColor: "#e9ecef",
                        color: "#495057",
                        cursor: "default",
                        minHeight: "158px", 
                      }}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Card className="mt-4 mb-4 border-left-4 border-info">
                <CardBody>
                  <h5 className="mb-3 text-info">
                    <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
                    Transfer of Biological Samples Guarantee & Ledger Entry
                  </h5>

                  <Card className="mb-2">
                    {/* <CardBody>
    <h6>Debug Information:</h6>
    <pre>{JSON.stringify({
      aliquotsLeft: selectedRequest.request.aliquotsLeft,
      noThirdParty: selectedRequest.request.noThirdParty,
      aidsApproval: selectedRequest.request.aidsApproval, 
      purposeOnly: selectedRequest.request.purposeOnly,
      isHazardous: selectedRequest.request.isHazardous,
      hasMTA: selectedRequest.request.hasMTA
    }, null, 2)}</pre>
  </CardBody> */}
                  </Card>
                  <Table bordered responsive className="guarantee-table">
                    <thead>
                      <tr className="bg-light">
                        <th style={{ width: "70%" }}>Guarantee Statement</th>
                        <th style={{ width: "15%" }} className="text-center">
                          Status
                        </th>
                        <th style={{ width: "15%" }} className="text-center">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          Aliquots of the sample, appropriately labelled, have
                          been left in The Gambia together with relevant
                          documentation.
                        </td>
                        <td className="text-center">
                          {selectedRequest.request.aliquotsLeft ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-success fa-lg"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="text-warning fa-lg"
                            />
                          )}
                        </td>
                        <td className="text-center">
                          <Badge
                            color={
                              selectedRequest.request.aliquotsLeft
                                ? "success"
                                : "warning"
                            }
                            pill
                          >
                            {selectedRequest.request.aliquotsLeft
                              ? "YES"
                              : "NO"}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          These samples will not be passed on in whole or in
                          part to a third party without permission from The
                          Gambia Government/MRC Ethical Committee.
                        </td>
                        <td className="text-center">
                          {selectedRequest.request.noThirdParty ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-success fa-lg"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="text-warning fa-lg"
                            />
                          )}
                        </td>
                        <td className="text-center">
                          <Badge
                            color={
                              selectedRequest.request.noThirdParty
                                ? "success"
                                : "warning"
                            }
                            pill
                          >
                            {selectedRequest.request.noThirdParty
                              ? "YES"
                              : "NO"}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          The approval of the National AIDS Committee has been
                          obtained for the transfer of any samples relating to
                          AIDS patients or AIDS research.
                        </td>
                        <td className="text-center">
                          {selectedRequest.request.aidsApproval ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-success fa-lg"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="text-warning fa-lg"
                            />
                          )}
                        </td>
                        <td className="text-center">
                          <Badge
                            color={
                              selectedRequest.request.aidsApproval
                                ? "success"
                                : "warning"
                            }
                            pill
                          >
                            {selectedRequest.request.aidsApproval
                              ? "YES"
                              : "NO"}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          The samples will not be used for any other purpose
                          other than for which approval was given.
                        </td>
                        <td className="text-center">
                          {selectedRequest.request.purposeOnly ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-success fa-lg"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="text-warning fa-lg"
                            />
                          )}
                        </td>
                        <td className="text-center">
                          <Badge
                            color={
                              selectedRequest.request.purposeOnly
                                ? "success"
                                : "warning"
                            }
                            pill
                          >
                            {selectedRequest.request.purposeOnly ? "YES" : "NO"}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
              {/* Add a dedicated card for hazardous material and MTA information */}
              <Card className="mb-4 border-left-4 border-warning">
                <CardBody>
                  <h5 className="mb-3 text-warning">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="mr-2"
                    />
                    Important Sample Information
                  </h5>

                  <Row>
                    <Col md={6}>
                      <div className="d-flex align-items-center mb-3">
                        <div
                          className="mr-3"
                          style={{ width: "40px", textAlign: "center" }}
                        >
                          <FontAwesomeIcon
                            icon={
                              selectedRequest.request.isHazardous
                                ? faExclamationTriangle
                                : faCheckCircle
                            }
                            className={
                              selectedRequest.request.isHazardous
                                ? "text-danger fa-2x"
                                : "text-success fa-2x"
                            }
                          />
                        </div>
                        <div>
                          <p className="font-weight-bold mb-0">
                            Is Material Hazardous?
                          </p>
                          <Badge
                            color={
                              selectedRequest.request.isHazardous
                                ? "danger"
                                : "success"
                            }
                            pill
                            className="mt-1"
                          >
                            {selectedRequest.request.isHazardous
                              ? "YES - HAZARDOUS"
                              : "NO - NOT HAZARDOUS"}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center mb-3">
                        <div
                          className="mr-3"
                          style={{ width: "40px", textAlign: "center" }}
                        >
                          <FontAwesomeIcon
                            icon={
                              selectedRequest.request.hasMTA
                                ? faCheckCircle
                                : faExclamationTriangle
                            }
                            className={
                              selectedRequest.request.hasMTA
                                ? "text-success fa-2x"
                                : "text-warning fa-2x"
                            }
                          />
                        </div>
                        <div>
                          <p className="font-weight-bold mb-0">
                            Material Transfer Agreement (MTA)
                          </p>
                          <Badge
                            color={
                              selectedRequest.request.hasMTA
                                ? "success"
                                : "warning"
                            }
                            pill
                            className="mt-1"
                          >
                            {selectedRequest.request.hasMTA
                              ? "YES - MTA IS AVAILABLE"
                              : "NO - MTA NOT AVAILABLE"}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Add more important information if needed */}
                  {selectedRequest.request.isHazardous && (
                    <Alert color="danger" className="mt-3">
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="mr-2"
                      />
                      <strong>Warning:</strong> This shipment contains hazardous
                      materials and requires special handling procedures. Ensure
                      all appropriate hazardous materials documentation is
                      complete.
                    </Alert>
                  )}

                  {!selectedRequest.request.hasMTA && (
                    <Alert color="warning" className="mt-3">
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="mr-2"
                      />
                      <strong>Note:</strong> No Material Transfer Agreement
                      (MTA) is available for this shipment. Verify if one is
                      required before proceeding.
                    </Alert>
                  )}
                </CardBody>
              </Card>
              <div className="accordion-container mt-4">
                <Button
                  color="secondary"
                  block
                  onClick={() => setCollapse1(!collapse1)}
                  className="mb-3"
                >
                  {collapse1 ? "Hide" : "Show"} Sample Descriptions
                  <FontAwesomeIcon
                    icon={collapse1 ? faAngleUp : faAngleDown}
                    className="ml-2"
                  />
                </Button>
                <Collapse isOpen={collapse1}>
                  <div className="relative min-h-fit">
                    <div className="bg-white rounded-lg border border-gray-200 shadow overflow-visible">
                      <Table
                        className="min-w-full table-fixed overflow-visible divide-y divide-gray-200"
                        bordered
                      >
                        <thead>
                          <tr>
                            <th className="w-1/6 px-4 py-3 font-medium text-gray-500">
                              Sample Type
                            </th>
                            <th className="w-1/6 px-4 py-3 font-medium text-gray-500">
                              Container Type
                            </th>
                            <th className="w-1/6 px-4 py-3 font-medium text-gray-500">
                              Box ID
                            </th>
                            <th className="w-1/6 px-4 py-3 font-medium text-gray-500">
                              Total Number
                            </th>
                            <th className="w-1/6 px-4 py-3 font-medium text-gray-500">
                              Total Volume (ml)
                            </th>
                            <th className="w-1/6 px-4 py-3 font-medium text-gray-500">
                              Overpack Assignment
                            </th>
                          </tr>
                        </thead>
                        <tbody className="relative divide-y divide-gray-200">
                          {sampleDescriptions.map((sample, index) => (
                            <tr key={index} className="group hover:bg-gray-50">
                              <td className="px-4 py-3">{sample.sampleType}</td>
                              <td className="px-4 py-3">
                                {sample.containerType}
                              </td>
                              <td className="px-4 py-3">{sample.boxID}</td>
                              <td className="px-4 py-3">
                                {sample.totalNumber}
                              </td>
                              <td className="px-4 py-3">
                                {sample.totalVolume}
                              </td>
                              <td
                                className={`px-4 py-3 relative overflow-visible ${
                                  sampleDescriptions.length - index
                                }`}
                              >
                                <div
                                  className={`relative overflow-visible`}
                                  style={{ zIndex: 999 - index }}
                                >
                                  <OverpackSelect
                                    sample={sample}
                                    index={index}
                                    overpackTypes={overpackTypes}
                                    onTypeChange={handleOverpackTypeChange}
                                    onIdChange={handleOverpackIDChange}
                                    disabled={isLoading}
                                    allSamples={sampleDescriptions}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">
                      Overpack Summaries
                    </h5>
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                      <Table responsive bordered>
                        <tbody>
                          {Object.entries(calculateTotalSummary()).map(
                            ([key, value]) => (
                              <tr key={key}>
                                <th>
                                  {key === "totalSampleCount"
                                    ? "Total Box Count"
                                    : key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                </th>
                                <td>
                                  {key === "totalDryIce" &&
                                  parseFloat(value) > 200 ? (
                                    <div className="d-flex align-items-center justify-content-between">
                                      <span>{value}</span>
                                      <span className="text-danger ml-2">
                                        <FontAwesomeIcon
                                          icon={faExclamationTriangle}
                                          className="mr-1"
                                        />
                                        Exceeds 200kg limit!
                                      </span>
                                    </div>
                                  ) : (
                                    value
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </Table>
                      <Table responsive bordered>
                        <thead>
                          <tr>
                            <th>Overpack Type</th>
                            <th>Overpack ID</th>
                            <th>Total Overpacks</th>
                            <th>External Dimensions</th>
                            <th>Dry Ice Capacity (kg)</th>
                            <th>Box Count</th>
                            <th>Ice Displaced (kg)</th>
                            <th>Dry Ice Used (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipmentDetails.overpackSummaries.map(
                            (summary, index) => (
                              <tr key={index}>
                                <td>{summary.overpackType}</td>
                                <td>{summary.overpackID}</td>
                                <td>{summary.totalOverpacks}</td>
                                <td>{summary.externalDimensions}</td>
                                <td>{summary.dryIceCapacity}</td>
                                <td>{summary.sampleCount}</td>
                                <td>{summary.iceDisplaced.toFixed(2)}</td>
                                <td>{summary.dryIceUsed.toFixed(2)}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Collapse>
              </div>
              <div className="accordion-container mt-4">
                <Button
                  color="secondary"
                  block
                  onClick={() => setCollapse2(!collapse2)}
                  className="mb-3"
                >
                  {collapse2 ? "Hide" : "Show"} Shipment Details
                  <FontAwesomeIcon
                    icon={collapse2 ? faAngleUp : faAngleDown}
                    className="ml-2"
                  />
                </Button>

                <Collapse isOpen={collapse2}>
                  <Card className="mb-4">
                    <CardBody>
                      <h5 className="mb-3">Shipment Details</h5>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label>VAT Registration</Label>
                            <Input
                              value={shipmentDetails.vatRegistration}
                              onChange={(e) =>
                                handleShipmentDetailsChange(
                                  "vatRegistration",
                                  e.target.value
                                )
                              }
                            />
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>EORI</Label>
                            <Input
                              value={shipmentDetails.eori}
                              onChange={(e) =>
                                handleShipmentDetailsChange(
                                  "eori",
                                  e.target.value
                                )
                              }
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label>HS Code</Label>
                            <Input
                              value={shipmentDetails.hsCode}
                              onChange={(e) =>
                                handleShipmentDetailsChange(
                                  "hsCode",
                                  e.target.value
                                )
                              }
                            />
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Incoterm</Label>
                            <Input
                              value={shipmentDetails.incoterm}
                              onChange={(e) =>
                                handleShipmentDetailsChange(
                                  "incoterm",
                                  e.target.value
                                )
                              }
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Total Weight (Kg)</Label>
                            <Input
                              type="number"
                              value={shipmentDetails.totalWeightKg}
                              onChange={(e) =>
                                handleShipmentDetailsChange(
                                  "totalWeightKg",
                                  e.target.value
                                )
                              }
                              invalid={!!validationErrors.totalWeightKg}
                            />
                            <FormFeedback>
                              {validationErrors.totalWeightKg}
                            </FormFeedback>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>Shipment Category</Label>
                            <Select
                              value={
                                shipmentDetails.category
                                  ? {
                                      value: shipmentDetails.category,
                                      label: `Category ${shipmentDetails.category}`,
                                    }
                                  : null
                              }
                              onChange={(selected) =>
                                handleShipmentDetailsChange(
                                  "category",
                                  selected.value
                                )
                              }
                              options={[
                                { value: "A", label: "Category A" },
                                { value: "B", label: "Category B" },
                              ]}
                              placeholder="Select category"
                              className={
                                validationErrors.category ? "is-invalid" : ""
                              }
                            />
                            {validationErrors.category && (
                              <FormFeedback>
                                {validationErrors.category}
                              </FormFeedback>
                            )}
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12}>
                          <FormGroup>
                            <Label>Agent(s)</Label>
                            <Select
                              isMulti
                              options={agentOptions}
                              value={selectedAgents}
                              onChange={handleAgentChange}
                              isOptionDisabled={() =>
                                selectedAgents.length >= 3
                              }
                            />
                            {selectedAgents.some(
                              (agent) => agent.value === "other"
                            ) && (
                              <Input
                                type="text"
                                value={otherAgent}
                                onChange={handleOtherAgentChange}
                                placeholder="Enter other agent"
                                className="mt-2"
                              />
                            )}
                            {validationErrors.agent && (
                              <FormFeedback className="d-block">
                                {validationErrors.agent}
                              </FormFeedback>
                            )}
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12}>
                          <FormGroup>
                            <Label>Product Description</Label>
                            <Input
                              type="textarea"
                              value={shipmentDetails.productDescription}
                              onChange={(e) =>
                                handleShipmentDetailsChange(
                                  "productDescription",
                                  e.target.value
                                )
                              }
                              invalid={!!validationErrors.productDescription}
                            />
                            <FormFeedback>
                              {validationErrors.productDescription}
                            </FormFeedback>
                          </FormGroup>
                        </Col>
                      </Row>
                      <h5 className="mt-4 mb-3">Total Summary</h5>
                      <Table responsive bordered>
                        <tbody>
                          {Object.entries(calculateTotalSummary()).map(
                            ([key, value]) => (
                              <tr key={key}>
                                <th>
                                  {key === "totalSampleCount"
                                    ? "Total Box Count"
                                    : key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                </th>
                                <td>{value}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Collapse>
              </div>
              <Button
                color="primary"
                type="submit"
                disabled={isLoading}
                block
                className="mt-4"
              >
                {isLoading ? "Updating..." : "Update Shipment Details"}
              </Button>
            </Form>
          )}
        </CardBody>
      </Card>

      {/* Document Upload Modal */}
      <Modal
        isOpen={documentModalOpen}
        toggle={() => setDocumentModalOpen(false)}
      >
        <ModalHeader toggle={() => setDocumentModalOpen(false)}>
          <FontAwesomeIcon icon={faUpload} className="mr-2" />
          Upload Shipping Documents
        </ModalHeader>
        <ModalBody>
          <div className="mb-4">
            <Alert color="info">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              Please upload all required shipping documents:
              <ul className="mt-2 mb-0">
                <li>Commercial Invoice</li>
                <li>Packing List</li>
                <li>Export Declaration</li>
                <li>Other relevant documents</li>
              </ul>
            </Alert>
          </div>
          <FormGroup>
            <Label for="documents">Select Documents</Label>
            <Input
              type="file"
              id="documents"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
            <FormText color="muted">
              Accepted formats: PDF, Word, Excel
            </FormText>
          </FormGroup>
          {uploadedDocuments.length > 0 && (
            <div className="mt-3">
              <Label>Already Uploaded Documents:</Label>
              <div className="border rounded p-2">
                {uploadedDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <div>
                      <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                      {doc.fileName}
                    </div>
                    <small className="text-muted">
                      {format(new Date(doc.uploadDate), "MMM dd, yyyy HH:mm")}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={handleDocumentUpload}
            disabled={selectedFiles.length === 0}
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            Upload Documents
          </Button>
          <Button color="secondary" onClick={() => setDocumentModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Shipment Date Modal */}
      <Modal
        isOpen={shipmentDateModalOpen}
        toggle={() => setShipmentDateModalOpen(false)}
      >
        <ModalHeader toggle={() => setShipmentDateModalOpen(false)}>
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
          Set Actual Shipment Date
        </ModalHeader>
        <ModalBody>
          <Alert color="info">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
            Please confirm the actual shipment date received from the agent.
          </Alert>
          <FormGroup>
            <Label for="shipmentDate">Shipment Date</Label>
            <Input
              type="date"
              id="shipmentDate"
              value={actualShipmentDate}
              onChange={(e) => setActualShipmentDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={handleShipmentDateSubmit}
            disabled={!actualShipmentDate}
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Confirm Shipment
          </Button>
          <Button
            color="secondary"
            onClick={() => setShipmentDateModalOpen(false)}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Status-specific action buttons in the main form */}
      {selectedRequest && (
        <div className="status-actions mt-4">
          {selectedRequest.request.statusId === 6 && (
            <Button
              color="info"
              block
              onClick={() => setDocumentModalOpen(true)}
              className="mb-2"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2" />
              Upload Required Documents
            </Button>
          )}
          {selectedRequest.request.statusId === 7 && (
            <Button
              color="success"
              block
              onClick={() => setShipmentDateModalOpen(true)}
              className="mb-2"
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
              Set Actual Shipment Date
            </Button>
          )}
        </div>
      )}

      <PDFPreviewModal
        isOpen={isPdfModalOpen}
        toggle={() => setIsPdfModalOpen(!isPdfModalOpen)}
        pdfContent={pdfContent}
        downloadPDF={downloadPDF}
      />
    </div>
  );
};

export default SampleShipmentAgreement;
